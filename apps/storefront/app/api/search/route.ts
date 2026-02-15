import { type NextRequest, NextResponse } from 'next/server';
import { fetchIconProductsPage } from '../../../lib/vendure.server';
import { assetUrl } from '../../../lib/vendure';



export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';

    // Return empty list if query is too short to avoid massive initial loads
    if (q.trim().length < 2) {
        return NextResponse.json({ items: [] });
    }

    try {
        const { items } = await fetchIconProductsPage({
            page: 1,
            take: 8, // Limit for live search results
            query: q,
        });

        // Simplify the response for the search dropdown
        const results = items.map(icon => ({
            id: icon.id,
            name: icon.name,
            slug: icon.slug,
            iconId: icon.customFields?.iconId,
            image: icon.featuredAsset ? assetUrl(icon.featuredAsset.preview) : null,
            price: icon.variants?.[0]?.priceWithTax,
            currency: icon.variants?.[0]?.currencyCode,
        }));

        return NextResponse.json({ items: results });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ items: [], error: 'Failed to fetch results' }, { status: 500 });
    }
}
