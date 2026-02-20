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


import type { CheckoutSessionData, CheckoutOrder } from './checkoutTypes';

import { cookies } from 'next/headers';

const SHOP_API = process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';
const MAX_LIST_TAKE = 100;

type GraphResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

// --- Active Order Types & Query ---

const ACTIVE_ORDER_QUERY = `
  query ActiveOrder {
    activeOrder {
      id
      code
      currencyCode
      totalQuantity
      subTotalWithTax
      shippingWithTax
      totalWithTax
      lines {
        id
        quantity
        linePriceWithTax
        customFields {
          configuration
        }
        productVariant {
          id
          sku
          name
          currencyCode
          product {
            id
            slug
            name
            featuredAsset {
              preview
              source
            }
            facetValues {
              id
              name
              code
              facet {
                id
                name
                code
              }
            }
          }
        }
      }
    }
  }
`;

export type CartOrderLine = {
  id: string;
  quantity: number;
  linePriceWithTax: number;
  customFields?: {
    configuration?: string | null;
  } | null;
  productVariant: {
    id: string;
    sku?: string | null;
    name: string;
    currencyCode: string;
    product: {
      id: string;
      slug: string | null;
      name: string | null;
      featuredAsset: {
        preview: string | null;
        source: string | null;
      } | null;
      category?: string | null;
    } | null;
  } | null;
};

export type CartOrder = {
  id: string;
  code: string;
  currencyCode: string;
  totalQuantity: number;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  lines: CartOrderLine[];
};

type ActiveOrderResponse = {
  activeOrder?: {
    id: string;
    code: string;
    currencyCode?: string | null;
    totalQuantity?: number | null;
    subTotalWithTax?: number | null;
    shippingWithTax?: number | null;
    totalWithTax?: number | null;
    lines?: Array<{
      id: string;
      quantity?: number | null;
      linePriceWithTax?: number | null;
      customFields?: {
        configuration?: string | null;
      } | null;
      productVariant?: {
        id: string;
        sku?: string | null;
        name?: string | null;
        currencyCode?: string | null;
        product?: {
          id: string;
          slug?: string | null;
          name?: string | null;
          featuredAsset?: {
            preview?: string | null;
            source?: string | null;
          } | null;
          facetValues?: Array<{
            id: string;
            name: string;
            code: string;
            facet: {
              id: string;
              name: string;
              code: string;
            };
          }> | null;
        } | null;
      } | null;
    }> | null;
  } | null;
};

