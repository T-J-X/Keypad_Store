import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '../../../components/ProductCard';
import BreadcrumbJsonLd from '../../../components/seo/BreadcrumbJsonLd';
import ShopCollectionJsonLd from '../../../components/seo/ShopCollectionJsonLd';
import { buildPageMetadata } from '../../../lib/seo/metadata';
import {
  buildButtonInsertDisciplineClusters,
  filterIconsByDiscipline,
} from '../../../lib/seo/shopTaxonomy';
import type { IconProduct } from '../../../lib/vendure';
import { fetchIconProducts } from '../../../lib/vendure.server';

export const metadata: Metadata = buildPageMetadata({
  title: 'Button Inserts Catalog',
  description:
    'Browse all VCT button insert categories, compare icon classes, and jump into compatible product pages for configuration workflows.',
  canonical: '/shop/button-inserts',
  keywords: [
    'button inserts catalog',
    'keypad icon catalog',
    'button insert classes',
    'control panel icons',
    'custom icon inserts',
    'laser etched button inserts',
  ],
  type: 'article',
});

function buildProductHref(productSlug: string, disciplineSlug: string) {
  const encodedSlug = encodeURIComponent(productSlug);
  const params = new URLSearchParams({
    from: 'shop',
    section: 'button-inserts',
    cats: disciplineSlug,
    cat: disciplineSlug,
  });
  return `/shop/product/${encodedSlug}?${params.toString()}`;
}

function sortIcons(icons: IconProduct[]) {
  return [...icons].sort((a, b) => {
    const aIconId = a.customFields?.iconId?.trim() || '';
    const bIconId = b.customFields?.iconId?.trim() || '';
    if (aIconId && bIconId && aIconId !== bIconId) return aIconId.localeCompare(bIconId);
    return a.name.localeCompare(b.name);
  });
}

export default async function ButtonInsertsHubPage() {
  const icons = await fetchIconProducts();
  const disciplineClusters = buildButtonInsertDisciplineClusters(icons);

  const featured = disciplineClusters
    .slice(0, 12)
    .flatMap((cluster) =>
      sortIcons(filterIconsByDiscipline(icons, cluster.slug)).slice(0, 2).map((icon) => ({
        cluster,
        icon,
      })),
    )
    .slice(0, 24);

  return (
    <div className="mx-auto w-full max-w-[88rem] bg-[linear-gradient(180deg,#f3f8ff_0%,#ffffff_52%)] px-6 pb-20 pt-10">
      <BreadcrumbJsonLd
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: 'Button Inserts', href: '/shop/button-inserts' },
        ]}
      />
      <ShopCollectionJsonLd
        section="button-inserts"
        canonicalPath="/shop/button-inserts"
        icons={icons}
        keypads={[]}
      />

      <section className="rounded-3xl border border-[#d7e3f4] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_66%)] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">Catalog Hub</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              Button Inserts Catalog
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/65">
              Explore every button insert class from one clean indexable hub, then move into class pages for direct intent and product-level comparison.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/45">Categories</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{disciplineClusters.length}</p>
            <p className="mt-1 text-xs text-ink/55">{icons.length} inserts in catalog</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {disciplineClusters.map((cluster) => (
            <Link
              key={cluster.slug}
              href={`/shop/button-inserts/${encodeURIComponent(cluster.slug)}`}
              className="rounded-full border border-ink/12 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-ink/25 hover:text-ink"
            >
              {cluster.label} ({cluster.count})
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {featured.map(({ icon, cluster }) => (
          <ProductCard
            key={icon.id}
            product={icon}
            categoryLabel={cluster.label}
            categoryHref={`/shop/button-inserts/${encodeURIComponent(cluster.slug)}`}
            productHref={buildProductHref(icon.slug, cluster.slug)}
            layout="grid"
          />
        ))}
      </section>
    </div>
  );
}
