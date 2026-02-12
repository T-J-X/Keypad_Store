/**
 * Batch update catalog pricing and stock levels:
 * - Icon products: set price + stock
 * - Keypad products: set stock only
 *
 * Product type detection is based on Product.customFields:
 * - isIconProduct
 * - isKeypadProduct
 */

type Args = {
  endpoint: string;
  username: string;
  password: string;
  currencyCode: string;
  iconPrice: number;
  iconStockOnHand: number;
  keypadStockOnHand: number;
  concurrency: number;
  apply: boolean;
  verbose: boolean;
};

type ProductListItem = {
  id: string;
  name: string;
  customFields?: {
    isIconProduct?: boolean | null;
    isKeypadProduct?: boolean | null;
  } | null;
  variants: Array<{
    id: string;
    sku: string;
  }>;
};

type VariantJob =
  | {
      kind: 'icon';
      productId: string;
      productName: string;
      variantId: string;
      sku: string;
    }
  | {
      kind: 'keypad';
      productId: string;
      productName: string;
      variantId: string;
      sku: string;
    };

function usage(exitCode = 0): never {
  // eslint-disable-next-line no-console
  console.log(`
Usage:
  pnpm -C apps/backend batch:set-catalog-pricing-stock -- --apply

Options:
  --endpoint <url>          Admin API endpoint (default: http://localhost:3000/admin-api)
  --username <value>        Admin username (default: superadmin)
  --password <value>        Admin password (default: superadmin)
  --currency <code>         Currency code for icon price update (default: GBP)
  --icon-price <minor>      Icon price in minor units (default: 500)
  --icon-stock <int>        Icon stockOnHand (default: 100)
  --keypad-stock <int>      Keypad stockOnHand (default: 40)
  --concurrency <int>       Parallel updates (default: 8)
  --apply                   Execute writes (default: dry-run)
  --verbose                 Print per-variant logs
  --help                    Show this help
`);
  process.exit(exitCode);
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    endpoint: process.env.VENDURE_ADMIN_API_URL ?? 'http://localhost:3000/admin-api',
    username: process.env.SUPERADMIN_USERNAME ?? 'superadmin',
    password: process.env.SUPERADMIN_PASSWORD ?? 'superadmin',
    currencyCode: 'GBP',
    iconPrice: 500,
    iconStockOnHand: 100,
    keypadStockOnHand: 40,
    concurrency: 8,
    apply: false,
    verbose: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--') continue;
    if (a === '--help') usage(0);
    if (a === '--apply') {
      args.apply = true;
      continue;
    }
    if (a === '--verbose') {
      args.verbose = true;
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith('--')) usage(1);

    const setNum = (setter: (n: number) => void) => {
      const n = Number(next);
      if (!Number.isFinite(n)) usage(1);
      setter(n);
      i += 1;
    };

    switch (a) {
      case '--endpoint':
        args.endpoint = next;
        i += 1;
        break;
      case '--username':
        args.username = next;
        i += 1;
        break;
      case '--password':
        args.password = next;
        i += 1;
        break;
      case '--currency':
        args.currencyCode = next.toUpperCase();
        i += 1;
        break;
      case '--icon-price':
        setNum((n) => {
          args.iconPrice = Math.trunc(n);
        });
        break;
      case '--icon-stock':
        setNum((n) => {
          args.iconStockOnHand = Math.trunc(n);
        });
        break;
      case '--keypad-stock':
        setNum((n) => {
          args.keypadStockOnHand = Math.trunc(n);
        });
        break;
      case '--concurrency':
        setNum((n) => {
          args.concurrency = Math.max(1, Math.trunc(n));
        });
        break;
      default:
        usage(1);
    }
  }

  return args;
}

function cookieHeaderFromSetCookie(setCookies: string[]): string {
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
  if (!cookie) throw new Error('Login succeeded but no session cookie returned');
  return cookie;
}

async function fetchAllProducts(endpoint: string, cookie: string): Promise<ProductListItem[]> {
  const query = `
    query Products($options: ProductListOptions) {
      products(options: $options) {
        totalItems
        items {
          id
          name
          customFields { isIconProduct isKeypadProduct }
          variants { id sku }
        }
      }
    }
  `;

  const out: ProductListItem[] = [];
  let skip = 0;
  while (true) {
    const { data } = await graphql<{
      products: { totalItems: number; items: ProductListItem[] };
    }>(endpoint, query, { options: { take: 100, skip } }, cookie);

    const items = data.products.items ?? [];
    out.push(...items);
    skip += items.length;
    if (skip >= data.products.totalItems || items.length === 0) break;
  }
  return out;
}

