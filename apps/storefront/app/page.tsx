import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '../components/ui/Button';

export const metadata: Metadata = {
  title: 'Keypad Store | Configure Technical Keypads',
  description: 'Choose a keypad model, map icon inserts, and export production-ready keypad configurations.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-16">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="pill">Premium keypad systems</div>
          <h1 className="text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            Build a keypad that feels custom from the first press.
          </h1>
          <p className="max-w-xl text-base text-ink/70">
            Choose a keypad model, layer curated icon packs, and save configurations that match your workflow. Every icon
            is built for clarity, contrast, and tactile rhythm.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="premium">
              <Link href="/shop">Shop icons</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/configurator">Start configuring</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-wide text-ink/45">
            <span>212+ icons</span>
            <span>5 keypad sizes</span>
            <span>Made to ship</span>
          </div>
        </div>
        <div className="card relative overflow-hidden p-6">
          <div className="absolute -right-8 top-8 h-40 w-40 rounded-full bg-sky/20 blur-2xl" aria-hidden />
          <div className="absolute bottom-4 left-6 h-36 w-36 rounded-full bg-coral/20 blur-2xl" aria-hidden />
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">Live drop</div>
            <div className="text-2xl font-semibold text-ink">Icon Systems - HVAC + Media</div>
            <p className="text-sm text-ink/60">
              Layer your icons across compact or extended keypads. Save multiple layouts and ship instantly to your team.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {['HVAC', 'Media', 'Security', 'Controls'].map((label) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm font-semibold text-ink"
                >
                  <span>{label}</span>
                  <span className="text-xs text-ink/40">Pack</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        {[
          {
            title: 'Curated icon sets',
            body: 'Every icon is optimized for legibility on glossy render and matte insert layers.'
          },
          {
            title: 'Save configurations',
            body: 'Store layouts per team, per room, or per client to deploy instantly.'
          },
          {
            title: 'Production ready',
            body: 'End-to-end pipeline from configuration to order-ready packaging.'
          }
        ].map((card) => (
          <div key={card.title} className="card p-6">
            <div className="text-lg font-semibold text-ink">{card.title}</div>
            <p className="mt-3 text-sm text-ink/60">{card.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">Start here</div>
            <h2 className="mt-2 text-3xl font-semibold text-ink">Pick your path</h2>
          </div>
          <Button asChild variant="premium">
            <Link href="/shop">Browse the catalog</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">Shop icons</div>
            <h3 className="mt-3 text-2xl font-semibold text-ink">Organized icon catalog</h3>
            <p className="mt-2 text-sm text-ink/60">
              Search by category, filter by workflow, and build icon packs that map to your use case.
            </p>
            <Link href="/shop" className="mt-4 inline-flex text-sm font-semibold text-sky-600 hover:underline">Explore icons -&gt;</Link>
          </div>
          <div className="card p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">Configure</div>
            <h3 className="mt-3 text-2xl font-semibold text-ink">Keypad configurator</h3>
            <p className="mt-2 text-sm text-ink/60">
              Select a keypad model and map icon inserts per slot. Save and revisit any layout.
            </p>
            <Link href="/configurator" className="mt-4 inline-flex text-sm font-semibold text-sky-600 hover:underline">
              Start configuring -&gt;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
