import 'dotenv/config';

import path from 'node:path';
import { Client } from 'pg';
import XLSX from 'xlsx';

const ICON_DESCRIPTION = `Optimise your vehicle or vessel's control interface with Power Key Pro Small Inserts (PKP-SI). Designed exclusively for the PKP-SI series 15mm keypads, these robust, removable inserts offer professional-grade customisation for a wide variety of function applications.

Engineered for high-performance environments, these inserts are ideal for Automotive, Commercial, Marine, and Motorsport sectors. Each plastic insert features high-contrast, laser-etched icons and symbols, ensuring critical buttons remain clearly legible in both low-light conditions and direct sunlight.

When installed, the PKP-SI inserts maintain a secure, vibration-resistant fit while providing superior dust and water protection, making them suitable for open cockpits and harsh industrial conditions.

Key Features:

High Visibility: Laser-etched graphics deliver maximum contrast and readability in any lighting environment.

Rugged Durability: Designed to withstand the rigours of marine and motorsport applications.

Secure Sealing: Ensures ingress protection against dust and moisture when properly seated.

Simple Installation: Easily interchangeable using the specialised Insert Tool (sold separately).

Note: Compatible exclusively with Power Key Pro (PKP-SI) 15mm Keypad series.`;

type Args = {
  filePath: string;
  sheetName: string;
  endpoint: string;
  username: string;
  password: string;
  apply: boolean;
  verbose: boolean;
};

type SpreadsheetRow = {
  index: number;
  iconNameRaw: string;
  iconNameWithoutCode: string;
  skuFromRow?: string;
  categories: string[];
  applications: string[];
  colour: string;
  size: string;
};

type ProductTranslation = {
  id?: string;
  languageCode: string;
  name: string;
  slug: string;
};

type IconProduct = {
  id: string;
  name: string;
  slug: string;
  customFields?: { isIconProduct?: boolean | null } | null;
  variants: Array<{ id: string; sku: string }>;
  translations: ProductTranslation[];
};

type Collection = {
  id: string;
  name: string;
  slug: string;
  parent?: { id: string } | null;
  filters?: Array<{ code: string; args: Array<{ name: string; value: string }> }> | null;
};

type ResolvedProduct = {
  product: IconProduct;
  matchStrategy: 'sku-column' | 'name-exact' | 'sku-from-name' | 'name-without-code';
};

function usage(exitCode = 0): never {
  const text = `
Sync icon categories and metadata from a spreadsheet into Vendure.

Default mode is dry-run. Use --apply to write.

Usage:
  pnpm -C apps/backend sync:icon-catalog -- --file /Users/terry/Downloads/icon_catalogV1.xlsx [--apply]

Options:
  --file <path>          Spreadsheet path (.xlsx or .csv)
  --sheet <name>         Sheet name (default: Icons)
  --endpoint <url>       Admin API endpoint (default: http://localhost:3000/admin-api)
  --username <user>      Admin username (default: SUPERADMIN_USERNAME or "superadmin")
  --password <pass>      Admin password (default: SUPERADMIN_PASSWORD or "superadmin")
  --apply                Persist changes (default: false)
  --verbose              More logs
  -h, --help             Show help
`.trim();

  // eslint-disable-next-line no-console
  console.log(text);
  process.exit(exitCode);
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    filePath: '/Users/terry/Downloads/icon_catalogV1.xlsx',
    sheetName: 'Icons',
    endpoint: 'http://localhost:3000/admin-api',
    username: process.env.SUPERADMIN_USERNAME ?? 'superadmin',
    password: process.env.SUPERADMIN_PASSWORD ?? 'superadmin',
    apply: false,
    verbose: false,
  };

  const readValue = (i: number) => {
    const v = argv[i + 1];
    if (!v || v.startsWith('-')) usage(1);
    return v;
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') continue;
    if (a === '-h' || a === '--help') usage(0);
    if (a === '--apply') {
      out.apply = true;
      continue;
    }
    if (a === '--verbose') {
      out.verbose = true;
      continue;
    }
    if (a === '--file') {
      out.filePath = readValue(i);
      i++;
      continue;
    }
    if (a === '--sheet') {
      out.sheetName = readValue(i);
      i++;
      continue;
    }
    if (a === '--endpoint') {
      out.endpoint = readValue(i);
      i++;
      continue;
    }
    if (a === '--username') {
      out.username = readValue(i);
      i++;
      continue;
    }
    if (a === '--password') {
      out.password = readValue(i);
      i++;
      continue;
    }
    usage(1);
  }

  return out;
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

