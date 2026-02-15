import { type NextRequest, NextResponse } from 'next/server';
import { fetchIconProductsPage, searchGlobalProducts } from '../../../lib/vendure.server';
import { assetUrl } from '../../../lib/vendure';



export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';

    // Return empty list if query is too short to avoid massive initial loads
    if (q.trim().length < 2) {
        return NextResponse.json({ items: [] });
    }

    try {
        const products = await searchGlobalProducts(q);
        const topResults = products.slice(0, 8); // Limit for live dropdown

        // Simplify the response for the search dropdown
        const results = topResults.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            iconId: product.customFields?.iconId,
            image: product.featuredAsset ? assetUrl(product.featuredAsset.preview) : null,
            price: product.variants?.[0]?.priceWithTax,
            currency: product.variants?.[0]?.currencyCode,
        }));

        return NextResponse.json({ items: results });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ items: [], error: 'Failed to fetch results' }, { status: 500 });
    }
}
