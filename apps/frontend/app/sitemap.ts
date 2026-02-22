import type { MetadataRoute } from 'next';
import {
  buildButtonInsertDisciplineClusters,
  buildKeypadProtocolClusters,
} from '../lib/seo/shopTaxonomy';
import { listCompetitorAlternatives } from '../lib/seo/competitorAlternatives';
import { fetchIconProducts, fetchKeypadProducts } from '../lib/vendure.server';
import { resolvePublicSiteUrl } from '../lib/siteUrl';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolvePublicSiteUrl();
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/shop/button-inserts`, lastModified: now, changeFrequency: 'weekly', priority: 0.82 },
    { url: `${base}/shop/keypads`, lastModified: now, changeFrequency: 'weekly', priority: 0.82 },
    { url: `${base}/configurator`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/careers`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/docs`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/guides/alternatives`, lastModified: now, changeFrequency: 'weekly', priority: 0.65 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const competitorAlternativeEntries: MetadataRoute.Sitemap = listCompetitorAlternatives({
    includeLegacy: true,
  }).map((entry) => ({
    url: `${base}/guides/alternatives/${encodeURIComponent(entry.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: entry.legacyPage ? 0.7 : 0.69,
  }));

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
    url: `${base}/shop/product/${encodeURIComponent(slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const disciplineEntries: MetadataRoute.Sitemap = buildButtonInsertDisciplineClusters(icons).map((cluster) => ({
    url: `${base}/shop/button-inserts/${encodeURIComponent(cluster.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.72,
  }));

  const protocolEntries: MetadataRoute.Sitemap = buildKeypadProtocolClusters(keypads).map((cluster) => ({
    url: `${base}/shop/keypads/${encodeURIComponent(cluster.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.72,
  }));

  return [
    ...staticEntries,
    ...competitorAlternativeEntries,
    ...disciplineEntries,
    ...protocolEntries,
    ...productEntries,
  ];
}
