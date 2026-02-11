export type VendureAsset = {
  id: string;
  preview?: string;
  source?: string;
  name?: string;
};

export type VendureProductVariant = {
  id: string;
  name?: string | null;
  sku?: string | null;
  priceWithTax?: number | null;
  currencyCode?: string | null;
  stockLevel?: string | null;
  stockOnHand?: number | null;
  stockAllocated?: number | null;
  customFields?: {
    iconId?: string | null;
    insertAssetId?: string | null;
    sizeMm?: number | null;
    iconType?: string | null;
    keypadModelCode?: string | null;
    slotMapKey?: string | null;
    [key: string]: unknown;
  } | null;
};

export type ProductCustomFields = {
  isIconProduct?: boolean;
  iconId?: string;
  iconCategories?: string[];
  insertAssetId?: string;
  isKeypadProduct?: boolean;
  application?: string[] | string | null;
  colour?: string | null;
  size?: string | null;
  additionalSpecs?: Array<
    | string
    | {
      label?: string | null;
      value?: string | null;
      name?: string | null;
      key?: string | null;
      title?: string | null;
      text?: string | null;
    }
  > | null;
  whatsInTheBox?: string[] | string | null;
  downloads?: Array<
    | VendureAsset
    | {
      id?: string | null;
      name?: string | null;
      source?: string | null;
      preview?: string | null;
      href?: string | null;
      url?: string | null;
      link?: string | null;
      label?: string | null;
      title?: string | null;
    }
    | string
  > | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoNoIndex?: boolean | null;
  seoCanonicalUrl?: string | null;
  seoKeywords?: string | null;
  [key: string]: unknown;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string;
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

export type BaseShopTopTile = {
  id: string;
  label?: string | null;
  subtitle?: string | null;
  href?: string | null;
  hoverStyle?: string | null;
  kind?: string | null;
  isEnabled?: boolean;
  imagePreview?: string | null;
  imageSource?: string | null;
  imageAssetId?: string | null;
};

export type BaseShopDisciplineTile = {
  id: string;
  labelOverride?: string | null;
  order?: number | null;
  isEnabled?: boolean;
  imagePreview?: string | null;
  imageSource?: string | null;
  imageAssetId?: string | null;
};

export type BaseShopPublicConfig = {
  featuredProductSlugs: string[];
  topTiles: BaseShopTopTile[];
  disciplineTiles: BaseShopDisciplineTile[];
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
  const normalized = input.startsWith('/') ? input : `/${input}`;

  // Vendure asset fields can come back as `preview/...` or `source/...` paths.
  // Normalize those to the configured asset route so images always resolve.
  if (normalized.startsWith('/preview/') || normalized.startsWith('/source/')) {
    return `${host}/assets${normalized}`;
  }
  if (normalized.startsWith('/assets/')) {
    return `${host}${normalized}`;
  }

  return `${host}${normalized}`;
}
