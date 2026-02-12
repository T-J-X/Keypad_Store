import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

type Args = {
  endpoint: string;
  shopEndpoint: string;
  username: string;
  password: string;
  dryRun: boolean;
  force: boolean;
};

type CategoryStat = {
  slug: string;
  name: string;
  count: number;
};

type BaseShopConfigResponse = {
  baseShopConfig: {
    id: string;
    topTiles: Array<{
      id: string;
      label?: string | null;
      subtitle?: string | null;
      href?: string | null;
      hoverStyle?: string | null;
      kind?: string | null;
      isEnabled?: boolean | null;
      imageAssetId?: string | null;
    }>;
    disciplineTiles: Array<{
      id: string;
      labelOverride?: string | null;
      order?: number | null;
      isEnabled?: boolean | null;
      imageAssetId?: string | null;
    }>;
    featuredProductSlugs: string[];
  };
};

type ProductPageResponse = {
  products: {
    totalItems: number;
    items: Array<{
      customFields?: {
        isIconProduct?: boolean | null;
        iconCategories?: string[] | null;
      } | null;
    }>;
  };
};

type CreateAssetsResponse = {
  createAssets: Array<
    | {
      __typename: 'Asset';
      id: string;
      name: string;
      preview?: string | null;
      source?: string | null;
    }
    | {
      __typename: 'MimeTypeError';
      message: string;
    }
  >;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    endpoint: 'http://localhost:3000/admin-api',
    shopEndpoint: 'http://localhost:3000/shop-api',
    username: process.env.SUPERADMIN_USERNAME ?? 'superadmin',
    password: process.env.SUPERADMIN_PASSWORD ?? 'superadmin',
    dryRun: false,
    force: false,
  };

  const read = (i: number) => {
    const value = argv[i + 1];
    if (!value || value.startsWith('-')) {
      throw new Error(`Missing value for ${argv[i]}`);
    }
    return value;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') continue;
    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (arg === '--force') {
      args.force = true;
      continue;
    }
    if (arg === '--endpoint') {
      args.endpoint = read(i);
      i += 1;
      continue;
    }
    if (arg === '--shop-endpoint') {
      args.shopEndpoint = read(i);
      i += 1;
      continue;
    }
    if (arg === '--username') {
      args.username = read(i);
      i += 1;
      continue;
    }
    if (arg === '--password') {
      args.password = read(i);
      i += 1;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      printUsageAndExit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function printUsageAndExit(code: number): never {
  console.log([
    'Seed Shop Landing icons from React Icons (Tabler outline set).',
    '',
    'Usage:',
    '  pnpm -C apps/backend ts-node -r dotenv/config scripts/seed-shop-landing-icons.ts [--dry-run] [--force]',
    '',
    'Options:',
    '  --endpoint <url>       Admin API endpoint (default: http://localhost:3000/admin-api)',
    '  --shop-endpoint <url>  Shop API endpoint (default: http://localhost:3000/shop-api)',
    '  --username <value>     Admin username (default: SUPERADMIN_USERNAME)',
    '  --password <value>     Admin password (default: SUPERADMIN_PASSWORD)',
    '  --dry-run              Preview updates without creating assets or saving config',
    '  --force                Replace existing category icons and explore-more image',
  ].join('\n'));
  process.exit(code);
}

function normalizeCategoryName(input?: string | null): string {
  const value = (input ?? '').trim();
  return value || 'Uncategorised';
}

function categorySlug(input?: string | null): string {
  return normalizeCategoryName(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'uncategorised';
}

function cookieHeaderFromSetCookie(setCookies: string[]): string {
  return setCookies
    .map((item) => item.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

async function graphql<TData>(
  endpoint: string,
  query: string,
  variables: Record<string, unknown>,
  cookie?: string,
): Promise<{ data: TData; setCookies: string[] }> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as {
    data?: TData;
    errors?: Array<{ message?: string }>;
  };

  const setCookies = response.headers.getSetCookie?.() ?? [];

  if (!response.ok || (json.errors?.length ?? 0) > 0) {
    const message = json.errors?.[0]?.message ?? `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (!json.data) {
    throw new Error('Missing GraphQL response data');
  }

  return {
    data: json.data,
    setCookies,
  };
}

async function graphqlUploadAsset(
  endpoint: string,
  cookie: string,
  fileContent: BlobPart,
  mimeType: string,
  fileName: string,
  tags: string[],
): Promise<{ id: string; name: string }> {
  const mutation = `
    mutation CreateAssets($input: [CreateAssetInput!]!) {
      createAssets(input: $input) {
        __typename
        ... on Asset {
          id
          name
        }
        ... on MimeTypeError {
          message
        }
      }
    }
  `;

  const operations = {
    query: mutation,
    variables: {
      input: [
        {
          file: null,
          tags,
          customFields: {
            seededBy: 'shop-landing-icons',
          },
        },
      ],
    },
  };

  const map = {
    0: ['variables.input.0.file'],
  };

  const form = new FormData();
  form.set('operations', JSON.stringify(operations));
  form.set('map', JSON.stringify(map));
  form.set('0', new Blob([fileContent], { type: mimeType }), fileName);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      cookie,
    },
    body: form,
  });

  const json = (await response.json()) as {
    data?: CreateAssetsResponse;
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok || (json.errors?.length ?? 0) > 0) {
    const message = json.errors?.[0]?.message ?? `Upload failed (${response.status})`;
    throw new Error(message);
  }

  const result = json.data?.createAssets?.[0];
  if (!result) {
    throw new Error('Upload returned no result');
  }

  if (result.__typename !== 'Asset') {
    const error = result as { __typename: string; message?: string };
    throw new Error(error.message ?? `Upload failed: ${result.__typename}`);
  }

  return {
    id: result.id,
    name: result.name,
  };
}

async function login(endpoint: string, username: string, password: string): Promise<string> {
  const mutation = `
    mutation Login($username: String!, $password: String!) {
      login(username: $username, password: $password, rememberMe: true) {
        __typename
        ... on CurrentUser {
          id
          identifier
        }
        ... on ErrorResult {
          message
        }
      }
    }
  `;

  const { data, setCookies } = await graphql<{
    login:
      | {
        __typename: 'CurrentUser';
        id: string;
        identifier: string;
      }
      | {
        __typename: string;
        message?: string;
      };
  }>(endpoint, mutation, { username, password });

  if (data.login.__typename !== 'CurrentUser') {
    const message = (data.login as { message?: string }).message ?? 'Login failed';
    throw new Error(message);
  }

  const cookie = cookieHeaderFromSetCookie(setCookies);
  if (!cookie) {
    throw new Error('Login succeeded but no session cookie returned');
  }

  return cookie;
}

async function fetchCategoryStats(shopEndpoint: string): Promise<CategoryStat[]> {
  const query = `
    query IconProducts($options: ProductListOptions) {
      products(options: $options) {
        totalItems
        items {
          customFields {
            isIconProduct
            iconCategories
          }
        }
      }
    }
  `;

  const take = 100;
  let skip = 0;
  let totalItems = 0;
  const bySlug = new Map<string, CategoryStat>();

  do {
    const { data } = await graphql<ProductPageResponse>(
      shopEndpoint,
      query,
      {
        options: {
          take,
          skip,
          filter: {
            isIconProduct: {
              eq: true,
            },
          },
        },
      },
    );

    totalItems = data.products.totalItems;
    const items = data.products.items ?? [];

    for (const item of items) {
      const categories = Array.isArray(item.customFields?.iconCategories)
        ? item.customFields?.iconCategories
        : [];

      const normalized = categories
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => normalizeCategoryName(value));

      for (const name of normalized) {
        const slug = categorySlug(name);
        const existing = bySlug.get(slug);
        if (existing) {
          existing.count += 1;
          continue;
        }
        bySlug.set(slug, {
          slug,
          name,
          count: 1,
        });
      }
    }

    if (items.length === 0) {
      break;
    }

    skip += items.length;
  } while (skip < totalItems);

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function categoryToTablerCandidates(slug: string): string[] {
  const mapping: Record<string, string[]> = {
    accessories: ['tool', 'tools'],
    battery: ['battery-automotive', 'battery-4'],
    drivetrain: ['manual-gearbox', 'automatic-gearbox'],
    engine: ['engine', 'car-turbine'],
    'engine-internal-controls': ['dashboard', 'adjustments-horizontal'],
    generic: ['car', 'category-2'],
    hvac: ['car-fan-auto', 'air-conditioning'],
    hydraulics: ['gauge', 'car-turbine'],
    infotainment: ['device-speaker', 'speakerphone'],
    'internal-controls': ['steering-wheel', 'switch-3'],
    letters: ['alphabet-latin', 'circle-letter-a'],
    lights: ['lamp-2', 'brightness-up'],
    numbers: ['circle-number-8', 'hexagon-number-8'],
    safety: ['shield-check', 'flag-check'],
    signals: ['traffic-lights', 'antenna-bars-5'],
    swatches: ['color-swatch', 'sparkles'],
    cockpit: ['dashboard', 'steering-wheel'],
    gearbox: ['manual-gearbox', 'automatic-gearbox'],
  };

  const defaults = ['bolt', 'category'];
  return [...(mapping[slug] ?? []), ...defaults];
}

async function fetchTablerSvg(iconName: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/tabler/tabler-icons/master/icons/outline/${iconName}.svg`;
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  const svg = await response.text();
  return svg;
}

function applySignatureBlue(svg: string): string {
  let output = svg
    .replace(/stroke=\"currentColor\"/g, 'stroke="#1f4f9c"')
    .replace(/stroke:\s*currentColor/g, 'stroke:#1f4f9c')
    .replace(/fill=\"currentColor\"/g, 'fill="#1f4f9c"')
    .replace(/fill:\s*currentColor/g, 'fill:#1f4f9c');

  if (!output.includes('<defs>')) {
    output = output.replace(
      /<svg([^>]*)>/,
      '<svg$1><defs><linearGradient id="aimshopBlue" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0d2f66"/><stop offset="55%" stop-color="#2053a2"/><stop offset="100%" stop-color="#3f75c4"/></linearGradient></defs>',
    );
  }

  output = output
    .replace(/stroke=\"#1f4f9c\"/g, 'stroke="url(#aimshopBlue)"')
    .replace(/fill=\"#1f4f9c\"/g, 'fill="url(#aimshopBlue)"');

  return output;
}

async function fetchRemoteFile(url: string): Promise<{ content: ArrayBuffer; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch remote image: ${url} (${response.status})`);
  }
  const content = await response.arrayBuffer();
  const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
  return { content, mimeType };
}

async function fetchBaseShopConfig(
  endpoint: string,
  cookie: string,
): Promise<BaseShopConfigResponse['baseShopConfig']> {
  const query = `
    query GetBaseShopConfig {
      baseShopConfig {
        id
        topTiles {
          id
          label
          subtitle
          href
          hoverStyle
          kind
          isEnabled
          imageAssetId
        }
        disciplineTiles {
          id
          labelOverride
          order
          isEnabled
          imageAssetId
        }
        featuredProductSlugs
      }
    }
  `;

  const { data } = await graphql<BaseShopConfigResponse>(endpoint, query, {}, cookie);
  return data.baseShopConfig;
}

async function updateBaseShopConfig(
  endpoint: string,
  cookie: string,
  input: {
    topTiles: Array<{
      id: string;
      label?: string | null;
      subtitle?: string | null;
      href?: string | null;
      hoverStyle?: string | null;
      kind?: string | null;
      isEnabled?: boolean;
      imageAssetId?: string | null;
    }>;
    disciplineTiles: Array<{
      id: string;
      labelOverride?: string | null;
      order?: number | null;
      isEnabled?: boolean;
      imageAssetId?: string | null;
    }>;
    featuredProductSlugs: string[];
  },
): Promise<void> {
  const mutation = `
    mutation UpdateBaseShopConfig($input: UpdateBaseShopConfigInput!) {
      updateBaseShopConfig(input: $input) {
        id
      }
    }
  `;

  await graphql(endpoint, mutation, { input }, cookie);
}

async function main() {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsageAndExit(1);
  }

  const cookie = await login(args.endpoint, args.username, args.password);
  const categories = await fetchCategoryStats(args.shopEndpoint);
  const config = await fetchBaseShopConfig(args.endpoint, cookie);
  const existingDisciplineTileBySlug = new Map(
    (config.disciplineTiles ?? []).map((tile) => [categorySlug(tile.id), tile]),
  );

  if (categories.length === 0) {
    console.log('No icon categories found. Nothing to seed.');
    return;
  }

  console.log(`Found ${categories.length} icon sub-categories.`);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'shop-landing-icons-'));

  const uploadedAssetBySlug = new Map<string, string>();
  const usedIconNames = new Set<string>();

  for (const category of categories) {
    const existingTile = existingDisciplineTileBySlug.get(category.slug);
    if (!args.dryRun && !args.force && existingTile?.imageAssetId) {
      console.log(`- ${category.name}: keeping existing asset ${existingTile.imageAssetId}`);
      continue;
    }

    const candidates = Array.from(new Set(categoryToTablerCandidates(category.slug)));
    let resolvedSvg: string | null = null;
    let resolvedIconName = '';

    for (const pass of [0, 1]) {
      for (const iconName of candidates) {
        if (pass === 0 && usedIconNames.has(iconName)) {
          continue;
        }
        const svg = await fetchTablerSvg(iconName);
        if (!svg) {
          continue;
        }
        resolvedSvg = applySignatureBlue(svg);
        resolvedIconName = iconName;
        break;
      }
      if (resolvedSvg) {
        break;
      }
    }

    if (!resolvedSvg) {
      console.warn(`- ${category.name}: no icon found in candidate set (${candidates.join(', ')})`);
      continue;
    }

    const fileName = `shop-landing-${category.slug}.svg`;
    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, resolvedSvg, 'utf8');

    if (args.dryRun) {
      console.log(`- ${category.name}: resolved ${resolvedIconName} (dry-run)`);
      continue;
    }

    const uploaded = await graphqlUploadAsset(
      args.endpoint,
      cookie,
      resolvedSvg,
      'image/svg+xml',
      fileName,
      ['shop-landing-icon', `category:${category.slug}`, 'react-icons-tb', `icon:${resolvedIconName}`],
    );

    usedIconNames.add(resolvedIconName);
    uploadedAssetBySlug.set(category.slug, uploaded.id);
    console.log(`- ${category.name}: uploaded ${resolvedIconName} -> asset ${uploaded.id}`);
  }

  const exploreImageUrl =
    'https://upload.wikimedia.org/wikipedia/commons/4/4d/Barber_Vintage_Motorsports_Museum_%28Birmingham%2C_Alabama%29_-_race_cars_display_1.jpg';
  const exploreTile = (config.topTiles ?? []).find((tile) => tile.kind === 'exploreMore');
  let exploreAssetId = exploreTile?.imageAssetId ?? null;

  if (args.force || !exploreAssetId) {
    if (args.dryRun) {
      console.log('- Explore more: would upload CC0 motorsport image (dry-run)');
    } else {
      const remote = await fetchRemoteFile(exploreImageUrl);
      const uploaded = await graphqlUploadAsset(
        args.endpoint,
        cookie,
        remote.content,
        remote.mimeType,
        'shop-landing-explore-more-motorsport.jpg',
        ['shop-landing-image', 'top-tile', 'explore-more', 'motorsport', 'cc0'],
      );
      exploreAssetId = uploaded.id;
      console.log(`- Explore more: uploaded motorsport image -> asset ${uploaded.id}`);
    }
  }

  if (args.dryRun) {
    console.log('Dry run complete. No assets uploaded and no config updated.');
    return;
  }

  const existingBySlug = new Map(
    (config.disciplineTiles ?? []).map((tile) => [categorySlug(tile.id), tile]),
  );

  const normalizedDisciplineTiles = categories.map((category, index) => {
    const existing = existingBySlug.get(category.slug);
    const uploadedId = uploadedAssetBySlug.get(category.slug);

    return {
      id: category.slug,
      labelOverride: existing?.labelOverride ?? null,
      order: index,
      isEnabled: existing?.isEnabled !== false,
      imageAssetId: uploadedId ?? existing?.imageAssetId ?? null,
    };
  });

  const topTiles = (config.topTiles ?? []).map((tile) => {
    if (tile.kind === 'exploreMore') {
      return {
        ...tile,
        href: '/shop?section=all',
        isEnabled: true,
        imageAssetId: exploreAssetId ?? tile.imageAssetId ?? null,
      };
    }
    return {
      ...tile,
      isEnabled: tile.isEnabled !== false,
    };
  });

  await updateBaseShopConfig(args.endpoint, cookie, {
    topTiles,
    disciplineTiles: normalizedDisciplineTiles,
    featuredProductSlugs: config.featuredProductSlugs ?? [],
  });

  console.log(`Saved Shop Landing page config with ${normalizedDisciplineTiles.length} category icon mappings.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
