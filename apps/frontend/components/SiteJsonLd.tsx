import Script from 'next/script';
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
        name: 'Vehicle Control Technologies',
        url: base,
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base,
        name: 'Vehicle Control Technologies',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${base}/shop?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <Script id="site-json-ld" type="application/ld+json" strategy="lazyOnload">
      {serializeJsonLd(payload)}
    </Script>
  );
}
