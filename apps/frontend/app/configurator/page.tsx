import type { Metadata } from 'next';
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
    <div className="mx-auto w-full max-w-6xl bg-[linear-gradient(180deg,#f3f8ff_0%,#ffffff_58%)] px-4 pb-10 pt-8 sm:px-6">
        <div className="mb-8 overflow-hidden rounded-[1.6rem] border border-white/12 bg-[radial-gradient(130%_120%_at_10%_0%,rgba(56,189,248,0.22)_0%,rgba(56,189,248,0.02)_42%,rgba(2,6,23,0.95)_75%),linear-gradient(160deg,#07122a_0%,#040b1f_56%,#020617_100%)] px-6 py-8 text-white">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-100/90">
            Configurator
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Choose your keypad model.
            <span className="block bg-gradient-to-r from-sky-300 via-blue-300 to-blue-500 bg-clip-text text-transparent">
              Build from the first press.
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-blue-100/75 sm:text-base">
            Select a base keypad to start building. In the next step you can place icons, adjust layouts, and save variations with full production intent.
          </p>
        </div>

        <Suspense fallback={<KeypadGridFallback />}>
          <KeypadGrid />
        </Suspense>
    </div>
  );
}
