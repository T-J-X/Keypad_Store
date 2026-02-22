import { serializeJsonLd } from '../../lib/seo/jsonLd';
import { resolvePublicSiteUrl } from '../../lib/siteUrl';
import { assetUrl, type IconProduct, type KeypadProduct } from '../../lib/vendure';

type ShopSection = 'landing' | 'all' | 'button-inserts' | 'keypads';

function sectionLabel(section: ShopSection) {
  if (section === 'button-inserts') return 'Button Inserts';
  if (section === 'keypads') return 'Keypads';
  if (section === 'all') return 'All Products';
  return 'Shop';
}

function toCategoryLabel(slug: string) {
  return slug
    .trim()
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type ShopCollectionJsonLdProps = {
  section: ShopSection;
  canonicalPath: string;
  query?: string;
  categorySlugs?: string[];
  icons: IconProduct[];
  keypads: KeypadProduct[];
};

export default function ShopCollectionJsonLd({
  section,
  canonicalPath,
  query = '',
  categorySlugs = [],
  icons,
  keypads,
}: ShopCollectionJsonLdProps) {
  const base = resolvePublicSiteUrl().replace(/\/+$/, '');
  const canonicalUrl = canonicalPath.startsWith('http')
    ? canonicalPath
    : `${base}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
  const trimmedQuery = query.trim();
  const categoryLabel =
    categorySlugs.length === 1 ? toCategoryLabel(categorySlugs[0]) : '';

  const listSource =
    section === 'keypads'
      ? keypads
      : section === 'button-inserts'
        ? icons
        : [...keypads, ...icons];

  const itemListElement = listSource
    .filter((product) => Boolean(product.slug))
    .slice(0, 30)
    .map((product, index) => {
      const productUrl = `${base}/shop/product/${encodeURIComponent(product.slug)}`;
      const imageSource = product.featuredAsset?.source || product.featuredAsset?.preview;
      const entry: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        url: productUrl,
        name: product.name,
      };
      if (imageSource) entry.image = assetUrl(imageSource);
      return entry;
    });

  const pageName = trimmedQuery
    ? `Shop search results for ${trimmedQuery}`
    : categoryLabel
      ? `${categoryLabel} ${sectionLabel(section)}`
      : `${sectionLabel(section)} Catalog`;

  const description = trimmedQuery
    ? `Search results for ${trimmedQuery} in the VCT shop catalog.`
    : categoryLabel
      ? `Browse ${categoryLabel} listings in the VCT catalog.`
      : `Browse ${sectionLabel(section).toLowerCase()} in the VCT catalog.`;

  const payload: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageName,
    url: canonicalUrl,
    description,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: itemListElement.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement,
    },
  };

  return (
    <script
      id="shop-collection-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(payload) }}
    />
  );
}
