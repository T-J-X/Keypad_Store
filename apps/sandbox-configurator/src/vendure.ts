export type VendureAsset = {
  id: string;
  preview?: string;
  source?: string;
  name?: string;
};

export type IconProduct = {
  id: string;
  name: string;
  slug: string;
  featuredAsset?: VendureAsset | null;
  assets: VendureAsset[];
  customFields?: {
    isIconProduct?: boolean;
    iconId?: string;
    iconCategoryPath?: string;
    insertAssetId?: string;
  } | null;
};

const GRAPHQL_ENDPOINT = '/shop-api';

function abs(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Vendure usually returns absolute, but just in case
  return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
}

export function assetUrl(a?: VendureAsset | null, kind: 'source' | 'preview' = 'source') {
  if (!a) return '';
  return abs(kind === 'source' ? a.source : a.preview) || abs(a.preview) || abs(a.source);
}

export async function fetchIconProducts(): Promise<IconProduct[]> {
  // Safer to fetch a page and filter client-side (schema varies by custom field filters)
  const query = `
    query Products($options: ProductListOptions) {
      products(options: $options) {
        items {
          id
          name
          slug
          featuredAsset { id preview source name }
          assets { id preview source name }
          customFields {
            isIconProduct
            iconId
            iconCategoryPath
            insertAssetId
          }
        }
      }
    }
  `;

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { options: { take: 200 } },
    }),
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    const msg = json?.errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const items: IconProduct[] = json.data.products.items;

  return items
    .filter((p) => !!p?.customFields?.isIconProduct)
    .map((p) => ({
      ...p,
      assets: p.assets ?? [],
    }));
}

export function pickInsertAsset(product: IconProduct): VendureAsset | null {
  const insertId = product.customFields?.insertAssetId?.toString().trim();
  const assets = product.assets ?? [];
  const featuredId = product.featuredAsset?.id?.toString();

  // Preferred: explicit insertAssetId
  if (insertId) {
    const match = assets.find((a) => a.id?.toString() === insertId);
    if (match) return match;
  }

  // Fallback: use “the other asset” (non-featured)
  const other = assets.find((a) => a.id?.toString() !== featuredId);
  return other ?? product.featuredAsset ?? null;
}

export function categoryOf(product: IconProduct) {
  const raw = product.customFields?.iconCategoryPath ?? 'Uncategorised';
  // If you use "Render/Controls", show "Controls"
  const parts = raw.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? raw;
}
