import { serializeJsonLd } from '../lib/seo/jsonLd';
import { resolvePublicSiteUrl } from '../lib/siteUrl';

export default function SiteJsonLd() {
  const base = resolvePublicSiteUrl();

  const payload = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: 'Keypad Store',
        url: base,
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base,
        name: 'Keypad Store',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${base}/shop?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(payload),
      }}
    />
  );
}
