import type { MetadataRoute } from 'next';
import { fetchIconProducts, fetchKeypadProducts } from '../lib/vendure.server';
import { resolvePublicSiteUrl } from '../lib/siteUrl';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolvePublicSiteUrl();
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/configurator`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const [icons, keypads] = await Promise.all([
    fetchIconProducts().catch(() => []),
    fetchKeypadProducts().catch(() => []),
  ]);
  const uniqueProductSlugs = new Set<string>();
  for (const product of [...icons, ...keypads]) {
    const slug = product.slug?.trim();
    if (slug) uniqueProductSlugs.add(slug);
  }

  const productEntries: MetadataRoute.Sitemap = Array.from(uniqueProductSlugs).map((slug) => ({
    url: `${base}/product/${encodeURIComponent(slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticEntries, ...productEntries];
}