function normalizeInt(value: any): number {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export async function fetchActiveOrder(): Promise<CartOrder | null> {
  const cookieStore = await cookies();
  const headers: Record<string, string> = { 'content-type': 'application/json' };

  // Forward cookies to maintain session
  const activeCookies = cookieStore.getAll();
  const cookieString = activeCookies.map((c) => `${c.name}=${c.value}`).join('; ');
  if (cookieString) {
    headers.cookie = cookieString;
  }

  try {
    const res = await fetch(SHOP_API, {
      method: 'POST',
      headers,
      cache: 'no-store', // Always fetch fresh cart
      body: JSON.stringify({ query: ACTIVE_ORDER_QUERY }),
    });

    const json = (await res.json()) as GraphResponse<ActiveOrderResponse>;

    if (!res.ok || json.errors?.length) {
      console.error('Fetch active order error:', json.errors);
      return null;
    }

    const order = json.data?.activeOrder;
    if (!order) return null;

    return {
      id: order.id,
      code: order.code,
      currencyCode: order.currencyCode ?? 'USD',
      totalQuantity: normalizeInt(order.totalQuantity),
      subTotalWithTax: normalizeInt(order.subTotalWithTax),
      shippingWithTax: normalizeInt(order.shippingWithTax),
      totalWithTax: normalizeInt(order.totalWithTax),
      lines: (order.lines ?? []).map((line) => ({
        id: line.id,
        quantity: normalizeInt(line.quantity),
        linePriceWithTax: normalizeInt(line.linePriceWithTax),
        customFields: line.customFields
          ? {
            configuration: line.customFields.configuration ?? null,
          }
          : null,
        productVariant: line.productVariant
          ? {
            id: line.productVariant.id,
            sku: line.productVariant.sku ?? null,
            name: line.productVariant.name ?? 'Product variant',
            currencyCode: line.productVariant.currencyCode ?? order.currencyCode ?? 'USD',
            product: line.productVariant.product
              ? {
                id: line.productVariant.product.id,
                slug: line.productVariant.product.slug ?? null,
                name: line.productVariant.product.name ?? null,
                featuredAsset: line.productVariant.product.featuredAsset
                  ? {
                    preview: line.productVariant.product.featuredAsset.preview ?? null,
                    source: line.productVariant.product.featuredAsset.source ?? null,
                  }
                  : null,
                category: line.productVariant.product.facetValues?.find(fv => fv.facet.code === 'category')?.name || null,
              }
              : null,
          }
          : null,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch active order:', error);
    return null;
  }
}

const SESSION_SUMMARY_QUERY = `
  query SessionSummary {
    activeOrder {
    id
      totalQuantity
      totalWithTax
      currencyCode
      lines {
    id
        quantity
        linePriceWithTax
        productVariant {
    id
          name
          product {
    id
            name
            slug
            featuredAsset {
    preview
              source
  }
          }
        }
      }
    }
    activeCustomer {
  id
  firstName
  lastName
  emailAddress
}
  }
`;

type SessionSummary = {
  authenticated: boolean;
  activeCustomer: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddress?: string | null;
  } | null;
  activeOrder: {
    id: string;
    totalQuantity: number;
    totalWithTax: number;
    currencyCode: string;
  } | null;
};

export async function fetchSessionSummary(): Promise<SessionSummary> {
  const cookieStore = await cookies();
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const cookieString = cookieStore.toString();
  if (cookieString) headers.cookie = cookieString;

  try {
    const res = await fetch(SHOP_API, {
      method: 'POST',
      headers,
      cache: 'no-store',
      body: JSON.stringify({ query: SESSION_SUMMARY_QUERY }),
    });

    const json = (await res.json()) as GraphResponse<{
      activeOrder?: {
        id: string;
        totalQuantity?: number | null;
        totalWithTax?: number | null;
        currencyCode?: string | null;
      } | null;
      activeCustomer?: {
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        emailAddress?: string | null;
      } | null;
    }>;

    if (!res.ok || json.errors?.length) {
      return { authenticated: false, activeCustomer: null, activeOrder: null };
    }

    const customer = json.data?.activeCustomer;
    const order = json.data?.activeOrder;

    return {
      authenticated: Boolean(customer?.id),
      activeCustomer: customer
        ? {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          emailAddress: customer.emailAddress,
        }
        : null,
      activeOrder: order
        ? {
          id: order.id,
          totalQuantity: normalizeInt(order.totalQuantity),
          totalWithTax: normalizeInt(order.totalWithTax),
          currencyCode: order.currencyCode ?? 'USD',
        }
        : null,
    };
  } catch {
    return { authenticated: false, activeCustomer: null, activeOrder: null };
  }
}

const CHECKOUT_SESSION_QUERY = `
  query CheckoutSession {
    activeOrder {
    id
    code
    state
    totalQuantity
    subTotalWithTax
    shippingWithTax
    totalWithTax
    currencyCode
      lines {
      id
      quantity
      linePriceWithTax
        customFields {
        configuration
      }
        productVariant {
        id
        name
        currencyCode
          product {
          id
          slug
          name
            featuredAsset {
            preview
            source
          }
        }
      }
    }
  }
    eligibleShippingMethods {
    id
    code
    name
    description
    priceWithTax
  }
    eligiblePaymentMethods {
    id
    code
    name
    description
    isEligible
    eligibilityMessage
  }
    activePaymentMethods {
    code
    name
    description
  }
}
`;



export async function fetchCheckoutSession(): Promise<CheckoutSessionData> {
  const cookieStore = await cookies();
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const activeCookies = cookieStore.getAll();
  const cookieString = activeCookies.map((c) => `${c.name}=${c.value}`).join('; ');
  if (cookieString) headers.cookie = cookieString;

  try {
    const res = await fetch(SHOP_API, {
      method: 'POST',
      headers,
      cache: 'no-store',
      body: JSON.stringify({ query: CHECKOUT_SESSION_QUERY }),
    });

    const json = (await res.json()) as GraphResponse<{
      activeOrder?: any;
      eligibleShippingMethods?: any[];
      eligiblePaymentMethods?: any[];
      activePaymentMethods?: any[];
    }>;

    if (!res.ok || json.errors?.length) {
      if (json.errors?.length) {
        console.error('[fetchCheckoutSession] GraphQL Errors:', JSON.stringify(json.errors, null, 2));
      }
      return { order: null, shippingMethods: [], paymentMethods: [] };
    }

    const orderData = json.data?.activeOrder;
    const order: CheckoutOrder | null = orderData
      ? {
        id: orderData.id,
        code: orderData.code,
        state: orderData.state ?? null,
        currencyCode: orderData.currencyCode ?? 'USD',
        totalQuantity: normalizeInt(orderData.totalQuantity),
        subTotalWithTax: normalizeInt(orderData.subTotalWithTax),
        shippingWithTax: normalizeInt(orderData.shippingWithTax),
        totalWithTax: normalizeInt(orderData.totalWithTax),
        lines: (orderData.lines ?? []).map((line: any) => ({
          id: line.id,
          quantity: normalizeInt(line.quantity),
          linePriceWithTax: normalizeInt(line.linePriceWithTax),
          customFields: line.customFields
            ? { configuration: line.customFields.configuration ?? null }
            : null,
          productVariant: line.productVariant
            ? {
              id: line.productVariant.id,
              name: line.productVariant.name ?? 'Product variant',
              currencyCode: line.productVariant.currencyCode ?? orderData.currencyCode ?? 'USD',
              product: line.productVariant.product
                ? {
                  id: line.productVariant.product.id,
                  slug: line.productVariant.product.slug ?? null,
                  name: line.productVariant.product.name ?? null,
                  featuredAsset: line.productVariant.product.featuredAsset
                    ? {
                      preview: line.productVariant.product.featuredAsset.preview ?? null,
                      source: line.productVariant.product.featuredAsset.source ?? null,
                    }
                    : null,
                }
                : null,
            }
            : null,
        })),
      }
      : null;

    const shippingMethods = (json.data?.eligibleShippingMethods ?? []).map((method: any) => ({
      id: method.id,
      code: method.code ?? '',
      name: method.name ?? 'Shipping',
      description: method.description ?? '',
      priceWithTax: normalizeInt(method.priceWithTax),
    }));

    const eligiblePaymentMethods = (json.data?.eligiblePaymentMethods ?? [])
      .filter((method: any) => method.isEligible !== false)
      .map((method: any) => ({
        id: method.id,
        code: method.code ?? '',
        name: method.name ?? method.code ?? 'Payment method',
        description: method.description ?? method.eligibilityMessage ?? '',
        isEligible: true,
        eligibilityMessage: null,
      }))
      .filter((method: any) => method.code.trim().length > 0);

    const paymentMethods = eligiblePaymentMethods.length > 0
      ? eligiblePaymentMethods
      : (json.data?.activePaymentMethods ?? [])
        .map((method: any, index: number) => ({
          id: `active - ${index} `,
          code: method.code ?? '',
          name: method.name ?? method.code ?? 'Payment method',
          description: method.description ?? '',
          isEligible: true,
          eligibilityMessage: null,
        }))
        .filter((method: any) => method.code.trim().length > 0);

    return { order, shippingMethods, paymentMethods };
  } catch {
    return { order: null, shippingMethods: [], paymentMethods: [] };
  }
}



export async function vendureFetch<T>(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(SHOP_API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ query, variables })
  });

  const json = (await res.json()) as GraphResponse<T>;
  if (!res.ok || json.errors?.length) {
    const message = json.errors?.[0]?.message ?? `Vendure error(${res.status})`;
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

type IconPageResult = {
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

async function fetchBaseShopConfigPublic(): Promise<BaseShopPublicConfig> {
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

  // 1. Boost Keypads for explicit "keypad" searches
  if (product.customFields?.isKeypadProduct && (normalizedQuery.includes('keypad') || normalizedQuery.includes('keyboard'))) {
    maxScore += 50;
  }

  const primaryFields = [
    product.name,
    product.slug,
    product.customFields?.iconId,
    ...(product.customFields?.iconCategories ?? []),
    product.variants?.[0]?.customFields?.keypadModelCode as string | undefined,
  ];

  const secondaryFields = [
    product.description
  ];

  const queryTerms = normalizedQuery.split(' ').filter(t => t.length > 0);

  // Helper to check fields
  const checkFields = (fields: (string | null | undefined)[], isPrimary: boolean) => {
    for (const field of fields) {
      if (!field || typeof field !== 'string') continue;
      const normalizedField = normalizeForSearch(field);

      // Exact match
      if (normalizedField === normalizedQuery) {
        maxScore = Math.max(maxScore, isPrimary ? 100 : 50);
        continue;
      }

      // Contains full query
      if (normalizedField.includes(normalizedQuery)) {
        maxScore = Math.max(maxScore, isPrimary ? 80 : 30);
      }

      // Term checks
      for (const term of queryTerms) {
        if (normalizedField.includes(term)) {
          maxScore = Math.max(maxScore, isPrimary ? 60 : 20);
        } else if (isPrimary) {
          // Fuzzy check ONLY for primary fields
          const words = normalizedField.split(' ');
          for (const word of words) {
            if (Math.abs(word.length - term.length) > 2) continue;

            // Stricter fuzzy: 
            // Length <= 3: Exact match only (already handled by includes) or distance 0? No, just skip fuzzy.
            // Length > 3: Distance 1
            // Length > 6: Distance 2

            if (term.length <= 3) continue;

            const dist = levenshtein(word, term);
            const threshold = term.length > 6 ? 2 : 1;

            if (dist <= threshold) {
              maxScore = Math.max(maxScore, 40);
            }
          }
        }
      }
    }
  };

  checkFields(primaryFields, true);
  checkFields(secondaryFields, false);

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
  // Increased threshold to 10 to filter out very weak noise if any
  return scored
    .filter(item => item.score > 20) // Only return reasonably relevant results (e.g. at least a description match or fuzzy name)
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
}
