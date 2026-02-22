import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import KeypadCard from '../../components/KeypadCard';
import { Skeleton } from '../../components/ui/skeleton';
import { buildPageMetadata } from '../../lib/seo/metadata';
import { fetchKeypadProducts } from '../../lib/vendure.server';

export const metadata: Metadata = buildPageMetadata({
  title: 'Configurator',
  description: 'Choose a keypad model and configure slot-by-slot inserts with engineering-ready precision.',
  canonical: '/configurator',
  keywords: ['keypad configurator', 'custom keypad layout', 'vehicle control keypad builder'],
});

function KeypadGridFallback() {
  return (
    <div className="staggered grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="card-soft h-[360px] rounded-3xl bg-gray-200/80" />
      ))}
    </div>
  );
}

async function KeypadGrid() {
  const keypads = await fetchKeypadProducts();

  if (keypads.length === 0) {
    return <div className="card-soft p-8 text-sm text-ink/60">No keypad models available yet.</div>;
  }

  return (
    <div className="staggered grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
      {keypads.map((keypad) => (
        <KeypadCard key={keypad.id} product={keypad} />
      ))}
    </div>
  );
}

export default function ConfiguratorPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="pill">Configurator</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Choose your keypad model
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ink/60">
            Select a base keypad to start building. You will be able to place icons, adjust layouts, and save variations
            in the next step.
          </p>
        </div>
        <Link href="/shop" className="btn-ghost">Browse icon catalog</Link>
      </div>

      <Suspense fallback={<KeypadGridFallback />}>
        <KeypadGrid />
      </Suspense>
    </div>
  );
}
