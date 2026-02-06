import 'dotenv/config';

type VendureAsset = {
  id: string;
  name?: string | null;
  source?: string | null;
};

type IconProduct = {
  id: string;
  name: string;
  slug: string;
  featuredAsset?: VendureAsset | null;
  assets: VendureAsset[];
  customFields?: {
    isIconProduct?: boolean | null;
    iconId?: string | null;
    insertAssetId?: string | null;
  } | null;
};

type Args = {
  endpoint: string;
  username: string;
  password: string;
  take: number;
  apply: boolean;
  force: boolean;
  verbose: boolean;
};

function usage(exitCode = 0) {
  const text = `
Backfill Product.customFields.insertAssetId for icon products.

By default this is a dry-run. Use --apply to write changes.

Usage:
  ts-node -r dotenv/config scripts/backfill-insert-asset-id.ts [options]

Options:
  --endpoint <url>    Admin API GraphQL endpoint (default: http://localhost:3000/admin-api)
  --username <user>   Admin username (default: SUPERADMIN_USERNAME or "superadmin")
  --password <pass>   Admin password (default: SUPERADMIN_PASSWORD or "superadmin")
  --take <n>          Page size when fetching products (default: 200)
  --apply             Actually write updates (default: false)
  --force             Overwrite existing insertAssetId (default: false)
  --verbose           Extra logging (default: false)
  -h, --help          Show help

Examples:
  # Dry run
  pnpm -C apps/backend backfill:insert-asset-id

  # Apply changes
  pnpm -C apps/backend backfill:insert-asset-id -- --apply
`.trim();

  // eslint-disable-next-line no-console
  console.log(text);
  process.exit(exitCode);
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    endpoint: 'http://localhost:3000/admin-api',
    username: process.env.SUPERADMIN_USERNAME ?? 'superadmin',
    password: process.env.SUPERADMIN_PASSWORD ?? 'superadmin',
    take: 200,
    apply: false,
    force: false,
    verbose: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') continue; // pnpm passes args as: script -- --flag
    if (a === '-h' || a === '--help') usage(0);
    if (a === '--apply') {
      out.apply = true;
      continue;
    }
    if (a === '--force') {
      out.force = true;
      continue;
    }
    if (a === '--verbose') {
      out.verbose = true;
      continue;
    }

    const readValue = () => {
      const v = argv[i + 1];
      if (!v || v.startsWith('-')) usage(1);
      i++;
      return v;
    };

    if (a === '--endpoint') {
      out.endpoint = readValue();
      continue;
    }
    if (a === '--username') {
      out.username = readValue();
      continue;
    }
    if (a === '--password') {
      out.password = readValue();
      continue;
    }
    if (a === '--take') {
      const raw = readValue();
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) usage(1);
      out.take = n;
      continue;
    }

    // Unknown
    usage(1);
  }

  return out;
}

