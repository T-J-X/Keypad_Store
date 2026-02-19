'use server';

import { searchGlobalProducts } from '../../lib/vendure.server';
import { assetUrl } from '../../lib/vendure';

export type SearchResultItem = {
    id: string;
    name: string;
    slug: string;
    iconId?: string;
    image?: string;
    price?: number;
    currency?: string;
};

export async function searchProductsAction(query: string): Promise<SearchResultItem[]> {
    if (query.trim().length < 2) {
        return [];
    }

    try {
        const products = await searchGlobalProducts(query);
        const topResults = products.slice(0, 8);

        return topResults.map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            iconId: product.customFields?.iconId ?? undefined,
            image: product.featuredAsset ? assetUrl(product.featuredAsset.preview) : undefined,
            price: product.variants?.[0]?.priceWithTax ?? undefined,
            currency: product.variants?.[0]?.currencyCode ?? undefined,
        }));
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}