async function updateIconVariant(
  endpoint: string,
  cookie: string,
  variantId: string,
  currencyCode: string,
  iconPrice: number,
  stockOnHand: number,
): Promise<void> {
  const mutation = `
    mutation UpdateVariant($input: UpdateProductVariantInput!) {
      updateProductVariant(input: $input) { id }
    }
  `;

  await graphql(
    endpoint,
    mutation,
    {
      input: {
        id: variantId,
        prices: [{ currencyCode, price: iconPrice }],
        stockOnHand,
      },
    },
    cookie,
  );
}

async function updateKeypadVariantStock(
  endpoint: string,
  cookie: string,
  variantId: string,
  stockOnHand: number,
): Promise<void> {
  const mutation = `
    mutation UpdateVariant($input: UpdateProductVariantInput!) {
      updateProductVariant(input: $input) { id }
    }
  `;

  await graphql(
    endpoint,
    mutation,
    {
      input: {
        id: variantId,
        stockOnHand,
      },
    },
    cookie,
  );
}

async function mapWithConcurrency<T>(items: T[], concurrency: number, fn: (item: T, idx: number) => Promise<void>) {
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i;
      i += 1;
      // eslint-disable-next-line no-await-in-loop
      await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.apply ? 'APPLY' : 'DRY RUN';
  // eslint-disable-next-line no-console
  console.log(`${mode}: icons price=${args.iconPrice} ${args.currencyCode}, icons stock=${args.iconStockOnHand}, keypads stock=${args.keypadStockOnHand}`);

  const cookie = await login(args.endpoint, args.username, args.password);
  const products = await fetchAllProducts(args.endpoint, cookie);

  const jobs: VariantJob[] = [];
  let iconsProductCount = 0;
  let keypadsProductCount = 0;
  let ambiguousProductCount = 0;

  for (const p of products) {
    const isIcon = !!p.customFields?.isIconProduct;
    const isKeypad = !!p.customFields?.isKeypadProduct;

    if (!isIcon && !isKeypad) continue;
    if (isIcon && isKeypad) {
      ambiguousProductCount += 1;
      continue;
    }

    if (isIcon) {
      iconsProductCount += 1;
      for (const v of p.variants ?? []) {
        jobs.push({
          kind: 'icon',
          productId: p.id,
          productName: p.name,
          variantId: v.id,
          sku: v.sku,
        });
      }
      continue;
    }

    keypadsProductCount += 1;
    for (const v of p.variants ?? []) {
      jobs.push({
        kind: 'keypad',
        productId: p.id,
        productName: p.name,
        variantId: v.id,
        sku: v.sku,
      });
    }
  }

  const iconVariantCount = jobs.filter((j) => j.kind === 'icon').length;
  const keypadVariantCount = jobs.filter((j) => j.kind === 'keypad').length;

  // eslint-disable-next-line no-console
  console.log(`Targets: icon products=${iconsProductCount}, icon variants=${iconVariantCount}, keypad products=${keypadsProductCount}, keypad variants=${keypadVariantCount}, ambiguous products skipped=${ambiguousProductCount}`);

  if (!args.apply) return;

  let updatedIcons = 0;
  let updatedKeypads = 0;
  const failures: Array<{ variantId: string; sku: string; reason: string }> = [];

  await mapWithConcurrency(jobs, args.concurrency, async (job, idx) => {
    try {
      if (job.kind === 'icon') {
        await updateIconVariant(
          args.endpoint,
          cookie,
          job.variantId,
          args.currencyCode,
          args.iconPrice,
          args.iconStockOnHand,
        );
        updatedIcons += 1;
      } else {
        await updateKeypadVariantStock(args.endpoint, cookie, job.variantId, args.keypadStockOnHand);
        updatedKeypads += 1;
      }
      if (args.verbose) {
        // eslint-disable-next-line no-console
        console.log(`[${idx + 1}/${jobs.length}] updated ${job.kind} sku=${job.sku} product=${job.productName}`);
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ variantId: job.variantId, sku: job.sku, reason });
      // eslint-disable-next-line no-console
      console.error(`[${idx + 1}/${jobs.length}] failed ${job.kind} sku=${job.sku}: ${reason}`);
    }
  });

  // eslint-disable-next-line no-console
  console.log(`Done. updated icon variants=${updatedIcons}, updated keypad variants=${updatedKeypads}, failures=${failures.length}`);
  if (failures.length) {
    for (const f of failures.slice(0, 20)) {
      // eslint-disable-next-line no-console
      console.log(`  - variantId=${f.variantId} sku=${f.sku}: ${f.reason}`);
    }
  }
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
