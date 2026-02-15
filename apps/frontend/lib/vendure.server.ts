import 'server-only';
import { cache } from 'react';
import type {
  BaseShopDisciplineTile,
  BaseShopTopTile,
  BaseShopPublicConfig,
  CatalogProduct,
  IconProduct,
  KeypadProduct,
} from './vendure';

const SHOP_API = process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';
const MAX_LIST_TAKE = 100;

type GraphResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

export async function vendureFetch<T>(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(SHOP_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ query, variables })
  });

  const json = (await res.json()) as GraphResponse<T>;
  if (!res.ok || json.errors?.length) {
    const message = json.errors?.[0]?.message ?? `Vendure error (${res.status})`;
    throw new Error(message);
  }
  if (!json.data) throw new Error('Vendure response missing data');
  return json.data;
}

const PRODUCT_VARIANT_FIELDS = `
  id
  name
  sku
  priceWithTax
  currencyCode
  stockLevel
  customFields {
    iconId
    insertAssetId
    sizeMm
    iconType
    keypadModelCode
    slotMapKey
  }
`;

const PRODUCT_VARIANT_FIELDS_WITH_NUMERIC_STOCK = `
  ${PRODUCT_VARIANT_FIELDS}
  stockOnHand
  stockAllocated
`;

const PRODUCT_FIELDS = `
  id
  name
  slug
  description
  featuredAsset { id preview source name }
  assets { id preview source name }
  variants { ${PRODUCT_VARIANT_FIELDS} }
  customFields {
    isIconProduct
    iconId
    iconCategories
    insertAssetId
    isKeypadProduct
    application
    colour
    size
    additionalSpecs {
      label
      value
    }
    whatsInTheBox
    downloads {
      id
      name
      source
      preview
    }
    seoTitle
    seoDescription
    seoNoIndex
    seoCanonicalUrl
    seoKeywords
  }
`;

const PRODUCT_FIELDS_WITH_NUMERIC_STOCK = `
  id
  name
  slug
  description
  featuredAsset { id preview source name }
  assets { id preview source name }
  variants { ${PRODUCT_VARIANT_FIELDS_WITH_NUMERIC_STOCK} }
  customFields {
    isIconProduct
    iconId
    iconCategories
    insertAssetId
    isKeypadProduct
    application
    colour
    size
    additionalSpecs {
      label
      value
    }
    whatsInTheBox
    downloads {
      id
      name
      source
      preview
    }
    seoTitle
    seoDescription
    seoNoIndex
    seoCanonicalUrl
    seoKeywords
  }
`;

const PRODUCT_LIST_QUERY = `
    query PagedProducts($options: ProductListOptions) {
      products(options: $options) {
        totalItems
        items {
          ${PRODUCT_FIELDS}
        }
      }
    }
  `;

type ProductListResponse = {
  products: {
    totalItems: number;
    items: CatalogProduct[];
  };
};

type BaseShopConfigPublicResponse = {
  baseShopConfigPublic: {
    featuredProductSlugs?: string[] | null;
    topTiles?: BaseShopTopTile[] | null;
    disciplineTiles?: BaseShopDisciplineTile[] | null;
  } | null;
};

export type IconPageResult = {
  items: IconProduct[];
  totalItems: number;
};

const SHOP_LANDING_TOP_TILE_FIELDS = `
  id
  label
  subtitle
  href
  hoverStyle
  kind
  isEnabled
  imagePreview
  imageSource
  imageAssetId
`;

const SHOP_LANDING_SUBCATEGORY_ICON_FIELDS = `
  id
  labelOverride
  order
  isEnabled
  imagePreview
  imageSource
  imageAssetId
`;

const SHOP_LANDING_CONTENT_QUERY = `
  query ShopLandingContent {
    baseShopConfigPublic {
      featuredProductSlugs
      topTiles {
        ${SHOP_LANDING_TOP_TILE_FIELDS}
      }
      disciplineTiles {
        ${SHOP_LANDING_SUBCATEGORY_ICON_FIELDS}
      }
    }
  }
`;

