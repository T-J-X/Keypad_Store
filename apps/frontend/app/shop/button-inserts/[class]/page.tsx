import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import ProductCard from '../../../../components/ProductCard';
import BreadcrumbJsonLd from '../../../../components/seo/BreadcrumbJsonLd';
import ShopCollectionJsonLd from '../../../../components/seo/ShopCollectionJsonLd';
import { buildPageMetadata } from '../../../../lib/seo/metadata';
import {
  buildButtonInsertDisciplineClusters,
  filterIconsByDiscipline,
} from '../../../../lib/seo/shopTaxonomy';
import { categorySlug, type IconProduct } from '../../../../lib/vendure';
import { fetchIconProducts } from '../../../../lib/vendure.server';

const getButtonInsertCatalog = cache(async () => {
  const icons = await fetchIconProducts();
  const disciplineClusters = buildButtonInsertDisciplineClusters(icons);
  return { icons, disciplineClusters };
});

function normalizeClassParam(value: string) {
  try {
    return categorySlug(decodeURIComponent(value || '').trim());
  } catch {
    return categorySlug(value || '');
  }
}

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ class: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const classSlug = normalizeClassParam(resolvedParams.class);
  const { icons, disciplineClusters } = await getButtonInsertCatalog();
  const cluster = disciplineClusters.find((item) => item.slug === classSlug);
  const filtered = filterIconsByDiscipline(icons, classSlug);

  if (!cluster || filtered.length === 0) {
    return buildPageMetadata({
      title: 'Button Insert Class Not Found',
      description: 'The requested button insert class could not be found.',
      canonical: `/shop/button-inserts/${encodeURIComponent(classSlug || resolvedParams.class)}`,
      noIndex: true,
    });
  }

  const title = `Button Inserts for ${cluster.label}`;
  const description = `Browse ${filtered.length} ${cluster.label} button inserts and icon classes for keypad workflows.`;

  return buildPageMetadata({
    title,
    description,
    canonical: `/shop/button-inserts/${encodeURIComponent(cluster.slug)}`,
    keywords: [
      `${cluster.label} button inserts`,
      `${cluster.label} keypad icons`,
      `${cluster.label} control panel icons`,
      `${cluster.label} icon class`,
      `${cluster.label} insert catalog`,
      'button insert classes',
      'keypad icon catalog',
      'custom icon inserts',
    ],
    type: 'article',
  });
}

export default async function ButtonInsertClassPage({
  params,
}: {
  params: Promise<{ class: string }>;
}) {
  const resolvedParams = await params;
  const classSlug = normalizeClassParam(resolvedParams.class);
  const { icons, disciplineClusters } = await getButtonInsertCatalog();
  const cluster = disciplineClusters.find((item) => item.slug === classSlug);
  if (!cluster) return notFound();

  const filteredIcons = sortIcons(filterIconsByDiscipline(icons, classSlug));
  if (filteredIcons.length === 0) return notFound();

  const relatedClusters = disciplineClusters
    .filter((item) => item.slug !== classSlug)
    .slice(0, 8);

  const canonicalPath = `/shop/button-inserts/${encodeURIComponent(cluster.slug)}`;

  return (
    <div className="mx-auto w-full max-w-[88rem] bg-[linear-gradient(180deg,#f3f8ff_0%,#ffffff_48%)] px-6 pb-20 pt-10">
      <BreadcrumbJsonLd
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: 'Button Inserts', href: '/shop/button-inserts' },
          { label: cluster.label, href: canonicalPath },
        ]}
      />
      <ShopCollectionJsonLd
        section="button-inserts"
        canonicalPath={canonicalPath}
        categorySlugs={[cluster.slug]}
        icons={filteredIcons}
        keypads={[]}
      />

      <section className="rounded-3xl border border-[#d7e3f4] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_66%)] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">Button Insert Class</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {cluster.label} Button Inserts
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/65">
              This class page groups {cluster.label.toLowerCase()} insert options into one indexable catalog surface so teams can compare icon variants before entering configuration.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/45">Catalog Count</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{filteredIcons.length}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={canonicalPath}
            className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink"
          >
            Open class catalog
          </Link>
          <Link
            href="/configurator"
            className="rounded-xl border border-[#0f4ea8]/35 bg-[#dce9fb] px-3 py-2 text-xs font-semibold text-[#0d346f] transition hover:border-[#0f4ea8]/55 hover:bg-[#d2e2f8]"
          >
            Start configuring
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredIcons.map((icon) => (
          <ProductCard
            key={icon.id}
            product={icon}
            categoryLabel={cluster.label}
            categoryHref={canonicalPath}
            productHref={buildProductHref(icon.slug, cluster.slug)}
            layout="grid"
          />
        ))}
      </section>

      {relatedClusters.length > 0 ? (
        <section className="mt-10 rounded-3xl border border-[#d7e3f4] bg-white p-5">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Related button insert classes</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedClusters.map((related) => (
              <Link
                key={related.slug}
                href={`/shop/button-inserts/${encodeURIComponent(related.slug)}`}
                className="rounded-full border border-ink/12 bg-surface px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-ink/25 hover:text-ink"
              >
                {related.label} ({related.count})
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
