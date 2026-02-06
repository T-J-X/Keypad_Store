import 'dotenv/config';

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

type KeypadModel = {
  absPath: string;
  relPath: string;
  fileName: string;
  modelCodeRaw: string;
  displayName: string;
  sku: string;
};

type Args = {
  endpoint: string;
  username: string;
  password: string;

  zip?: string;
  dir?: string;

  currencyCode: string;
  price: number;
  stockOnHand: number;
  concurrency: number;

  validateOnly: boolean;
  apply: boolean;
  force: boolean;
  verbose: boolean;
};

function usage(exitCode = 0): never {
  const text = `
Import keypad model products from a directory tree (or zip).

Filename rules:
  <MODEL_CODE> - <Display Name>.png
Or fallback:
  <filename>.png (MODEL_CODE = filename base)

Default is DRY RUN (no writes). Use --apply to write.

Usage:
  pnpm -C apps/backend ts-node -r dotenv/config scripts/import-keypads.ts [options]

Options:
  --zip <path>            Path to keypads zip
  --dir <path>            Path to extracted keypads directory

  --endpoint <url>        Admin API GraphQL endpoint (default: http://localhost:3000/admin-api)
  --username <user>       Admin username (default: SUPERADMIN_USERNAME or "superadmin")
  --password <pass>       Admin password (default: SUPERADMIN_PASSWORD or "superadmin")

  --currency <code>       Currency code (default: GBP)
  --price <minor>         Variant price in minor units (default: 0)
  --stock <n>             Stock on hand for NEW variants (default: 1000)
  --concurrency <n>       Parallelism (default: 2)

  --validate-only         Parse + validate the files, then exit (no API calls)
  --apply                 Create/update products & assets (default: false)
  --force                 Overwrite assets/custom fields for existing SKUs (default: false)
  --verbose               More logs (default: false)
  -h, --help              Show help

Examples:
  # Validate
  pnpm -C apps/backend import:keypads -- --zip ./imports/Keypads.zip --validate-only

  # Apply
  pnpm -C apps/backend import:keypads -- --zip ./imports/Keypads.zip --apply
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
    currencyCode: 'GBP',
    price: 0,
    stockOnHand: 1000,
    concurrency: 2,
    validateOnly: false,
    apply: false,
    force: false,
    verbose: false,
  };

  const readValue = (i: number) => {
    const v = argv[i + 1];
    if (!v || v.startsWith('-')) usage(1);
    return v;
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
    if (a === '--validate-only') {
      out.validateOnly = true;
      continue;
    }

    const setStr = (key: keyof Args) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (out as any)[key] = readValue(i);
      i++;
    };
    const setNum = (key: keyof Args) => {
      const raw = readValue(i);
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) usage(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (out as any)[key] = n;
      i++;
    };

    if (a === '--zip') {
      setStr('zip');
      continue;
    }
    if (a === '--dir') {
      setStr('dir');
      continue;
    }
    if (a === '--endpoint') {
      setStr('endpoint');
      continue;
    }
    if (a === '--username') {
      setStr('username');
      continue;
    }
    if (a === '--password') {
      setStr('password');
      continue;
    }
    if (a === '--currency') {
      setStr('currencyCode');
      continue;
    }
    if (a === '--price') {
      setNum('price');
      continue;
    }
    if (a === '--stock') {
      setNum('stockOnHand');
      continue;
    }
    if (a === '--concurrency') {
      setNum('concurrency');
      continue;
    }

    usage(1);
  }

  if (!out.zip && !out.dir) usage(1);
  if (out.concurrency <= 0) usage(1);

  return out;
}

function toPosix(p: string) {
  return p.split(path.sep).join('/');
}

function shouldIgnoreRel(rel: string) {
  const parts = toPosix(rel).split('/').filter(Boolean);
  if (parts.some((p) => p === '__MACOSX')) return true;
  const base = parts[parts.length - 1] ?? '';
  if (base === '.DS_Store') return true;
  if (base.startsWith('._')) return true;
  return false;
}

async function walkPngFiles(rootDir: string): Promise<Array<{ absPath: string; relPath: string }>> {
  const out: Array<{ absPath: string; relPath: string }> = [];
  const visit = async (dir: string) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      const rel = path.relative(rootDir, abs);
      if (shouldIgnoreRel(rel)) continue;
      if (e.isDirectory()) {
        await visit(abs);
        continue;
      }
      if (!e.isFile()) continue;
      if (!e.name.toLowerCase().endsWith('.png')) continue;
      out.push({ absPath: abs, relPath: toPosix(rel) });
    }
  };
  await visit(rootDir);
  return out;
}

function humanizeBaseName(base: string) {
  const cleaned = base
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return cleaned;
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(' ');
}

function sanitizeSku(raw: string) {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseKeypadModel(absPath: string, relPath: string): { model: KeypadModel | null; reason?: string } {
  const fileName = path.basename(relPath);
  const base = fileName.replace(/\.png$/i, '').trim();
  if (!base) return { model: null, reason: 'empty filename base' };

  const idx = base.indexOf(' - ');
  let modelCodeRaw: string;
  let displayName: string;
  if (idx > 0) {
    modelCodeRaw = base.slice(0, idx).trim();
    displayName = base.slice(idx + 3).trim();
  } else {
    modelCodeRaw = base;
    displayName = humanizeBaseName(base);
  }

  if (!modelCodeRaw) return { model: null, reason: 'missing model code' };
  if (!displayName) return { model: null, reason: 'missing display name' };

  const sku = sanitizeSku(modelCodeRaw);
  if (!sku) return { model: null, reason: 'model code results in empty sku after sanitisation' };

  return {
    model: {
      absPath,
      relPath,
      fileName,
      modelCodeRaw,
      displayName,
      sku,
    },
  };
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

async function graphqlUpload<TData>(
  endpoint: string,
  query: string,
  variables: Record<string, unknown>,
  files: Record<string, File>,
  cookie?: string,
): Promise<TData> {
  const form = new FormData();

  const map: Record<string, string[]> = {};
  for (const k of Object.keys(files)) {
    map[k] = [`variables.${k}`];
  }

  form.set('operations', JSON.stringify({ query, variables }));
  form.set('map', JSON.stringify(map));
  for (const [k, f] of Object.entries(files)) {
    form.set(k, f);
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...(cookie ? { cookie } : {}),
    },
    body: form,
  });

  const json = (await res.json()) as { data?: TData; errors?: Array<{ message: string }> };
  if (!res.ok || json.errors?.length) {
    const msg = json.errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if (!json.data) throw new Error('Missing GraphQL response data');
  return json.data;
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

async function uploadPngAsset(
  endpoint: string,
  cookie: string,
  absPath: string,
  tags: string[],
): Promise<{ assetId: string }> {
  const mutation = `
    mutation CreateAssets($input: [CreateAssetInput!]!) {
      createAssets(input: $input) {
        __typename
        ... on Asset { id name source preview }
        ... on MimeTypeError { message fileName mimeType }
      }
    }
  `;

  const buf = await fs.readFile(absPath);
  const fileName = path.basename(absPath);
  const variables = {
    input: [{ file: null, tags }],
  };

  const data = await graphqlUpload<{
    createAssets: Array<
      | { __typename: 'Asset'; id: string; name: string; source: string; preview: string }
      | { __typename: 'MimeTypeError'; message: string; fileName: string; mimeType: string }
    >;
  }>(
    endpoint,
    mutation,
    variables,
    {
      'input.0.file': new File([buf], fileName, { type: 'image/png' }),
    },
    cookie,
  );

  const [a] = data.createAssets;
  if (!a || a.__typename !== 'Asset') {
    throw new Error(a && a.__typename === 'MimeTypeError' ? a.message : 'Asset upload failed');
  }

  return { assetId: a.id };
}

async function findProductBySku(
  endpoint: string,
  cookie: string,
  sku: string,
): Promise<{ productId: string; variantId: string } | null> {
  const query = `
    query ProductBySku($options: ProductListOptions) {
      products(options: $options) {
        items { id variants { id sku } }
      }
    }
  `;

  const { data } = await graphql<{
    products: { items: Array<{ id: string; variants: Array<{ id: string; sku: string }> }> };
  }>(endpoint, query, { options: { take: 1, filter: { sku: { eq: sku } } } }, cookie);

  const p = data.products.items[0];
  if (!p) return null;
  const v = p.variants.find((x) => x.sku === sku) ?? p.variants[0];
  if (!v) return null;
  return { productId: p.id, variantId: v.id };
}

function slugify(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function createKeypadProductAndVariant(
  endpoint: string,
  cookie: string,
  model: KeypadModel,
  assetId: string,
  currencyCode: string,
  price: number,
  stockOnHand: number,
) {
  const createProductMutation = `
    mutation CreateProduct($input: CreateProductInput!) {
      createProduct(input: $input) { id }
    }
  `;

  const slug = slugify(`${model.sku}-${model.displayName}`);

  const { data: created } = await graphql<{ createProduct: { id: string } }>(
    endpoint,
    createProductMutation,
    {
      input: {
        enabled: true,
        featuredAssetId: assetId,
        assetIds: [assetId],
        translations: [
          {
            languageCode: 'en',
            name: model.displayName,
            slug,
            // Some DB setups enforce NOT NULL.
            description: '',
          },
        ],
        customFields: {
          isKeypadProduct: true,
        },
      },
    },
    cookie,
  );

  const createVariantsMutation = `
    mutation CreateVariants($input: [CreateProductVariantInput!]!) {
      createProductVariants(input: $input) { id sku }
    }
  `;

  await graphql(
    endpoint,
    createVariantsMutation,
    {
      input: [
        {
          productId: created.createProduct.id,
          enabled: true,
          sku: model.sku,
          translations: [{ languageCode: 'en', name: model.displayName }],
          prices: [{ currencyCode, price }],
          stockOnHand,
          featuredAssetId: assetId,
          assetIds: [assetId],
          customFields: {
            keypadModelCode: model.modelCodeRaw,
            slotMapKey: model.sku,
          },
        },
      ],
    },
    cookie,
  );
}

async function updateKeypadProductAndVariant(
  endpoint: string,
  cookie: string,
  existing: { productId: string; variantId: string },
  model: KeypadModel,
  assetId: string,
) {
  const updateProductMutation = `
    mutation UpdateProduct($input: UpdateProductInput!) {
      updateProduct(input: $input) { id }
    }
  `;
  await graphql(
    endpoint,
    updateProductMutation,
    {
      input: {
        id: existing.productId,
        enabled: true,
        featuredAssetId: assetId,
        assetIds: [assetId],
        customFields: { isKeypadProduct: true },
      },
    },
    cookie,
  );

  const updateVariantMutation = `
    mutation UpdateVariant($input: UpdateProductVariantInput!) {
      updateProductVariant(input: $input) { id sku }
    }
  `;
  await graphql(
    endpoint,
    updateVariantMutation,
    {
      input: {
        id: existing.variantId,
        enabled: true,
        featuredAssetId: assetId,
        assetIds: [assetId],
        customFields: {
          keypadModelCode: model.modelCodeRaw,
          slotMapKey: model.sku,
        },
      },
    },
    cookie,
  );
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T, idx: number) => Promise<R>) {
  const results: R[] = [];
  let i = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      // eslint-disable-next-line no-await-in-loop
      const r = await fn(items[idx], idx);
      results[idx] = r;
    }
  });

  await Promise.all(workers);
  return results;
}

function unzipToTemp(zipPath: string) {
  const tmpDir = path.join(os.tmpdir(), `keypad-store-keypads-${Date.now()}`);
  const r = spawnSync('unzip', ['-qq', zipPath, '-d', tmpDir], { stdio: 'inherit' });
  if (r.status !== 0) {
    throw new Error(`Failed to unzip ${zipPath} into ${tmpDir}`);
  }
  return tmpDir;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const mode = args.apply ? 'APPLY' : args.validateOnly ? 'VALIDATE ONLY' : 'DRY RUN';
  // eslint-disable-next-line no-console
  console.log(`${mode}: importing keypads`);

  let root = args.dir;
  const tempDirs: string[] = [];
  if (!root && args.zip) {
    root = unzipToTemp(args.zip);
    tempDirs.push(root);
  }
  if (!root) usage(1);

  const files = await walkPngFiles(root);
  const invalid: Array<{ relPath: string; reason: string }> = [];
  const bySku = new Map<string, KeypadModel>();
  const collisions: Array<{ sku: string; a: string; b: string }> = [];

  for (const f of files) {
    const parsed = parseKeypadModel(f.absPath, f.relPath);
    if (!parsed.model) {
      invalid.push({ relPath: f.relPath, reason: parsed.reason ?? 'invalid file' });
      continue;
    }
    const existing = bySku.get(parsed.model.sku);
    if (existing) {
      collisions.push({ sku: parsed.model.sku, a: existing.relPath, b: parsed.model.relPath });
      continue;
    }
    bySku.set(parsed.model.sku, parsed.model);
  }

  if (invalid.length) {
    // eslint-disable-next-line no-console
    console.log(`Invalid filenames: ${invalid.length}`);
    for (const x of invalid.slice(0, 20)) {
      // eslint-disable-next-line no-console
      console.log(`  - ${x.relPath} (${x.reason})`);
    }
  }

  if (collisions.length) {
    const lines = collisions.map((c) => `sku collision ${c.sku}: ${c.a} | ${c.b}`);
    throw new Error(`Duplicate keypad SKUs found:\n${lines.join('\n')}`);
  }

  const models = Array.from(bySku.values()).sort((a, b) => a.sku.localeCompare(b.sku));

  // eslint-disable-next-line no-console
  console.log(`Parsed: keypads=${models.length}`);
  if (args.verbose) {
    for (const m of models) {
      // eslint-disable-next-line no-console
      console.log(`  - ${m.sku}: ${m.displayName} (${m.modelCodeRaw})`);
    }
  }

  if (args.validateOnly) return;

  const cookie = await login(args.endpoint, args.username, args.password);

  let wouldCreate = 0;
  let wouldUpdate = 0;
  let wouldSkip = 0;

  await mapWithConcurrency(models, args.concurrency, async (model, idx) => {
    const existing = await findProductBySku(args.endpoint, cookie, model.sku);
    if (existing && !args.force) {
      wouldSkip++;
      if (args.verbose) {
        // eslint-disable-next-line no-console
        console.log(`[${idx + 1}/${models.length}] skip ${model.sku} (${model.displayName}) — already exists`);
      }
      return;
    }

    if (existing) {
      wouldUpdate++;
      // eslint-disable-next-line no-console
      console.log(`[${idx + 1}/${models.length}] ${args.apply ? 'update' : 'would update'} ${model.sku} (${model.displayName})`);
    } else {
      wouldCreate++;
      // eslint-disable-next-line no-console
      console.log(`[${idx + 1}/${models.length}] ${args.apply ? 'create' : 'would create'} ${model.sku} (${model.displayName})`);
    }

    if (!args.apply) return;

    const tags = ['keypad', `keypad:${model.sku}`, `model:${model.modelCodeRaw}`];
    const { assetId } = await uploadPngAsset(args.endpoint, cookie, model.absPath, tags);

    if (!existing) {
      await createKeypadProductAndVariant(
        args.endpoint,
        cookie,
        model,
        assetId,
        args.currencyCode,
        args.price,
        args.stockOnHand,
      );
      return;
    }

    await updateKeypadProductAndVariant(args.endpoint, cookie, existing, model, assetId);
  });

  // eslint-disable-next-line no-console
  console.log(
    `Done. ${args.apply ? 'Created' : 'Would create'}=${wouldCreate}, ${args.apply ? 'Updated' : 'Would update'}=${wouldUpdate}, skipped=${wouldSkip}`,
  );

  for (const d of tempDirs) {
    if (args.verbose) {
      // eslint-disable-next-line no-console
      console.log(`Cleaning up temp dir: ${d}`);
    }
    // eslint-disable-next-line no-await-in-loop
    await fs.rm(d, { recursive: true, force: true });
  }
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

