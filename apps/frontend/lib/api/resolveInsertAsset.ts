/** Shared asset-resolution helpers used by export-pdf and icon-catalog routes. */

type ProductAssetLike = {
    id?: string | null;
    source?: string | null;
    preview?: string | null;
    name?: string | null;
};

/**
 * Given a list of product assets, a featured-asset ID, and an optional
 * explicit `insertAssetId`, return the best-matching "insert / matte" asset.
 *
 * Resolution order:
 *  1. Exact match on `insertAssetId`
 *  2. Non-featured asset whose name/source hints at "insert", "matte", or "overlay"
 *  3. First non-featured asset
 *  4. `null`
 */
export function resolveInsertAsset(
    assets: ProductAssetLike[],
    featuredAssetId: string | null,
    insertAssetId: string,
): ProductAssetLike | null {
    if (insertAssetId) {
        const exact = assets.find(
            (asset) => String(asset.id ?? '').trim() === insertAssetId,
        );
        if (exact) return exact;
    }

    const nonFeatured = assets.filter(
        (asset) =>
            String(asset.id ?? '').trim() !== String(featuredAssetId ?? '').trim(),
    );

    const hinted = nonFeatured.find((asset) => {
        const text = `${asset.name ?? ''} ${asset.source ?? ''}`.toLowerCase();
        return (
            text.includes('insert') ||
            text.includes('matte') ||
            text.includes('overlay')
        );
    });

    if (hinted) return hinted;
    return nonFeatured[0] ?? null;
}
