export type VendureAsset = {
  id: string;
  preview?: string;
  source?: string;
  name?: string;
};

export type VendureProductVariant = {
  id: string;
  priceWithTax?: number | null;
  currencyCode?: string | null;
};

export type ProductCustomFields = {
  isIconProduct?: boolean;
  iconId?: string;
  iconCategories?: string[];
  insertAssetId?: string;
  isKeypadProduct?: boolean;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  featuredAsset?: VendureAsset | null;
  assets?: VendureAsset[];
  variants?: VendureProductVariant[];
  customFields?: ProductCustomFields | null;
};

export type IconProduct = CatalogProduct;
export type KeypadProduct = CatalogProduct;

export type IconCategory = {
  name: string;
  slug: string;
  count: number;
};

export function normalizeCategoryName(input?: string | null) {
  const value = (input ?? '').trim();
  return value || 'Uncategorised';
}

export function categorySlug(input?: string | null) {
  return normalizeCategoryName(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'uncategorised';
}

export function iconCategoriesFromProduct(product: { customFields?: ProductCustomFields | null }) {
  const categories = product.customFields?.iconCategories ?? [];
  const bySlug = new Map<string, string>();
  for (const item of categories) {
    const name = normalizeCategoryName(item);
    bySlug.set(categorySlug(name), name);
  }
  if (bySlug.size === 0) {
    bySlug.set('uncategorised', 'Uncategorised');
  }
  return Array.from(bySlug.values()).sort((a, b) => a.localeCompare(b));
}

export function assetUrl(input?: string | null) {
  if (!input) return '';
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  const host = process.env.NEXT_PUBLIC_VENDURE_HOST || 'http://localhost:3000';
  return `${host}${input.startsWith('/') ? '' : '/'}${input}`;
}

export function assetFromProduct(product: { featuredAsset?: VendureAsset | null }) {
  return product.featuredAsset ?? null;
}
