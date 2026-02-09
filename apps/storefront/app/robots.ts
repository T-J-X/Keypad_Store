import type { MetadataRoute } from 'next';
import { resolvePublicSiteUrl } from '../lib/siteUrl';

export default function robots(): MetadataRoute.Robots {
  const base = resolvePublicSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account', '/login', '/signup'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
