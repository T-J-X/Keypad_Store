import 'dotenv/config';

import path from 'node:path';
import ExcelJS from 'exceljs';

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
};

type IconProduct = {
  id: string;
  name: string;
  customFields?: { isIconProduct?: boolean | null } | null;
  variants: Array<{ id: string; sku: string }>;
};

type ResolvedProduct = {
  product: IconProduct;
  matchStrategy: 'sku-column' | 'name-exact' | 'sku-from-name' | 'name-without-code';
};

function usage(exitCode = 0): never {
  const text = `
Sync iconCategories from spreadsheet into Vendure Product.customFields.iconCategories.

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

function splitCsvish(raw: string) {
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function dedupeCategories(raw: string[]) {
  const byNorm = new Map<string, string>();
  for (const item of raw) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = norm(trimmed);
    if (!byNorm.has(key)) byNorm.set(key, trimmed);
  }
  const values = Array.from(byNorm.values());
  return values.length > 0 ? values : ['Uncategorised'];
}

function findColumnIndex(headersByNorm: Map<string, number>, candidates: string[]): number | null {
  for (const c of candidates) {
    const found = headersByNorm.get(norm(c));
    if (found) return found;
  }
  return null;
}

function cellToString(value: ExcelJS.CellValue | undefined | null): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') {
      return value.text;
    }
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text ?? '').join('');
    }
    if ('result' in value && value.result != null) {
      return String(value.result);
    }
  }
  return String(value);
}

async function parseSpreadsheet(filePath: string, requestedSheetName: string): Promise<SpreadsheetRow[]> {
  const workbook = new ExcelJS.Workbook();
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    await workbook.csv.readFile(filePath);
  } else {
    await workbook.xlsx.readFile(filePath);
  }

  const sheet =
    workbook.worksheets.find((worksheet) => norm(worksheet.name) === norm(requestedSheetName)) ??
    workbook.worksheets[0];
  if (!sheet) throw new Error(`No sheet found in ${filePath}`);

  const headerRow = sheet.getRow(1);
  const headersByNorm = new Map<string, number>();
  const headersFound: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = cellToString(cell.value).trim();
    if (!header) return;
    headersByNorm.set(norm(header), colNumber);
    headersFound.push(header);
  });

  const iconNameColumn = findColumnIndex(headersByNorm, ['Icon name (exact)', 'Icon name', 'Name']);
  const categoriesColumn = findColumnIndex(headersByNorm, ['Category/Categories', 'Categories', 'Category']);
  const skuColumn = findColumnIndex(headersByNorm, ['SKU', 'Icon ID', 'IconId', 'iconId']);

  if (!iconNameColumn || !categoriesColumn) {
    throw new Error(
      `Required columns missing. Found headers: ${headersFound.join(', ')}. Required: Icon name, Category/Categories.`,
    );
  }

  const out: SpreadsheetRow[] = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const iconNameRaw = cellToString(row.getCell(iconNameColumn).value).trim();
    if (!iconNameRaw) continue;

    const categories = dedupeCategories(splitCsvish(cellToString(row.getCell(categoriesColumn).value)));
    const skuFromRow = skuColumn ? cellToString(row.getCell(skuColumn).value).trim() : '';

    const m = iconNameRaw.match(/^([A-Za-z0-9]+)\s*-\s*(.+)$/);
    const iconNameWithoutCode = m ? m[2].trim() : iconNameRaw;
    const skuFromName = m ? m[1].trim() : '';

    out.push({
      index: rowNumber,
      iconNameRaw,
      iconNameWithoutCode,
      skuFromRow: skuFromRow || skuFromName || undefined,
      categories,
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
          customFields { isIconProduct }
          variants { id sku }
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

async function updateProductCategories(
  endpoint: string,
  cookie: string,
  productId: string,
  categories: string[],
): Promise<void> {
  const mutation = `
    mutation UpdateProduct($input: UpdateProductInput!) {
      updateProduct(input: $input) { id }
    }
  `;

  await graphql(
    endpoint,
    mutation,
    {
      input: {
        id: productId,
        customFields: {
          iconCategories: categories,
        },
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.apply ? 'APPLY' : 'DRY RUN';

  // eslint-disable-next-line no-console
  console.log(`${mode}: sync iconCategories from ${path.resolve(args.filePath)} (sheet: ${args.sheetName})`);

  const rows = await parseSpreadsheet(args.filePath, args.sheetName);
  if (rows.length === 0) throw new Error('Spreadsheet has no data rows');
  // eslint-disable-next-line no-console
  console.log(`Parsed rows: ${rows.length}`);

  const cookie = await login(args.endpoint, args.username, args.password);
  const iconProducts = await fetchAllIconProducts(args.endpoint, cookie);

  const bySku = new Map<string, IconProduct>();
  for (const p of iconProducts) {
    for (const v of p.variants) {
      if (v.sku) bySku.set(v.sku, p);
    }
  }
  const byName = buildByName(iconProducts);

  // eslint-disable-next-line no-console
  console.log(`Loaded icon products: ${iconProducts.length}`);

  const notFound: Array<{ row: number; iconName: string; reason: string }> = [];
  const duplicateRowsSkipped: Array<{ row: number; iconName: string }> = [];
  const seenProductIds = new Set<string>();
  const updatedProducts = new Map<
    string,
    { name: string; sku: string; categories: string[]; matchStrategy: ResolvedProduct['matchStrategy'] }
  >();

  for (const row of rows) {
    const resolved = resolveProduct(row, bySku, byName);
    if (!resolved) {
      notFound.push({
        row: row.index,
        iconName: row.iconNameRaw,
        reason: 'No matching icon product by exact name or SKU',
      });
      continue;
    }

    if (seenProductIds.has(resolved.product.id)) {
      duplicateRowsSkipped.push({ row: row.index, iconName: row.iconNameRaw });
      continue;
    }
    seenProductIds.add(resolved.product.id);

    if (args.apply) {
      await updateProductCategories(args.endpoint, cookie, resolved.product.id, row.categories);
    }

    const sku = resolved.product.variants[0]?.sku ?? '';
    updatedProducts.set(resolved.product.id, {
      name: resolved.product.name,
      sku,
      categories: row.categories,
      matchStrategy: resolved.matchStrategy,
    });
  }

  // eslint-disable-next-line no-console
  console.log('--- Summary ---');
  // eslint-disable-next-line no-console
  console.log(`${args.apply ? 'Products updated' : 'Products to update'}: ${updatedProducts.size}`);

  if (args.verbose) {
    // eslint-disable-next-line no-console
    console.log('Updated products:');
    for (const p of Array.from(updatedProducts.values()).sort((a, b) => a.sku.localeCompare(b.sku))) {
      // eslint-disable-next-line no-console
      console.log(`- ${p.sku} | ${p.name} | categories=[${p.categories.join(', ')}] | via=${p.matchStrategy}`);
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
    for (const miss of notFound.slice(0, 200)) {
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