function slugify(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function splitCsvish(raw: string) {
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function findColumnKey(row: Record<string, unknown>, candidates: string[]): string | null {
  const keys = Object.keys(row);
  const byNorm = new Map<string, string>();
  for (const k of keys) {
    byNorm.set(norm(k), k);
  }
  for (const c of candidates) {
    const found = byNorm.get(norm(c));
    if (found) return found;
  }
  return null;
}

function parseSpreadsheet(filePath: string, requestedSheetName: string): SpreadsheetRow[] {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheetName =
    workbook.SheetNames.find((name) => norm(name) === norm(requestedSheetName)) ?? workbook.SheetNames[0];
  if (!sheetName) throw new Error(`No sheet found in ${filePath}`);
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (rawRows.length === 0) return [];

  const first = rawRows[0]!;
  const iconNameKey = findColumnKey(first, ['Icon name (exact)', 'Icon name', 'Name']);
  const categoriesKey = findColumnKey(first, ['Category/Categories', 'Categories', 'Category']);
  const applicationKey = findColumnKey(first, ['Application', 'Applications']);
  const colourKey = findColumnKey(first, ['Colour', 'Color']);
  const sizeKey = findColumnKey(first, ['Size']);
  const skuKey = findColumnKey(first, ['SKU', 'Icon ID', 'IconId', 'iconId']);

  if (!iconNameKey || !categoriesKey || !applicationKey || !colourKey || !sizeKey) {
    throw new Error(
      `Required columns missing. Found headers: ${Object.keys(first).join(', ')}. Required: Icon name, Category/Categories, Application, Colour, Size.`,
    );
  }

  const out: SpreadsheetRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const src = rawRows[i]!;
    const iconNameRaw = String(src[iconNameKey] ?? '').trim();
    if (!iconNameRaw) continue;

    const categories = splitCsvish(String(src[categoriesKey] ?? ''));
    const applications = splitCsvish(String(src[applicationKey] ?? ''));
    const colour = String(src[colourKey] ?? '').trim();
    const size = String(src[sizeKey] ?? '').trim() || '15mm';
    const skuFromRow = skuKey ? String(src[skuKey] ?? '').trim() : '';

    const m = iconNameRaw.match(/^([A-Za-z0-9]+)\s*-\s*(.+)$/);
    const iconNameWithoutCode = m ? m[2].trim() : iconNameRaw;
    const skuFromName = m ? m[1].trim() : '';

    out.push({
      index: i + 2,
      iconNameRaw,
      iconNameWithoutCode,
      skuFromRow: skuFromRow || skuFromName || undefined,
      categories,
      applications,
      colour,
      size,
    });
  }

  return out;
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

async function fetchAllIconProducts(endpoint: string, cookie: string): Promise<IconProduct[]> {
  const query = `
    query Products($options: ProductListOptions) {
      products(options: $options) {
        totalItems
        items {
          id
          name
          slug
          customFields { isIconProduct }
          variants { id sku }
          translations { id languageCode name slug }
        }
      }
    }
  `;

  const out: IconProduct[] = [];
  let skip = 0;
  while (true) {
    const { data } = await graphql<{
      products: { totalItems: number; items: IconProduct[] };
    }>(endpoint, query, { options: { take: 100, skip } }, cookie);

    const items = data.products.items ?? [];
    out.push(...items);
    skip += items.length;
    if (skip >= data.products.totalItems || items.length === 0) break;
  }
  return out.filter((p) => !!p.customFields?.isIconProduct);
}

async function fetchAllCollections(endpoint: string, cookie: string): Promise<Collection[]> {
  const query = `
    query Collections($options: CollectionListOptions) {
      collections(options: $options) {
        totalItems
        items {
          id
          name
          slug
          parent { id }
          filters { code args { name value } }
        }
      }
    }
  `;

  const out: Collection[] = [];
  let skip = 0;
  while (true) {
    const { data } = await graphql<{
      collections: { totalItems: number; items: Collection[] };
    }>(endpoint, query, { options: { take: 100, skip } }, cookie);

    const items = data.collections.items ?? [];
    out.push(...items);
    skip += items.length;
    if (skip >= data.collections.totalItems || items.length === 0) break;
  }
  return out;
}

async function createCollection(
  endpoint: string,
  cookie: string,
  input: {
    name: string;
    slug: string;
    parentId?: string;
  },
): Promise<Collection> {
  const mutation = `
    mutation CreateCollection($input: CreateCollectionInput!) {
      createCollection(input: $input) {
        id
        name
        slug
        parent { id }
      }
    }
  `;

  const { data } = await graphql<{ createCollection: Collection }>(
    endpoint,
    mutation,
    {
      input: {
        isPrivate: false,
        filters: [],
        parentId: input.parentId,
        translations: [{ languageCode: 'en', name: input.name, slug: input.slug, description: '' }],
      },
    },
    cookie,
  );
  return data.createCollection;
}

async function updateProductFromSheet(
  endpoint: string,
  cookie: string,
  product: IconProduct,
  row: SpreadsheetRow,
): Promise<void> {
  const translation =
    product.translations.find((t) => t.languageCode.toLowerCase() === 'en') ?? product.translations[0];
  if (!translation) throw new Error(`Product ${product.id} has no translations`);

  const mutation = `
    mutation UpdateProduct($input: UpdateProductInput!) {
      updateProduct(input: $input) {
        id
      }
    }
  `;

  await graphql(
    endpoint,
    mutation,
    {
      input: {
        id: product.id,
        customFields: {
          application: row.applications,
          colour: row.colour,
          size: row.size || '15mm',
        },
        translations: [
          {
            id: translation.id,
            languageCode: translation.languageCode,
            name: translation.name,
            slug: translation.slug,
            description: ICON_DESCRIPTION,
          },
        ],
      },
    },
    cookie,
  );
}

function resolveProduct(
  row: SpreadsheetRow,
  bySku: Map<string, IconProduct>,
  byName: Map<string, IconProduct[]>,
): ResolvedProduct | null {
  if (row.skuFromRow) {
    const bySkuHit = bySku.get(row.skuFromRow);
    if (bySkuHit) return { product: bySkuHit, matchStrategy: 'sku-column' };
  }

  const exactNameHits = byName.get(row.iconNameRaw) ?? [];
  if (exactNameHits.length === 1) {
    return { product: exactNameHits[0], matchStrategy: 'name-exact' };
  }

  const fromNameSkuMatch = row.iconNameRaw.match(/^([A-Za-z0-9]+)\s*-\s*(.+)$/);
  if (fromNameSkuMatch) {
    const maybeBySku = bySku.get(fromNameSkuMatch[1]);
    if (maybeBySku) {
      return { product: maybeBySku, matchStrategy: 'sku-from-name' };
    }
  }

  const plainNameHits = byName.get(row.iconNameWithoutCode) ?? [];
  if (plainNameHits.length === 1) {
    return { product: plainNameHits[0], matchStrategy: 'name-without-code' };
  }

  return null;
}

function buildByName(products: IconProduct[]) {
  const byName = new Map<string, IconProduct[]>();
  for (const p of products) {
    const key = p.name.trim();
    const arr = byName.get(key) ?? [];
    arr.push(p);
    byName.set(key, arr);
  }
  return byName;
}

function toIntId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

async function syncCollectionMembershipInDb(
  assignments: Map<number, Set<number>>,
  categoryCollectionIds: number[],
): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'vendure',
    password: process.env.DB_PASSWORD ?? 'vendure_dev_password',
    database: process.env.DB_NAME ?? 'vendure',
  });

  await client.connect();
  try {
    await client.query('BEGIN');

    if (categoryCollectionIds.length) {
      await client.query(
        `UPDATE collection
         SET filters = '[]',
             "inheritFilters" = true,
             "updatedAt" = NOW()
         WHERE id = ANY($1::int[])`,
        [categoryCollectionIds],
      );
    }

    for (const [collectionId, variantIdsSet] of assignments.entries()) {
      const variantIds = Array.from(variantIdsSet);
      // Replace category membership deterministically from spreadsheet source-of-truth.
      // eslint-disable-next-line no-await-in-loop
      await client.query(
        `DELETE FROM collection_product_variants_product_variant
         WHERE "collectionId" = $1`,
        [collectionId],
      );

      if (variantIds.length === 0) continue;

      const values: string[] = [];
      const params: number[] = [];
      for (let i = 0; i < variantIds.length; i++) {
        values.push(`($${i * 2 + 1}, $${i * 2 + 2})`);
        params.push(collectionId, variantIds[i]);
      }
      // eslint-disable-next-line no-await-in-loop
      await client.query(
        `INSERT INTO collection_product_variants_product_variant
         ("collectionId", "productVariantId")
         VALUES ${values.join(', ')}
         ON CONFLICT DO NOTHING`,
        params,
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.apply ? 'APPLY' : 'DRY RUN';

  // eslint-disable-next-line no-console
  console.log(`${mode}: sync icon catalog from ${path.resolve(args.filePath)} (sheet: ${args.sheetName})`);

  const rows = parseSpreadsheet(args.filePath, args.sheetName);
  if (rows.length === 0) throw new Error('Spreadsheet has no data rows');
  // eslint-disable-next-line no-console
  console.log(`Parsed rows: ${rows.length}`);

  const cookie = await login(args.endpoint, args.username, args.password);
  const [iconProducts, collections] = await Promise.all([
    fetchAllIconProducts(args.endpoint, cookie),
    fetchAllCollections(args.endpoint, cookie),
  ]);

  const bySku = new Map<string, IconProduct>();
  for (const p of iconProducts) {
    for (const v of p.variants) {
      if (v.sku) bySku.set(v.sku, p);
    }
  }
  const byName = buildByName(iconProducts);

  // eslint-disable-next-line no-console
  console.log(`Loaded icon products: ${iconProducts.length}`);

  const rootIconsCandidates = collections
    .filter((c) => norm(c.name) === 'icons')
    .sort((a, b) => Number(!!a.parent) - Number(!!b.parent));

  let rootIcons = rootIconsCandidates[0] ?? null;
  const categoriesCreated: string[] = [];
  if (!rootIcons) {
    if (args.apply) {
      rootIcons = await createCollection(args.endpoint, cookie, { name: 'Icons', slug: 'icons' });
    } else {
      rootIcons = { id: 'DRY-RUN-ICONS', name: 'Icons', slug: 'icons', parent: null };
    }
    categoriesCreated.push('Icons');
  }

  const categoryDisplayByKey = new Map<string, string>();
  for (const row of rows) {
    for (const c of row.categories) {
      const key = norm(c);
      if (!key) continue;
      if (!categoryDisplayByKey.has(key)) categoryDisplayByKey.set(key, c.trim());
    }
  }

  const childrenByParentAndName = new Map<string, Collection>();
  for (const c of collections) {
    const key = `${c.parent?.id ?? 'ROOT'}::${norm(c.name)}`;
    childrenByParentAndName.set(key, c);
  }

  const categoryCollectionByKey = new Map<string, Collection>();
  for (const [key, display] of categoryDisplayByKey.entries()) {
    const lookupKey = `${rootIcons.id}::${key}`;
    const existing = childrenByParentAndName.get(lookupKey);
    if (existing) {
      categoryCollectionByKey.set(key, existing);
      continue;
    }
    const created = args.apply
      ? await createCollection(args.endpoint, cookie, {
          name: display,
          slug: slugify(display),
          parentId: rootIcons.id,
        })
      : {
          id: `DRY-RUN-${slugify(display)}`,
          name: display,
          slug: slugify(display),
          parent: { id: rootIcons.id },
        };
    categoriesCreated.push(display);
    categoryCollectionByKey.set(key, created);
  }

  const notFound: Array<{ row: number; iconName: string; reason: string }> = [];
  const duplicateRowsSkipped: Array<{ row: number; iconName: string }> = [];
  const updatedProducts = new Map<
    string,
    { name: string; sku: string; categories: number; matchStrategy: ResolvedProduct['matchStrategy'] }
  >();
  const variantIdsByCollection = new Map<number, Set<number>>();
  const perCategoryAssignments = new Map<string, number>();
  const categoryCountHistogram = new Map<number, number>();
  const seenProductIds = new Set<string>();

  for (const row of rows) {
    const resolved = resolveProduct(row, bySku, byName);
    if (!resolved) {
      notFound.push({
        row: row.index,
        iconName: row.iconNameRaw,
        reason: `No matching icon product by exact name or SKU`,
      });
      continue;
    }

    if (seenProductIds.has(resolved.product.id)) {
      duplicateRowsSkipped.push({ row: row.index, iconName: row.iconNameRaw });
      continue;
    }
    seenProductIds.add(resolved.product.id);

    if (args.apply) {
      await updateProductFromSheet(args.endpoint, cookie, resolved.product, row);
    }

    const sku = resolved.product.variants[0]?.sku ?? '';
    updatedProducts.set(resolved.product.id, {
      name: resolved.product.name,
      sku,
      categories: row.categories.length,
      matchStrategy: resolved.matchStrategy,
    });

    categoryCountHistogram.set(
      row.categories.length,
      (categoryCountHistogram.get(row.categories.length) ?? 0) + 1,
    );

    for (const category of row.categories) {
      const key = norm(category);
      if (!key) continue;
      const collection = categoryCollectionByKey.get(key);
      if (!collection) {
        notFound.push({
          row: row.index,
          iconName: row.iconNameRaw,
          reason: `Category collection missing for "${category}"`,
        });
        continue;
      }
      const collectionId = toIntId(collection.id);
      const variantId = toIntId(resolved.product.variants[0]?.id ?? '');
      if (collectionId === null || variantId === null) {
        notFound.push({
          row: row.index,
          iconName: row.iconNameRaw,
          reason: `Invalid collection/variant id for assignment`,
        });
        continue;
      }
      const set = variantIdsByCollection.get(collectionId) ?? new Set<number>();
      set.add(variantId);
      variantIdsByCollection.set(collectionId, set);
      perCategoryAssignments.set(collection.name, (perCategoryAssignments.get(collection.name) ?? 0) + 1);
    }
  }

  let linksApplied = 0;
  for (const [, variantSet] of variantIdsByCollection.entries()) {
    linksApplied += variantSet.size;
  }

  if (args.apply) {
    const categoryCollectionIds = Array.from(categoryCollectionByKey.values())
      .map((c) => toIntId(c.id))
      .filter((n): n is number => n !== null);
    await syncCollectionMembershipInDb(variantIdsByCollection, categoryCollectionIds);
  }

  // eslint-disable-next-line no-console
  console.log('--- Summary ---');
  // eslint-disable-next-line no-console
  console.log(
    `${args.apply ? 'Categories created' : 'Categories to create'}: ${categoriesCreated.length} (${categoriesCreated.join(', ') || 'none'})`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `${args.apply ? 'Products updated' : 'Products to update'}: ${updatedProducts.size}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `${args.apply ? 'Collection links added' : 'Collection links to add'}: ${linksApplied}`,
  );

  const histogram = Array.from(categoryCountHistogram.entries()).sort((a, b) => a[0] - b[0]);
  // eslint-disable-next-line no-console
  console.log(
    `Products by category count: ${histogram.map(([count, qty]) => `${count}=>${qty}`).join(', ') || 'none'}`,
  );

  if (args.verbose) {
    // eslint-disable-next-line no-console
    console.log('Assignments by category:');
    for (const [name, qty] of Array.from(perCategoryAssignments.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      // eslint-disable-next-line no-console
      console.log(`- ${name}: ${qty}`);
    }
    // eslint-disable-next-line no-console
    console.log('Updated products:');
    for (const p of Array.from(updatedProducts.values()).sort((a, b) => a.sku.localeCompare(b.sku))) {
      // eslint-disable-next-line no-console
      console.log(`- ${p.sku} | ${p.name} | categories=${p.categories} | via=${p.matchStrategy}`);
    }
  }

  if (duplicateRowsSkipped.length) {
    // eslint-disable-next-line no-console
    console.log(`Rows skipped as duplicate icon rows: ${duplicateRowsSkipped.length}`);
    for (const d of duplicateRowsSkipped.slice(0, 20)) {
      // eslint-disable-next-line no-console
      console.log(`- row ${d.row}: ${d.iconName}`);
    }
  }

  if (notFound.length) {
    // eslint-disable-next-line no-console
    console.log(`Products not found / rows skipped: ${notFound.length}`);
    for (const miss of notFound) {
      // eslint-disable-next-line no-console
      console.log(`- row ${miss.row}: ${miss.iconName} (${miss.reason})`);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('Products not found / rows skipped: 0');
  }
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
