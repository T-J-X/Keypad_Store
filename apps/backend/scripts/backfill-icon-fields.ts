import 'dotenv/config';

type VendureAsset = {
  id: string;
  name?: string | null;
  source?: string | null;
};

type VendureVariant = {
  id: string;
  sku: string;
  customFields?: { iconId?: string | null } | null;
};

type IconProduct = {
  id: string;
  name: string;
  slug: string;
  featuredAsset?: VendureAsset | null;
  assets: VendureAsset[];
  variants: VendureVariant[];
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

function usage(exitCode = 0): never {
  const text = `
Backfill icon product fields for the locked Render/Insert model:
- Product.customFields.iconId = Variant.sku (string, preserved)
- Product.customFields.insertAssetId = non-featured asset id (matte insert)
- ProductVariant.customFields.iconId = Variant.sku

By default this is a dry-run. Use --apply to write changes.

Usage:
  pnpm -C apps/backend backfill:icon-fields [-- --apply --force --verbose]

Options:
  --endpoint <url>    Admin API GraphQL endpoint (default: http://localhost:3000/admin-api)
  --username <user>   Admin username (default: SUPERADMIN_USERNAME or "superadmin")
  --password <pass>   Admin password (default: SUPERADMIN_PASSWORD or "superadmin")
  --take <n>          Page size when fetching products (default: 200)
  --apply             Actually write updates (default: false)
  --force             Overwrite existing values (default: false)
  --verbose           Extra logging (default: false)
  -h, --help          Show help
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
  if (!json.data) throw new Error('Missing GraphQL response data');
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

function deriveIconId(product: IconProduct): { iconId: string | null; reason: string } {
  const variants = product.variants ?? [];
  if (variants.length === 1) {
    const sku = (variants[0]?.sku ?? '').toString().trim();
    if (sku) return { iconId: sku, reason: 'variant sku' };
  }
  if (variants.length > 1) return { iconId: null, reason: `multiple variants (${variants.length})` };
  return { iconId: null, reason: 'no variants' };
}

async function fetchAllProducts(endpoint: string, cookie: string, take: number): Promise<IconProduct[]> {
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
          variants { id sku customFields { iconId } }
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

async function updateProductCustomFields(
  endpoint: string,
  cookie: string,
  productId: string,
  customFields: Record<string, unknown>,
): Promise<void> {
  const mutation = `
    mutation UpdateProduct($input: UpdateProductInput!) {
      updateProduct(input: $input) {
        id
        customFields { iconId insertAssetId }
      }
    }
  `;

  await graphql(endpoint, mutation, { input: { id: productId, customFields } }, cookie);
}

async function updateVariantIconId(
  endpoint: string,
  cookie: string,
  variantId: string,
  iconId: string,
): Promise<void> {
  const mutation = `
    mutation UpdateVariant($input: UpdateProductVariantInput!) {
      updateProductVariant(input: $input) {
        id
        sku
        customFields { iconId }
      }
    }
  `;

  await graphql(endpoint, mutation, { input: { id: variantId, customFields: { iconId } } }, cookie);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  // eslint-disable-next-line no-console
  console.log(
    `${args.apply ? 'APPLY' : 'DRY RUN'}: backfilling icon fields via ${args.endpoint} (take=${args.take})`,
  );

  const cookie = await login(args.endpoint, args.username, args.password);
  const products = await fetchAllProducts(args.endpoint, cookie, args.take);
  // eslint-disable-next-line no-console
  console.log(`Found ${products.length} icon products`);

  let productUpdated = 0;
  let variantUpdated = 0;
  let skipped = 0;
  let ambiguousInsert = 0;
  let ambiguousIconId = 0;

  for (const p of products) {
    const desiredIconId = deriveIconId(p);
    if (!desiredIconId.iconId) ambiguousIconId++;

    const insert = detectInsertAsset(p);
    if (insert.reason.includes('ambiguous')) ambiguousInsert++;

    const currentProductIconId = p.customFields?.iconId?.toString().trim();
    const currentInsertAssetId = p.customFields?.insertAssetId?.toString().trim();

    const productCustomFields: Record<string, unknown> = {};
    if ((args.force || !currentProductIconId) && desiredIconId.iconId) productCustomFields.iconId = desiredIconId.iconId;
    if ((args.force || !currentInsertAssetId) && insert.asset) productCustomFields.insertAssetId = insert.asset.id.toString();

    const willUpdateProduct = Object.keys(productCustomFields).length > 0;
    if (willUpdateProduct) {
      // eslint-disable-next-line no-console
      console.log(
        `- ${args.apply ? 'set' : 'would set'} product ${p.id} ${p.slug}: ${Object.entries(productCustomFields)
          .map(([k, v]) => `${k}=${String(v)}`)
          .join(', ')}`,
      );
      if (args.apply) {
        await updateProductCustomFields(args.endpoint, cookie, p.id, productCustomFields);
        productUpdated++;
      }
    }

    // Variant iconId
    const variants = p.variants ?? [];
    if (variants.length === 0) {
      skipped++;
      if (args.verbose) {
        // eslint-disable-next-line no-console
        console.log(`  - skip variants for product ${p.id} ${p.slug}: no variants`);
      }
      continue;
    }

    for (const v of variants) {
      const sku = (v.sku ?? '').toString().trim();
      const currentVariantIconId = v.customFields?.iconId?.toString().trim();

      if (!sku) {
        skipped++;
        if (args.verbose) {
          // eslint-disable-next-line no-console
          console.log(`  - skip variant ${v.id}: missing sku`);
        }
        continue;
      }

      if (currentVariantIconId && !args.force) continue;

      // eslint-disable-next-line no-console
      console.log(`  - ${args.apply ? 'set' : 'would set'} variant ${v.id}: iconId=${sku}`);
      if (args.apply) {
        await updateVariantIconId(args.endpoint, cookie, v.id, sku);
        variantUpdated++;
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `Done. ${args.apply ? 'Updated' : 'Would update'} products=${productUpdated}, variants=${variantUpdated}, skipped=${skipped}, ambiguousIconId=${ambiguousIconId}, ambiguousInsert=${ambiguousInsert}`,
  );
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

