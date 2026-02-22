import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import KeypadCard from '../../../../components/KeypadCard';
import BreadcrumbJsonLd from '../../../../components/seo/BreadcrumbJsonLd';
import ShopCollectionJsonLd from '../../../../components/seo/ShopCollectionJsonLd';
import { buildPageMetadata } from '../../../../lib/seo/metadata';
import {
  buildKeypadProtocolClusters,
  filterKeypadsByProtocol,
  protocolKeywordsFromSlug,
} from '../../../../lib/seo/shopTaxonomy';
import { categorySlug, type KeypadProduct } from '../../../../lib/vendure';
import { fetchKeypadProducts } from '../../../../lib/vendure.server';

const getKeypadCatalog = cache(async () => {
  const keypads = await fetchKeypadProducts();
  const protocolClusters = buildKeypadProtocolClusters(keypads);
  return { keypads, protocolClusters };
});

function normalizeProtocolParam(value: string) {
  try {
    return categorySlug(decodeURIComponent(value || '').trim());
  } catch {
    return categorySlug(value || '');
  }
}

function buildKeypadProductHref(productSlug: string, protocolSlug: string) {
  const encodedSlug = encodeURIComponent(productSlug);
  const params = new URLSearchParams({
    from: 'shop',
    section: 'keypads',
    protocol: protocolSlug,
  });
  return `/shop/product/${encodedSlug}?${params.toString()}`;
}

function sortKeypads(keypads: KeypadProduct[]) {
  return [...keypads].sort((a, b) => a.name.localeCompare(b.name));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ protocol: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const protocolSlug = normalizeProtocolParam(resolvedParams.protocol);
  const { keypads, protocolClusters } = await getKeypadCatalog();
  const cluster = protocolClusters.find((item) => item.slug === protocolSlug);
  const filtered = filterKeypadsByProtocol(keypads, protocolSlug);

  if (!cluster || filtered.length === 0) {
    return buildPageMetadata({
      title: 'Keypad Protocol Page Not Found',
      description: 'The requested keypad protocol page could not be found.',
      canonical: `/shop/keypads/${encodeURIComponent(protocolSlug || resolvedParams.protocol)}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${cluster.label} Keypads`,
    description: `Compare ${filtered.length} keypad models for ${cluster.label} workflows, compatibility, and deployment requirements.`,
    canonical: `/shop/keypads/${encodeURIComponent(cluster.slug)}`,
    keywords: [
      ...protocolKeywordsFromSlug(cluster.slug),
      `${cluster.label} keypad catalog`,
      `${cluster.label} programmable keypad`,
      `${cluster.label} keypad comparison`,
      'industrial keypad catalog',
      'vehicle control keypad',
    ],
    type: 'article',
  });
}

export default async function KeypadProtocolPage({
  params,
}: {
  params: Promise<{ protocol: string }>;
}) {
  const resolvedParams = await params;
  const protocolSlug = normalizeProtocolParam(resolvedParams.protocol);
  const { keypads, protocolClusters } = await getKeypadCatalog();
  const cluster = protocolClusters.find((item) => item.slug === protocolSlug);
  if (!cluster) return notFound();

  const filteredKeypads = sortKeypads(filterKeypadsByProtocol(keypads, protocolSlug));
  if (filteredKeypads.length === 0) return notFound();

  const relatedClusters = protocolClusters
    .filter((item) => item.slug !== protocolSlug)
    .slice(0, 8);
  const canonicalPath = `/shop/keypads/${encodeURIComponent(cluster.slug)}`;

  return (
    <div className="mx-auto w-full max-w-[88rem] bg-[linear-gradient(180deg,#f3f8ff_0%,#ffffff_48%)] px-6 pb-20 pt-10">
      <BreadcrumbJsonLd
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: 'Keypads', href: '/shop/keypads' },
          { label: cluster.label, href: canonicalPath },
        ]}
      />
      <ShopCollectionJsonLd
        section="keypads"
        canonicalPath={canonicalPath}
        keypads={filteredKeypads}
        icons={[]}
      />

      <section className="rounded-3xl border border-[#d7e3f4] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_66%)] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">Keypad Protocol / Family</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              {cluster.label} Keypads
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/65">
              This protocol page organizes keypad models that align with {cluster.label} requirements so engineering and procurement teams can shortlist the right hardware before detailed configuration.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/45">Models in Scope</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{filteredKeypads.length}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/shop/keypads"
            className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-semibold text-ink/75 transition hover:border-ink/25 hover:text-ink"
          >
            Open full keypad catalog
          </Link>
          <Link
            href="/configurator"
            className="rounded-xl border border-[#0f4ea8]/35 bg-[#dce9fb] px-3 py-2 text-xs font-semibold text-[#0d346f] transition hover:border-[#0f4ea8]/55 hover:bg-[#d2e2f8]"
          >
            Start configuring
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredKeypads.map((keypad) => (
          <KeypadCard
            key={keypad.id}
            product={keypad}
            mode="shop"
            learnMoreHref={buildKeypadProductHref(keypad.slug, cluster.slug)}
          />
        ))}
      </section>

      {relatedClusters.length > 0 ? (
        <section className="mt-10 rounded-3xl border border-[#d7e3f4] bg-white p-5">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Related keypad protocol pages</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedClusters.map((related) => (
              <Link
                key={related.slug}
                href={`/shop/keypads/${encodeURIComponent(related.slug)}`}
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
