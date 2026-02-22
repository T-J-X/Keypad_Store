import Link from 'next/link';
import { ArrowRight, Gauge, Zap } from 'lucide-react';
import type { StitchHeroSpec } from '../../data/stitchMockData';

export interface StitchHeroProps {
  readonly badgeLabel: string;
  readonly headlineStart: string;
  readonly headlineAccent: string;
  readonly description: string;
  readonly modelLabel: string;
  readonly modelName: string;
  readonly modelPriceLabel: string;
  readonly heroImageUrl: string;
  readonly heroImageAlt: string;
  readonly heroSpecs: readonly StitchHeroSpec[];
}

function HeroSpecIcon({ id }: { readonly id: StitchHeroSpec['icon'] }) {
  if (id === 'latency') {
    return <Zap className="size-3.5 text-[var(--stitch-primary)]" />;
  }

  return <Gauge className="size-3.5 text-sky-300" />;
}

export default function StitchHero({
  badgeLabel,
  headlineStart,
  headlineAccent,
  description,
  modelLabel,
  modelName,
  modelPriceLabel,
  heroImageUrl,
  heroImageAlt,
  heroSpecs,
}: Readonly<StitchHeroProps>) {
  return (
    <section className="relative overflow-hidden px-4 pb-12 pt-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(77,77,255,0.22)_0%,rgba(2,6,23,0)_68%)]" />
      <div className="mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div className="text-center md:text-left">
          <span
            className="inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--stitch-primary)]"
            style={{ borderColor: 'rgba(77,77,255,0.3)', backgroundColor: 'rgba(77,77,255,0.2)' }}
          >
            {badgeLabel}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {headlineStart}
            <br />
            <span className="italic text-[var(--stitch-primary)] [text-shadow:0_0_10px_rgba(56,189,248,0.45)]">{headlineAccent}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400 md:mx-0">{description}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            {heroSpecs.map((spec) => (
              <div key={spec.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-white backdrop-blur-xl">
                <HeroSpecIcon id={spec.icon} />
                <span>{spec.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[var(--stitch-primary)]/10 blur-[80px]" />
          <img
            src={heroImageUrl}
            alt={heroImageAlt}
            className="mx-auto w-full max-w-[430px] object-contain drop-shadow-[0_20px_50px_rgba(77,77,255,0.3)]"
          />

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{modelLabel}</p>
                <h2 className="mt-1 text-2xl font-bold uppercase italic text-white">{modelName}</h2>
              </div>
              <span className="text-2xl font-bold text-[var(--stitch-primary)]">{modelPriceLabel}</span>
            </div>

            <Link
              href="/checkout"
              prefetch={false}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--stitch-primary)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(77,77,255,0.45)] transition hover:bg-[var(--stitch-primary-strong)]"
            >
              Buy Now
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
