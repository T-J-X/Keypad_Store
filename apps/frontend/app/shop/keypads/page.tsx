import type { Metadata } from 'next';
import Link from 'next/link';
import KeypadCard from '../../../components/KeypadCard';
import BreadcrumbJsonLd from '../../../components/seo/BreadcrumbJsonLd';
import ShopCollectionJsonLd from '../../../components/seo/ShopCollectionJsonLd';
import { buildPageMetadata } from '../../../lib/seo/metadata';
import { buildKeypadProtocolClusters } from '../../../lib/seo/shopTaxonomy';
import type { KeypadProduct } from '../../../lib/vendure';
import { fetchKeypadProducts } from '../../../lib/vendure.server';

export const metadata: Metadata = buildPageMetadata({
  title: 'Keypads Catalog',
  description:
    'Browse VCT keypad models in one clean catalog hub and jump into protocol pages for targeted CAN, J1939, CANopen, and ruggedized selection.',
  canonical: '/shop/keypads',
  keywords: [
    'keypads catalog',
    'programmable keypads',
    'can keypad catalog',
    'j1939 keypad catalog',
    'canopen keypads',
    'vehicle control keypads',
  ],
  type: 'article',
});

function sortKeypads(keypads: KeypadProduct[]) {
  return [...keypads].sort((a, b) => a.name.localeCompare(b.name));
}

function buildKeypadProductHref(productSlug: string) {
  const encodedSlug = encodeURIComponent(productSlug);
  const params = new URLSearchParams({
    from: 'shop',
    section: 'keypads',
  });
  return `/shop/product/${encodedSlug}?${params.toString()}`;
}

export default async function KeypadsHubPage() {
  const keypads = sortKeypads(await fetchKeypadProducts());
  const protocolClusters = buildKeypadProtocolClusters(keypads);

  return (
    <div className="mx-auto w-full max-w-[88rem] bg-[linear-gradient(180deg,#f3f8ff_0%,#ffffff_52%)] px-6 pb-20 pt-10">
      <BreadcrumbJsonLd
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: 'Keypads', href: '/shop/keypads' },
        ]}
      />
      <ShopCollectionJsonLd
        section="keypads"
        canonicalPath="/shop/keypads"
        keypads={keypads}
        icons={[]}
      />

      <section className="rounded-3xl border border-[#d7e3f4] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_66%)] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/55">Catalog Hub</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Keypads Catalog</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/65">
              Use this clean hub URL to compare all keypad models, then drill into protocol pages to shortlist hardware by deployment constraints.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/45">Models</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{keypads.length}</p>
            <p className="mt-1 text-xs text-ink/55">{protocolClusters.length} protocol clusters</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {protocolClusters.map((cluster) => (
            <Link
              key={cluster.slug}
              href={`/shop/keypads/${encodeURIComponent(cluster.slug)}`}
              className="rounded-full border border-ink/12 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-ink/25 hover:text-ink"
            >
              {cluster.label} ({cluster.count})
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {keypads.map((keypad) => (
          <KeypadCard
            key={keypad.id}
            product={keypad}
            mode="shop"
            learnMoreHref={buildKeypadProductHref(keypad.slug)}
          />
        ))}
      </section>
    </div>
  );
}
