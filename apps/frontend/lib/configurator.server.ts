import { vendureFetch } from './vendure.server';
import { normalizeCategoryName, assetUrl } from './vendure';
import { resolveInsertAsset } from './api/resolveInsertAsset';
import type { IconCatalogItem } from './configuratorCatalog';

type ProductAsset = {
    id?: string | null;
    preview?: string | null;
    source?: string | null;
    name?: string | null;
};

type ProductVariantNode = {
    id: string;
    name?: string | null;
    sku?: string | null;
    customFields?: {
        iconId?: string | null;
        insertAssetId?: string | null;
        sizeMm?: number | null;
    } | null;
};

type IconProductNode = {
    id: string;
    name: string;
    featuredAsset?: ProductAsset | null;
    assets?: ProductAsset[] | null;
    customFields?: {
        iconId?: string | null;
        iconCategories?: string[] | null;
        insertAssetId?: string | null;
        size?: string | null;
    } | null;
    variants?: ProductVariantNode[] | null;
};

type IconListResponse = {
    products: {
        totalItems: number;
        items: IconProductNode[];
    };
};

const ICON_ID_PATTERN = /^[A-Za-z0-9]+$/;
const PAGE_SIZE = 100;

const ICON_CATALOG_QUERY = `
  query ConfiguratorIconCatalog($options: ProductListOptions) {
    products(options: $options) {
      totalItems
      items {
        id
        name
        featuredAsset {
          id
          preview
          source
          name
        }
        assets {
          id
          preview
          source
          name
        }
        customFields {
          iconId
          iconCategories
          insertAssetId
          size
        }
        variants {
          id
          name
          sku
          customFields {
            iconId
            insertAssetId
            sizeMm
          }
        }
      }
    }
  }
`;

function parseSizeMm(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.round(value);
    }

    if (typeof value !== 'string') return null;
    const match = value.match(/(\d{1,3}(?:\.\d+)?)\s*mm/i);
    if (!match) return null;

    const parsed = Number.parseFloat(match[1] ?? '');
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.round(parsed);
}

function resolveAssetPath(asset: ProductAsset | null | undefined): string | null {
    if (!asset) return null;
    return asset.source ?? asset.preview ?? null;
}

function resolveInsertAssetForVariant(product: IconProductNode, variant: ProductVariantNode): ProductAsset | null {
    const assets = product.assets ?? [];
    const insertAssetId =
        variant.customFields?.insertAssetId?.trim()
        || product.customFields?.insertAssetId?.trim()
        || '';
    const featuredId = String(product.featuredAsset?.id ?? '').trim();

    return resolveInsertAsset(assets, featuredId, insertAssetId) as ProductAsset | null;
}

function resolveIconId(product: IconProductNode, variant: ProductVariantNode): string | null {
    const raw = variant.customFields?.iconId ?? product.customFields?.iconId ?? '';
    if (typeof raw !== 'string') return null;
    const iconId = raw.trim();
    if (!iconId || !ICON_ID_PATTERN.test(iconId)) return null;
    return iconId;
}

function resolveCategories(product: IconProductNode): string[] {
    const categories = Array.isArray(product.customFields?.iconCategories)
        ? product.customFields?.iconCategories
        : [];

    if (categories.length === 0) {
        return ['Uncategorised'];
    }

    return categories
        .map((value) => normalizeCategoryName(value))
        .filter(Boolean);
}

function toCatalogItems(products: IconProductNode[]): IconCatalogItem[] {
    const items: IconCatalogItem[] = [];

    for (const product of products) {
        const variants = product.variants ?? [];
        const categories = resolveCategories(product);
        const glossyAssetPath = resolveAssetPath(product.featuredAsset);

        for (const variant of variants) {
            const iconId = resolveIconId(product, variant);
            if (!iconId) continue;

            const insertAsset = resolveInsertAssetForVariant(product, variant);
            const matteAssetPath = resolveAssetPath(insertAsset);
            if (!matteAssetPath) continue;

            const sizeMm = parseSizeMm(variant.customFields?.sizeMm) ?? parseSizeMm(product.customFields?.size);

            items.push({
                id: variant.id,
                productId: product.id,
                variantId: variant.id,
                iconId,
                name: product.name,
                sku: variant.sku?.trim() || null,
                categories,
                sizeMm,
                glossyAssetPath,
                matteAssetPath,
            });
        }
    }

    return items.sort((a, b) => a.iconId.localeCompare(b.iconId));
}

export async function fetchIconCatalog(): Promise<IconCatalogItem[]> {
    let skip = 0;
    const products: IconProductNode[] = [];

    while (true) {
        const data = await vendureFetch<IconListResponse>(ICON_CATALOG_QUERY, {
            options: {
                take: PAGE_SIZE,
                skip,
                filter: {
                    isIconProduct: { eq: true },
                },
            },
        });

        const pageItems = data.products.items ?? [];
        products.push(...pageItems);

        const nextSkip = skip + pageItems.length;
        if (pageItems.length === 0 || nextSkip >= data.products.totalItems) {
            break;
        }

        skip = nextSkip;
    }

    return toCatalogItems(products);
}
