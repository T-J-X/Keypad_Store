import Link from 'next/link';

const heroCtaClass =
  'group relative isolate inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-transparent px-5 py-2.5 text-sm font-medium text-white whitespace-nowrap bg-[linear-gradient(90deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#203f7a_0%,#2f5da8_55%,#4b7fca_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box] transition-[background,box-shadow,transform,opacity] duration-300 hover:-translate-y-[1px] hover:bg-[linear-gradient(270deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#24497d_0%,#39629a_55%,#537bb0_100%)] hover:shadow-[0_0_0_1px_rgba(72,116,194,0.56),0_10px_24px_rgba(4,15,46,0.29)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29457A]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]';

const tiles = [
  {
    id: 'button-inserts',
    href: '/shop?section=button-inserts',
    eyebrow: 'Button Inserts',
    title: 'Curated icon libraries for mission-critical controls',
    body: 'Browse category-sorted inserts and find the exact symbol set for your workflow.',
    cta: 'Browse inserts',
    imageClass:
      'bg-[linear-gradient(150deg,#dfe7f5_0%,#f8fbff_38%,#d9e4fb_70%,#d3e6f4_100%)]',
  },
  {
    id: 'keypads',
    href: '/shop?section=keypads',
    eyebrow: 'Keypads',
    title: 'High-reliability keypads engineered for precise control',
    body: 'Compare layouts, hardware formats, and jump directly into configuration.',
    cta: 'View keypads',
    imageClass:
      'bg-[linear-gradient(145deg,#e9efe8_0%,#fbfffa_42%,#dde9e2_72%,#cfe0d5_100%)]',
  },
] as const;

export default function BaseShopHero({ showTiles = true }: { showTiles?: boolean }) {
  return (
    <section className="mb-10 space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[radial-gradient(130%_115%_at_10%_0%,rgba(56,189,248,0.22)_0%,rgba(56,189,248,0.02)_42%,rgba(2,6,23,0.96)_75%),linear-gradient(165deg,#07122a_0%,#040b1f_56%,#020617_100%)] px-6 py-10 text-white shadow-[0_22px_50px_-24px_rgba(4,15,46,0.65)] sm:px-8 sm:py-12">
        <div className="pointer-events-none absolute -left-20 top-1/4 h-48 w-48 rounded-full bg-sky-500/30 blur-[120px]" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-blue-500/20 blur-[130px]" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-100/90">
            Control Interface Catalog
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            The Home of High-Performance Control.
            <span className="block bg-gradient-to-r from-sky-300 via-blue-300 to-blue-500 bg-clip-text text-transparent">
              Shop. Configure. Ship.
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-blue-100/75 sm:text-base">
            Browse keypad hardware and insert systems with the same motion language and precision focus as the homepage experience.
          </p>
        </div>
      </div>

      <div
        aria-hidden={!showTiles}
        className={`transition-[max-height,opacity,transform,margin] duration-500 ease-out motion-reduce:transition-none ${
          showTiles
            ? 'mt-6 max-h-[56rem] translate-y-0 opacity-100'
            : 'mt-0 max-h-0 -translate-y-2 overflow-hidden opacity-0 pointer-events-none'
        }`}
      >
        <div className="grid gap-5 md:grid-cols-2">
          {tiles.map((tile) => (
            <Link
              key={tile.id}
              href={tile.href}
              className="group relative overflow-hidden rounded-2xl border border-white/12 shadow-[0_16px_40px_rgba(4,15,46,0.26)]"
            >
              <div className={`relative h-72 w-full ${tile.imageClass}`}>
                <div className="pointer-events-none absolute -right-20 -top-16 h-48 w-48 rounded-full bg-white/65 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-20 left-6 h-44 w-44 rounded-full bg-slate-900/10 blur-2xl" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,11,22,0.05)_0%,rgba(5,11,22,0.12)_58%,rgba(5,11,22,0.72)_100%)] opacity-65 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="mb-2 inline-flex rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink/70">
                    {tile.eyebrow}
                  </div>
                  <p className="text-lg font-semibold leading-tight text-white">{tile.title}</p>
                  <p className="mt-2 max-w-md text-sm text-white/80">{tile.body}</p>

                  <span
                    className={`${heroCtaClass} mt-4`}
                  >
                    {tile.cta}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
