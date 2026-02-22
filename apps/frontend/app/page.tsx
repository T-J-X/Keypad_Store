import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Layers, Cpu, ArrowRight, Target } from 'lucide-react';
import { fetchKeypadProducts } from '../lib/vendure.server';
import { HeroSlider } from '../components/landing/HeroSlider';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import SparkDivider from '../components/ui/SparkDivider';
import { buildPageMetadata } from '../lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Premium Sim Racing Keypads',
  description: 'Choose a keypad model, map icon inserts, and export production-ready keypad configurations.',
  canonical: '/',
  keywords: ['sim racing keypad', 'custom keypad', 'keypad configurator', 'racing button inserts'],
});

// NEW Server Component to handle the dynamic fetching
async function KeypadSliderSection() {
  const keypads = await fetchKeypadProducts();

  const sliderProducts = keypads.map(k => ({
    id: k.id,
    slug: k.slug || '',
    name: k.name || '',
    description: k.description,
    priceWithTax: k.variants?.[0]?.priceWithTax || 0,
    currencyCode: k.variants?.[0]?.currencyCode || 'USD',
    thumbnail: k.featuredAsset?.preview || ''
  }));

  return <HeroSlider products={sliderProducts} />;
}

export default function HomePage() {
  return (
    <div className="relative isolate -mt-8 min-h-screen w-full overflow-hidden rounded-[2.5rem] bg-[#020617] shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.3)] selection:bg-sky-500/30 selection:text-white">
      {/* Top Curved Glow Separator (Mirroring Footer) */}
      <SparkDivider className="z-50" />

      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[1000px] -translate-x-1/2 opacity-20 motion-safe:animate-float-soft" style={{ animationDuration: '8s' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/40 to-transparent blur-[120px] rounded-full mix-blend-screen" />
      </div>
      <div className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-sky-600/10 blur-[140px] motion-safe:animate-float-soft" style={{ animationDuration: '10s', animationDelay: '220ms' }} />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[130px] motion-safe:animate-float-soft" style={{ animationDuration: '9s', animationDelay: '420ms' }} />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-12 pb-32 lg:pt-16 lg:px-8">

        {/* CENTERED HERO SECTION & SLIDER */}
        <section className="flex flex-col items-center relative z-20">

          {/* Centered Hero Content */}
          <div className="mx-auto flex max-w-4xl animate-fade-up flex-col items-center px-6 text-center lg:px-8">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[5rem] leading-[1.05]">
              Build a keypad that feels<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">custom</span> from the first press.
            </h1>

            <p className="mt-8 max-w-2xl mx-auto text-lg text-white/50 font-sans leading-relaxed">
              Choose a premium keypad model, layer curated icon packs, and save configurations that match your exact workflow. Every piece of hardware is built for precision, clarity, and tactile rhythm.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-12 w-full">
              <Link href="/shop" className="btn-premium group min-w-[190px]">
                <span className="relative z-10 flex items-center gap-2">
                  Shop Hardware
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
              <Link href="/configurator" className="btn-premium min-w-[190px]">
                <span className="relative z-10 flex items-center justify-center">
                  Start configuring
                </span>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-8 pt-12 text-sm font-semibold tracking-wide text-white/40 w-full max-w-lg mx-auto">
              <div className="flex items-center gap-2"><Target className="w-4 h-4 text-sky-500/80" /> 212+ Icons</div>
              <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-sky-500/80" /> 5 Models</div>
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-sky-500/80" /> Built to Ship</div>
            </div>
          </div>

          {/* RADIUS CONTAINER SLIDER PANEL (STORE PRODUCTS) */}
          {/* A large glass pane with a defined radius to hold the slider content below the hero */}
          <div className="relative mt-20 w-full max-w-[1400px] animate-fade-up" style={{ animationDelay: '180ms', animationDuration: '760ms', animationFillMode: 'forwards', opacity: 0 }}>
            {/* Background glow specifically for the slider panel container */}
            <div className="absolute inset-0 bg-sky-500/5 blur-[80px] rounded-[3rem] -z-10" />

            <div className="relative w-full rounded-[2rem] sm:rounded-[3rem] bg-white/[0.02] border border-white/5 p-4 sm:p-8 backdrop-blur-3xl shadow-2xl">

              <div className="flex items-center justify-between mb-8 px-4 sm:px-8">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Keypad Lineup</h2>
                  <p className="text-white/50 text-sm mt-1">Available base units for your configuration.</p>
                </div>
                <div className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
              </div>

              <Suspense fallback={
                <div className="h-[400px] w-full px-4 sm:px-8">
                  <div className="grid h-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-full rounded-2xl bg-white/10" />
                    <Skeleton className="hidden h-full rounded-2xl bg-white/10 sm:block" />
                    <Skeleton className="hidden h-full rounded-2xl bg-white/10 lg:block" />
                  </div>
                </div>
              }>
                <KeypadSliderSection />
              </Suspense>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="relative mt-32 pt-20">
          <SparkDivider />
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-sky-400 uppercase mb-3">Engineered for Racing</h2>
            <p className="text-3xl md:text-4xl font-semibold text-white">Precision components at every layer.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <Layers className="w-6 h-6 text-sky-400" />,
                title: 'Curated Icon Sets',
                body: 'Every single icon is optimized for maximum legibility on both glossy renders and matte physical insert layers.'
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-sky-400" />,
                title: 'Save Configurations',
                body: 'Store layouts locally per team, per room, or per client to deploy instantly without repeating work.'
              },
              {
                icon: <Cpu className="w-6 h-6 text-sky-400" />,
                title: 'Production Ready',
                body: 'An end-to-end pipeline from digital software configuration directly to order-ready hardware packaging.'
              }
            ].map((card, index) => (
              <Card
                key={card.title}
                className="group gap-0 rounded-2xl border-white/5 bg-white/[0.03] py-0 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.06] motion-safe:animate-fade-up"
                style={{ animationDelay: `${220 + index * 90}ms`, animationDuration: '680ms', animationFillMode: 'forwards', opacity: 0 }}
              >
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    {card.icon}
                  </div>
                  <div className="text-xl font-semibold text-white tracking-tight">{card.title}</div>
                  <p className="mt-4 text-sm text-white/50 leading-relaxed font-sans">{card.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CALL TO ACTION PANELS */}
        <section className="mt-32 px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-sky-400">Start Building</div>
              <h2 className="mt-3 text-4xl font-semibold text-white tracking-tight">Pick your path.</h2>
            </div>
            <Button asChild variant="premium">
              <Link href="/shop">Browse the catalog</Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* SHOP PANEL */}
            <Link href="/shop" className="group relative overflow-hidden rounded-3xl p-10 bg-[#0B1221] border border-white/10 transition-all duration-500 hover:border-sky-500/50 hover:shadow-[0_0_40px_-10px_rgba(56,189,248,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center mb-6">
                  <StoreIcon className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-3xl font-semibold text-white tracking-tight">Shop Hardware</h3>
                <p className="mt-4 text-base text-white/60 max-w-md">
                  Search by category, filter by workflow, and build icon packs that perfectly map to your racing simulation use case.
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-sky-400 group-hover:text-sky-300 transition-colors">
                  Explore catalog <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* CONFIGURATOR PANEL */}
            <Link href="/configurator" className="group relative overflow-hidden rounded-3xl p-10 bg-[#0B1221] border border-white/10 transition-all duration-500 hover:border-indigo-500/50 hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6">
                  <SettingsIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-3xl font-semibold text-white tracking-tight">Keypad Configurator</h3>
                <p className="mt-4 text-base text-white/60 max-w-md">
                  Select a premium keypad model and map icon inserts per slot interactively. Save, share, and revisit any layout.
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  Open configurator <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}

// Minimal inline icons for the large CTA panels
function StoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
      <path d="M12 3v6" />
    </svg>
  );
}

function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
