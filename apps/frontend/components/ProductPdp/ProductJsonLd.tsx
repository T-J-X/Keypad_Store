import type { CatalogProduct } from '../../lib/vendure';
import { resolveSeoDescription } from '../../lib/productSeo';
import { serializeJsonLd } from '../../lib/seo/jsonLd';
import { resolvePublicSiteUrl } from '../../lib/siteUrl';
import { assetUrl } from '../../lib/vendure';

type CatalogVariant = NonNullable<CatalogProduct['variants']>[number];

function hasStock(variant: CatalogVariant | undefined) {
  if (!variant) return false;

  if (typeof variant.stockOnHand === 'number') {
    const allocated = typeof variant.stockAllocated === 'number' ? variant.stockAllocated : 0;
    return variant.stockOnHand - allocated > 0;
  }

  const stockLevel = typeof variant.stockLevel === 'string' ? variant.stockLevel.toUpperCase() : '';
  if (!stockLevel) return false;
  return stockLevel !== 'OUT_OF_STOCK';
}

export default function ProductJsonLd({
  product,
}: {
  product: CatalogProduct;
}) {
  const siteOrigin = resolvePublicSiteUrl();
  const primaryVariant = product.variants?.[0];
  const availability = hasStock(primaryVariant)
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const priceWithTax = typeof primaryVariant?.priceWithTax === 'number'
    ? (primaryVariant.priceWithTax / 100).toFixed(2)
    : null;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: resolveSeoDescription(product),
    brand: {
      '@type': 'Brand',
      name: 'Vehicle Control Technologies',
    },
  };

  const rawCategories = product.customFields?.iconCategories ?? product.customFields?.application;
  const categories = (Array.isArray(rawCategories)
    ? rawCategories
    : typeof rawCategories === 'string'
      ? [rawCategories]
      : []
  )
    .map((value) => value.trim())
    .filter(Boolean);
  if (categories.length > 0) {
    schema.category = categories.join(', ');
  }

  if (primaryVariant?.sku) {
    schema.sku = primaryVariant.sku;
  }

  const featuredImage = product.featuredAsset?.source || product.featuredAsset?.preview;
  if (featuredImage) {
    schema.image = assetUrl(featuredImage);
  }

  if (priceWithTax && primaryVariant?.currencyCode) {
    const productPath = `/shop/product/${encodeURIComponent(product.slug)}`;
    const offerUrl = siteOrigin
      ? `${siteOrigin.replace(/\/+$/, '')}${productPath}`
      : productPath;
    schema.offers = {
      '@type': 'Offer',
      priceCurrency: primaryVariant.currencyCode,
      price: priceWithTax,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      url: offerUrl,
      seller: {
        '@type': 'Organization',
        name: 'Vehicle Control Technologies',
      },
    };
  }

  return (
    <script
      id="product-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}
