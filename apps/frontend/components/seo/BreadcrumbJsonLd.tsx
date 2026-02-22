import { serializeJsonLd } from '../../lib/seo/jsonLd';
import { resolvePublicSiteUrl } from '../../lib/siteUrl';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function BreadcrumbJsonLd({
  items,
}: {
  items: BreadcrumbItem[];
}) {
  const base = resolvePublicSiteUrl();
  const list = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    ...(item.href
      ? {
          item: item.href.startsWith('http')
            ? item.href
            : `${base}${item.href.startsWith('/') ? item.href : `/${item.href}`}`,
        }
      : {}),
  }));

  const payload = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list,
  };

  return (
    <script
      id="breadcrumb-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(payload) }}
    />
  );
}