export async function fetchShopLandingContent(): Promise<BaseShopPublicConfig> {
  // This stays non-sticky so icon swaps in Vendure content reflect immediately.
  // vendureFetch() already uses fetch(cache: 'no-store').
  try {
    const data = await vendureFetch<BaseShopConfigPublicResponse>(SHOP_LANDING_CONTENT_QUERY);
    const config = data.baseShopConfigPublic;
    return {
      featuredProductSlugs: (config?.featuredProductSlugs ?? []).filter(
        (slug): slug is string => typeof slug === 'string' && slug.trim().length > 0,
      ),
      topTiles: (config?.topTiles ?? []).filter(Boolean),
      disciplineTiles: (config?.disciplineTiles ?? []).filter(Boolean),
    };
  } catch {
    return {
      featuredProductSlugs: [],
      topTiles: [],
      disciplineTiles: [],
    };
  }
}

export async function fetchBaseShopConfigPublic(): Promise<BaseShopPublicConfig> {
  try {
    return await fetchShopLandingContent();
  } catch {
    return {
      featuredProductSlugs: [],
      topTiles: [],
      disciplineTiles: [],
    };
  }
}

const fetchAllProducts = cache(async (): Promise<CatalogProduct[]> => {
  let skip = 0;
  const allProducts: CatalogProduct[] = [];

  while (true) {
    const data = await vendureFetch<ProductListResponse>(PRODUCT_LIST_QUERY, {
      options: { take: MAX_LIST_TAKE, skip }
    });
    const items = (data.products.items ?? []).map((item) => ({
      ...item,
      assets: item.assets ?? [],
      variants: item.variants ?? [],
    }));

    allProducts.push(...items);

    const nextSkip = skip + items.length;
    if (items.length === 0 || nextSkip <= skip || nextSkip >= data.products.totalItems) {
      break;
    }

    skip = nextSkip;
  }

  return allProducts;
});

export async function fetchIconProducts(): Promise<IconProduct[]> {
  const products = await fetchAllProducts();

  return products
    .filter((item) => item?.customFields?.isIconProduct)
    .map((item) => item as IconProduct);
}

export async function fetchIconProductsPage({
  page,
  take,
  query = '',
}: {
  page: number;
  take: number;
  query?: string;
}): Promise<IconPageResult> {
  const safeTake = Math.max(1, Math.min(MAX_LIST_TAKE, take));
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeTake;
  const trimmedQuery = query.trim();

  const filter: Record<string, unknown> = {
    isIconProduct: { eq: true },
  };

  if (trimmedQuery) {
    filter._or = [
      { iconId: { contains: trimmedQuery } },
      { name: { contains: trimmedQuery } },
      { slug: { contains: trimmedQuery } },
    ];
  }

  const data = await vendureFetch<ProductListResponse>(PRODUCT_LIST_QUERY, {
    options: {
      take: safeTake,
      skip,
      filter,
    },
  });

  const items = (data.products.items ?? []).map((item) => ({
    ...item,
    assets: item.assets ?? [],
    variants: item.variants ?? [],
  }));

  return {
    items: items.map((item) => item as IconProduct),
    totalItems: data.products.totalItems,
  };
}

export async function fetchKeypadProducts(): Promise<KeypadProduct[]> {
  const products = await fetchAllProducts();

  const keypads = products
    .filter((item) => item?.customFields?.isKeypadProduct)
    .map((item) => item as KeypadProduct);

  // Define the desired order based on model numbers
  const preferredOrder = ['2200', '2300', '2400', '2500', '2600', '3500'];

  return keypads.sort((a: KeypadProduct, b: KeypadProduct) => {
    // Helper to find the index of the model number in the product name or slug
    const getOrderIndex = (product: KeypadProduct) => {
      const identifier = (product.slug + product.name).toLowerCase();
      const index = preferredOrder.findIndex((model) => identifier.includes(model));
      return index === -1 ? 999 : index; // Place unknown models at the end
    };

    return getOrderIndex(a) - getOrderIndex(b);
  });
}

