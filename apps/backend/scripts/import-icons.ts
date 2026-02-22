import 'dotenv/config';

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ensureDefaultTaxSetup } from './lib/ensure-default-tax-config';

type IconFile = {
  kind: 'render' | 'insert';
  absPath: string;
  relPath: string;
  fileName: string;
  iconId: string;
  displayName: string;
  categoryPath: string;
};

type IconPair = {
  iconId: string;
  displayName: string;
  categoryPath: string;
  render: IconFile;
  insert: IconFile;
};

type Args = {
  endpoint: string;
  username: string;
  password: string;

  renderDir?: string;
  insertDir?: string;
  renderZip?: string;
  insertZip?: string;

  currencyCode: string;
  price: number;
  stockOnHand: number;
  concurrency: number;
  limit?: number;

  validateOnly: boolean;
  apply: boolean;
  force: boolean;
  verbose: boolean;
};

function usage(exitCode = 0): never {
  const text = `
Import icon products from Render/ + Insert/ folder trees (or zips) using the locked filename rules:
  <ICON_ID> - <Display Name>.png

Default is DRY RUN (no writes). Use --apply to write.

Usage:
  pnpm -C apps/backend ts-node -r dotenv/config scripts/import-icons.ts [options]

Options:
  --render-zip <path>     Path to Render zip
  --insert-zip <path>     Path to Insert zip
  --render-dir <path>     Path to extracted Render directory
  --insert-dir <path>     Path to extracted Insert directory

  --endpoint <url>        Admin API GraphQL endpoint (default: http://localhost:3000/admin-api)
  --username <user>       Admin username (default: SUPERADMIN_USERNAME or "superadmin")
  --password <pass>       Admin password (default: SUPERADMIN_PASSWORD or "superadmin")

  --currency <code>       Currency code (default: GBP)
  --price <minor>         Variant price in minor units (default: 500 => £5.00)
  --stock <n>             Stock on hand for NEW variants (default: 1000)
  --concurrency <n>       Parallelism (default: 2)
  --limit <n>             Process only the first N valid pairs (default: all)

  --validate-only         Parse + validate the files, then exit (no API calls)
  --apply                 Create/update products & assets (default: false)
  --force                 Overwrite existing featured/insert mapping when present (default: false)
  --verbose               More logs (default: false)
  -h, --help              Show help

Examples:
  # Dry run with zips
  pnpm -C apps/backend ts-node -r dotenv/config scripts/import-icons.ts \\
    --render-zip ./imports/Render.zip --insert-zip ./imports/Insert.zip

  # Apply
  pnpm -C apps/backend ts-node -r dotenv/config scripts/import-icons.ts \\
    --render-zip ./imports/Render.zip --insert-zip ./imports/Insert.zip --apply
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
    price: 500,
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

    if (a === '--render-zip') {
      setStr('renderZip');
      continue;
    }
    if (a === '--insert-zip') {
      setStr('insertZip');
      continue;
    }
    if (a === '--render-dir') {
      setStr('renderDir');
      continue;
    }
    if (a === '--insert-dir') {
      setStr('insertDir');
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
    if (a === '--limit') {
      setNum('limit');
      continue;
    }

    usage(1);
  }

  if ((!out.renderZip || !out.insertZip) && (!out.renderDir || !out.insertDir)) {
    usage(1);
  }

  if (out.concurrency <= 0) usage(1);

  return out;
}

function toPosix(p: string) {
  return p.split(path.sep).join('/');
}

function stripLeadingFolder(rel: string, folder: string) {
  const parts = toPosix(rel).split('/').filter(Boolean);
  if (parts.length === 0) return rel;
  if (parts[0].toLowerCase() === folder.toLowerCase()) {
    return parts.slice(1).join('/');
  }
  return parts.join('/');
}

function shouldIgnoreRel(rel: string) {
  const parts = toPosix(rel).split('/').filter(Boolean);
  if (parts.some((p) => p === '__MACOSX')) return true;
  const base = parts[parts.length - 1] ?? '';
  if (base === '.DS_Store') return true;
  if (base.startsWith('._')) return true;
  return false;
}

async function walkFiles(rootDir: string): Promise<Array<{ absPath: string; relPath: string }>> {
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
      const lower = e.name.toLowerCase();
      if (!lower.endsWith('.png')) continue;
      out.push({ absPath: abs, relPath: toPosix(rel) });
    }
  };
  await visit(rootDir);
  return out;
}

function parseIconFile(kind: 'render' | 'insert', absPath: string, relPath: string): IconFile | null {
  const fileName = path.basename(relPath);
  const base = fileName.replace(/\.png$/i, '');
  const idx = base.indexOf(' - ');
  if (idx <= 0) return null;

  const iconId = base.slice(0, idx); // preserve exactly (case-sensitive, leading zeros)
  const displayName = base.slice(idx + 3).trim();
  if (!iconId) return null;
  if (!displayName) return null;

  const stripped = stripLeadingFolder(relPath, kind === 'render' ? 'Render' : 'Insert');
  const dir = path.posix.dirname(stripped);
  const categoryPath = dir === '.' ? 'Uncategorised' : dir;

  return {
    kind,
    absPath,
    relPath,
    fileName,
    iconId,
    displayName,
    categoryPath,
  };
}

function groupIconFiles(kind: 'render' | 'insert', files: Array<{ absPath: string; relPath: string }>) {
  const byId = new Map<string, IconFile>();
  const invalid: Array<{ relPath: string; reason: string }> = [];
  const duplicates: Array<{ iconId: string; a: string; b: string }> = [];

  for (const f of files) {
    const parsed = parseIconFile(kind, f.absPath, f.relPath);
    if (!parsed) {
      invalid.push({ relPath: f.relPath, reason: 'filename must match "<ICON_ID> - <Display Name>.png"' });
      continue;
    }
    const existing = byId.get(parsed.iconId);
    if (existing) {
      duplicates.push({ iconId: parsed.iconId, a: existing.relPath, b: parsed.relPath });
      continue;
    }
    byId.set(parsed.iconId, parsed);
  }

  return { byId, invalid, duplicates };
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
  const keys = Object.keys(files);
  for (const k of keys) {
    // Each file key maps to a single variables path.
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

async function uploadTwoPngAssets(
  endpoint: string,
  cookie: string,
  renderAbsPath: string,
  insertAbsPath: string,
  tags: string[],
): Promise<{ renderAssetId: string; insertAssetId: string }> {
  const mutation = `
    mutation CreateAssets($input: [CreateAssetInput!]!) {
      createAssets(input: $input) {
        __typename
        ... on Asset { id name source preview }
        ... on MimeTypeError { message fileName mimeType }
      }
    }
  `;

  const renderBuf = await fs.readFile(renderAbsPath);
  const insertBuf = await fs.readFile(insertAbsPath);
  const renderName = path.basename(renderAbsPath);
  const insertName = path.basename(insertAbsPath);

  const variables = {
    input: [
      { file: null, tags: [...tags, 'render'] },
      { file: null, tags: [...tags, 'insert'] },
    ],
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
      'input.0.file': new File([renderBuf], renderName, { type: 'image/png' }),
      'input.1.file': new File([insertBuf], insertName, { type: 'image/png' }),
    },
    cookie,
  );

  const [a, b] = data.createAssets;
  if (!a || a.__typename !== 'Asset') {
    throw new Error(a && a.__typename === 'MimeTypeError' ? a.message : 'Asset upload failed (render)');
  }
  if (!b || b.__typename !== 'Asset') {
    throw new Error(b && b.__typename === 'MimeTypeError' ? b.message : 'Asset upload failed (insert)');
  }

  return { renderAssetId: a.id, insertAssetId: b.id };
}

async function findProductBySku(endpoint: string, cookie: string, sku: string): Promise<{ id: string } | null> {
  const query = `
    query ProductBySku($options: ProductListOptions) {
      products(options: $options) {
        items { id }
      }
    }
  `;

  const { data } = await graphql<{
    products: { items: Array<{ id: string }> };
  }>(endpoint, query, { options: { take: 1, filter: { sku: { eq: sku } } } }, cookie);

  return data.products.items[0] ?? null;
}

async function createIconProductAndVariant(
  endpoint: string,
  cookie: string,
  pair: IconPair,
  renderAssetId: string,
  insertAssetId: string,
  currencyCode: string,
  price: number,
  stockOnHand: number,
): Promise<void> {
  const createProductMutation = `
    mutation CreateProduct($input: CreateProductInput!) {
      createProduct(input: $input) { id }
    }
  `;

  const slug = slugify(`${pair.iconId}-${pair.displayName}`);

  const { data: created } = await graphql<{ createProduct: { id: string } }>(
    endpoint,
    createProductMutation,
    {
      input: {
        enabled: true,
        featuredAssetId: renderAssetId,
        assetIds: [renderAssetId, insertAssetId],
        translations: [
          {
            languageCode: 'en',
            name: pair.displayName,
            slug,
            // Some DB setups enforce NOT NULL. Keep it simple for now.
            description: '',
          },
        ],
        customFields: {
          isIconProduct: true,
          iconId: pair.iconId,
          iconCategoryPath: pair.categoryPath,
          iconCategories: [pair.categoryPath],
          insertAssetId,
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
          sku: pair.iconId,
          translations: [{ languageCode: 'en', name: pair.displayName }],
          prices: [{ currencyCode, price }],
          stockOnHand,
          featuredAssetId: renderAssetId,
          assetIds: [renderAssetId, insertAssetId],
          customFields: {
            iconId: pair.iconId,
          },
        },
      ],
    },
    cookie,
  );
}

function slugify(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
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

function unzipToTemp(zipPath: string, label: string) {
  const tmpDir = path.join(os.tmpdir(), `keypad-store-${label}-${Date.now()}`);
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
  console.log(`${mode}: importing icons (Render/Insert)`);

  let renderRoot = args.renderDir;
  let insertRoot = args.insertDir;
  const tempDirs: string[] = [];

  if (!renderRoot && args.renderZip) {
    renderRoot = unzipToTemp(args.renderZip, 'render');
    tempDirs.push(renderRoot);
  }
  if (!insertRoot && args.insertZip) {
    insertRoot = unzipToTemp(args.insertZip, 'insert');
    tempDirs.push(insertRoot);
  }

  if (!renderRoot || !insertRoot) usage(1);

  const [renderFiles, insertFiles] = await Promise.all([walkFiles(renderRoot), walkFiles(insertRoot)]);

  const render = groupIconFiles('render', renderFiles);
  const insert = groupIconFiles('insert', insertFiles);

  if (render.invalid.length || insert.invalid.length) {
    // eslint-disable-next-line no-console
    console.log(`Invalid filenames:\n- render=${render.invalid.length}\n- insert=${insert.invalid.length}`);
    for (const x of [...render.invalid.slice(0, 10), ...insert.invalid.slice(0, 10)]) {
      // eslint-disable-next-line no-console
      console.log(`  - ${x.relPath} (${x.reason})`);
    }
  }

  if (render.duplicates.length || insert.duplicates.length) {
    const lines = [
      ...render.duplicates.map((d) => `render duplicate ${d.iconId}: ${d.a} | ${d.b}`),
      ...insert.duplicates.map((d) => `insert duplicate ${d.iconId}: ${d.a} | ${d.b}`),
    ];
    throw new Error(`Duplicate ICON_IDs found:\n${lines.join('\n')}`);
  }

  const allIds = new Set<string>([...render.byId.keys(), ...insert.byId.keys()]);
  const missingRender: string[] = [];
  const missingInsert: string[] = [];
  const categoryMismatch: string[] = [];
  const valid: IconPair[] = [];

  for (const iconId of Array.from(allIds).sort((a, b) => a.localeCompare(b))) {
    const r = render.byId.get(iconId);
    const i = insert.byId.get(iconId);
    if (!r) {
      missingRender.push(iconId);
      continue;
    }
    if (!i) {
      missingInsert.push(iconId);
      continue;
    }
    if (r.categoryPath !== i.categoryPath) {
      categoryMismatch.push(`${iconId}: render=${r.categoryPath} insert=${i.categoryPath}`);
      continue;
    }

    valid.push({
      iconId,
      displayName: r.displayName,
      categoryPath: r.categoryPath,
      render: r,
      insert: i,
    });
  }

  if (missingRender.length || missingInsert.length || categoryMismatch.length) {
    // eslint-disable-next-line no-console
    console.log('Pairing issues (these ICON_IDs will be excluded):');
    if (missingRender.length) console.log(`- missing render: ${missingRender.length}`);
    if (missingInsert.length) console.log(`- missing insert: ${missingInsert.length}`);
    if (categoryMismatch.length) console.log(`- category mismatch: ${categoryMismatch.length}`);
    if (args.verbose) {
      for (const id of missingRender.slice(0, 20)) console.log(`  - missing render: ${id}`);
      for (const id of missingInsert.slice(0, 20)) console.log(`  - missing insert: ${id}`);
      for (const x of categoryMismatch.slice(0, 20)) console.log(`  - ${x}`);
    }
  }

  const pairs = typeof args.limit === 'number' ? valid.slice(0, args.limit) : valid;

  // eslint-disable-next-line no-console
  console.log(`Parsed: render=${render.byId.size}, insert=${insert.byId.size}, validPairs=${pairs.length}`);

  if (args.validateOnly) return;

  const cookie = await login(args.endpoint, args.username, args.password);
  if (args.apply) {
    await ensureDefaultTaxSetup(args.endpoint, cookie, {
      log: (message) => console.log(message),
    });
  }

  let wouldCreate = 0;
  let wouldSkip = 0;

  await mapWithConcurrency(pairs, args.concurrency, async (pair, idx) => {
    const existing = await findProductBySku(args.endpoint, cookie, pair.iconId);
    if (existing) {
      wouldSkip++;
      if (args.verbose) {
        // eslint-disable-next-line no-console
        console.log(`[${idx + 1}/${pairs.length}] skip ${pair.iconId} (${pair.displayName}) — already exists`);
      }
      return;
    }

    wouldCreate++;
    // eslint-disable-next-line no-console
    console.log(`[${idx + 1}/${pairs.length}] ${args.apply ? 'create' : 'would create'} ${pair.iconId} (${pair.displayName})`);

    if (!args.apply) return;

    const tags = ['icon', `icon:${pair.iconId}`, `cat:${pair.categoryPath}`];
    const { renderAssetId, insertAssetId } = await uploadTwoPngAssets(
      args.endpoint,
      cookie,
      pair.render.absPath,
      pair.insert.absPath,
      tags,
    );

    await createIconProductAndVariant(
      args.endpoint,
      cookie,
      pair,
      renderAssetId,
      insertAssetId,
      args.currencyCode,
      args.price,
      args.stockOnHand,
    );
  });

  // eslint-disable-next-line no-console
  console.log(`Done. ${args.apply ? 'Created' : 'Would create'}=${wouldCreate}, skipped=${wouldSkip}`);

  // Best-effort cleanup
  for (const d of tempDirs) {
    // eslint-disable-next-line no-console
    if (args.verbose) console.log(`Cleaning up temp dir: ${d}`);
    // eslint-disable-next-line no-await-in-loop
    await fs.rm(d, { recursive: true, force: true });
  }
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
