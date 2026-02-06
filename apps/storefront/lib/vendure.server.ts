import 'server-only';
import { cache } from 'react';
import type { CatalogProduct, IconProduct, KeypadProduct } from './vendure';

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

const PRODUCT_FIELDS = `
  id
  name
  slug
  featuredAsset { id preview source name }
  assets { id preview source name }
  variants { id priceWithTax currencyCode }
  customFields {
    isIconProduct
    iconId
    iconCategories
    insertAssetId
    isKeypadProduct
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

export type IconPageResult = {
  items: IconProduct[];
  totalItems: number;
};

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

  return products
    .filter((item) => item?.customFields?.isKeypadProduct)
    .map((item) => item as KeypadProduct);
}

export async function fetchProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const query = `
    query ProductBySlug($slug: String!) {
      product(slug: $slug) {
        ${PRODUCT_FIELDS}
      }
    }
  `;

  const data = await vendureFetch<{ product: CatalogProduct | null }>(query, { slug });
  if (!data.product) return null;
  return {
    ...data.product,
    assets: data.product.assets ?? [],
    variants: data.product.variants ?? [],
  };
}