const fetchProductBySlugUncached = async (slug: string): Promise<CatalogProduct | null> => {
  const queryWithNumericStock = `
    query ProductBySlug($slug: String!) {
      product(slug: $slug) {
        ${PRODUCT_FIELDS_WITH_NUMERIC_STOCK}
      }
    }
  `;

  try {
    const data = await vendureFetch<{ product: CatalogProduct | null }>(queryWithNumericStock, { slug });
    if (!data.product) return null;
    return {
      ...data.product,
      assets: data.product.assets ?? [],
      variants: data.product.variants ?? [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const stockFieldMissing = /stockOnHand|stockAllocated/.test(message);
    if (!stockFieldMissing) throw error;

    const fallbackQuery = `
      query ProductBySlug($slug: String!) {
        product(slug: $slug) {
          ${PRODUCT_FIELDS}
        }
      }
    `;

    const fallbackData = await vendureFetch<{ product: CatalogProduct | null }>(fallbackQuery, { slug });
    if (!fallbackData.product) return null;
    return {
      ...fallbackData.product,
      assets: fallbackData.product.assets ?? [],
      variants: fallbackData.product.variants ?? [],
    };
  }
};

export const fetchProductBySlug = cache(async (slug: string): Promise<CatalogProduct | null> => {
  return fetchProductBySlugUncached(slug);
});

// --- Universal Fuzzy Search Logic ---

function normalizeForSearch(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, (_, i) => [i]);
  const firstRow = matrix[0];
  if (!firstRow) return 0; // Should not happen given constraints
  for (let j = 0; j <= an; j++) {
    firstRow[j] = j;
  }
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      const row = matrix[i];
      const prevRow = matrix[i - 1];
      if (row && prevRow) {
        row[j] = Math.min(
          prevRow[j]! + 1, // deletion
          row[j - 1]! + 1, // insertion
          prevRow[j - 1]! + cost // substitution
        );
      }
    }
  }
  return matrix[bn]?.[an] ?? bn;
}


function scoreProduct(product: CatalogProduct, normalizedQuery: string): number {
  let maxScore = 0;

  const fieldsToCheck = [
    product.name,
    product.slug,
    product.customFields?.iconId,
    ...(product.customFields?.iconCategories ?? []),
    product.customFields?.keypadModelCode,
    product.description
  ];

  const queryTerms = normalizedQuery.split(' ').filter(t => t.length > 0);

  for (const field of fieldsToCheck) {
    if (!field) continue;
    const normalizedField = normalizeForSearch(field);

    // Check against the full field
    if (normalizedField === normalizedQuery) return 100; // Exact match
    if (normalizedField.includes(normalizedQuery)) maxScore = Math.max(maxScore, 80);

    // Check individual terms
    for (const term of queryTerms) {
      if (normalizedField.includes(term)) {
        maxScore = Math.max(maxScore, 60);
      } else {
        // Fuzzy check for terms
        const words = normalizedField.split(' ');
        for (const word of words) {
          if (Math.abs(word.length - term.length) > 2) continue; // Too different in length
          const dist = levenshtein(word, term);
          // Allow 1 edit for short words, 2 for longer
          const threshold = term.length > 4 ? 2 : 1;
          if (dist <= threshold) {
            maxScore = Math.max(maxScore, 40);
          }
        }
      }
    }
  }

  return maxScore;
}

export async function searchGlobalProducts(query: string): Promise<CatalogProduct[]> {
  const allProducts = await fetchAllProducts();
  const normalizedQuery = normalizeForSearch(query);

  if (!normalizedQuery) return [];

  const scored = allProducts.map(p => ({
    product: p,
    score: scoreProduct(p, normalizedQuery)
  }));

  // Filter out low scores and sort
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
}