function cookieHeaderFromSetCookie(setCookies: string[]): string {
  // Convert ["a=1; Path=/; HttpOnly", "b=2; Path=/"] -> "a=1; b=2"
  return setCookies
    .map((c) => c.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

async function graphql<TData>(
  endpoint: string,
  query: string,
  variables: Record<string, unknown>,
  cookie?: string,
): Promise<{ data: TData; setCookies: string[] }> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const setCookies = res.headers.getSetCookie?.() ?? [];
  const json = (await res.json()) as { data?: TData; errors?: Array<{ message: string }> };
  if (!res.ok || json.errors?.length) {
    const msg = json.errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if (!json.data) {
    throw new Error('Missing GraphQL response data');
  }
  return { data: json.data, setCookies };
}

async function login(endpoint: string, username: string, password: string): Promise<string> {
  const mutation = `
    mutation Login($username: String!, $password: String!) {
      login(username: $username, password: $password, rememberMe: true) {
        __typename
        ... on CurrentUser { id identifier }
        ... on ErrorResult { message }
      }
    }
  `;

  const { data, setCookies } = await graphql<{
    login:
      | { __typename: 'CurrentUser'; id: string; identifier: string }
      | { __typename: string; message?: string };
  }>(endpoint, mutation, { username, password });

  if (data.login.__typename !== 'CurrentUser') {
    const msg = 'message' in data.login ? data.login.message : undefined;
    throw new Error(msg ?? `Login failed: ${data.login.__typename}`);
  }

  const cookie = cookieHeaderFromSetCookie(setCookies);
  if (!cookie) throw new Error('Login succeeded but no session cookie was returned');
  return cookie;
}

function norm(s?: string | null) {
  return (s ?? '').toString().trim().toLowerCase();
}

function detectInsertAsset(product: IconProduct): { asset: VendureAsset | null; reason: string } {
  const assets = product.assets ?? [];
  const featuredId = product.featuredAsset?.id?.toString();
  const nonFeatured = assets.filter((a) => a?.id?.toString() && a.id.toString() !== featuredId);

  if (assets.length === 0) return { asset: null, reason: 'no assets' };
  if (nonFeatured.length === 0) return { asset: null, reason: 'no non-featured assets' };
  if (nonFeatured.length === 1) return { asset: nonFeatured[0], reason: 'only non-featured asset' };

  // Multiple candidates: try filename/name hints
  const byHint = (a: VendureAsset) => {
    // The `source` URL usually contains the original filename.
    const n = `${norm(a.name)} ${norm(a.source)}`;
    return (
      n.includes('insert') ||
      n.includes('matte') ||
      n.includes('overlay') ||
      n.includes('slot') ||
      n.includes('mask')
    );
  };
  const hintMatch = nonFeatured.find(byHint);
  if (hintMatch) return { asset: hintMatch, reason: 'matched by filename/name hint' };

  // Last resort: pick the first non-featured asset.
  return { asset: nonFeatured[0], reason: 'fallback: first non-featured asset (ambiguous)' };
}

async function fetchAllIconProducts(endpoint: string, cookie: string, take: number): Promise<IconProduct[]> {
  const query = `
    query Products($options: ProductListOptions) {
      products(options: $options) {
        totalItems
        items {
          id
          name
          slug
          featuredAsset { id name source }
          assets { id name source }
          customFields {
            isIconProduct
            iconId
            insertAssetId
          }
        }
      }
    }
  `;

  const all: IconProduct[] = [];
  let skip = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await graphql<{
      products: { totalItems: number; items: IconProduct[] };
    }>(endpoint, query, { options: { take, skip } }, cookie);

    const items = data.products.items ?? [];
    all.push(...items);
    skip += items.length;
    if (skip >= data.products.totalItems || items.length === 0) break;
  }

  return all.filter((p) => !!p?.customFields?.isIconProduct);
}

async function updateInsertAssetId(
  endpoint: string,
  cookie: string,
  productId: string,
  insertAssetId: string,
): Promise<void> {
  const mutation = `
    mutation UpdateProduct($input: UpdateProductInput!) {
      updateProduct(input: $input) {
        id
        customFields { insertAssetId }
      }
    }
  `;

  await graphql(endpoint, mutation, { input: { id: productId, customFields: { insertAssetId } } }, cookie);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // eslint-disable-next-line no-console
  console.log(
    `${args.apply ? 'APPLY' : 'DRY RUN'}: backfilling insertAssetId via ${args.endpoint} (take=${args.take})`,
  );

  const cookie = await login(args.endpoint, args.username, args.password);
  const products = await fetchAllIconProducts(args.endpoint, cookie, args.take);

  // eslint-disable-next-line no-console
  console.log(`Found ${products.length} icon products`);

  let updated = 0;
  let skipped = 0;
  let ambiguous = 0;

  for (const p of products) {
    const iconId = p.customFields?.iconId?.toString().trim();
    const existing = p.customFields?.insertAssetId?.toString().trim();

    if (existing && !args.force) {
      skipped++;
      if (args.verbose) {
        // eslint-disable-next-line no-console
        console.log(`- skip ${p.id} ${iconId ? `(${iconId}) ` : ''}${p.slug}: already set (${existing})`);
      }
      continue;
    }

    const { asset, reason } = detectInsertAsset(p);
    if (!asset) {
      skipped++;
      // eslint-disable-next-line no-console
      console.log(`- skip ${p.id} ${iconId ? `(${iconId}) ` : ''}${p.slug}: ${reason}`);
      continue;
    }

    if (reason.includes('ambiguous')) ambiguous++;

    const line = `- ${args.apply ? 'set' : 'would set'} ${p.id} ${iconId ? `(${iconId}) ` : ''}${
      p.slug
    }: insertAssetId=${asset.id} (${reason})`;
    // eslint-disable-next-line no-console
    console.log(line);

    if (args.apply) {
      await updateInsertAssetId(args.endpoint, cookie, p.id, asset.id.toString());
      updated++;
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `Done. ${args.apply ? 'Updated' : 'Would update'}=${updated}, skipped=${skipped}, ambiguous=${ambiguous}`,
  );
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
