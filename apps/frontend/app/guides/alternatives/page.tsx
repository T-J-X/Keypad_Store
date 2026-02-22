import type { Metadata } from 'next';
import { ArrowUpRight, Compass, Sailboat, Settings2 } from 'lucide-react';
import Link from 'next/link';
import MarketingPageShell from '../../../components/marketing/MarketingPageShell';
import { buildPageMetadata } from '../../../lib/seo/metadata';
import { listCompetitorAlternatives } from '../../../lib/seo/competitorAlternatives';

export const metadata: Metadata = buildPageMetadata({
  title: 'Keypad Alternatives Guides',
  description:
    'Compare keypad and HMI platform alternatives with scenario-based guidance for marine and vehicle control teams.',
  canonical: '/guides/alternatives',
  keywords: [
    'keypad alternatives',
    'marine keypad alternatives',
    'j1939 keypad alternatives',
    'digital switching alternatives',
  ],
  type: 'article',
});

const alternatives = [
  ...listCompetitorAlternatives({ includeLegacy: true }).map((entry) => ({
    href: `/guides/alternatives/${entry.slug}`,
    title: `${entry.competitorName} alternatives`,
    subtitle: entry.primaryQuery,
    summary: entry.summary,
    icon: Sailboat,
    tags: [
      'Protocol + ruggedization fit',
      'Commercial intent',
      entry.legacyPage ? 'Featured page' : 'Programmatic page',
    ],
  })),
];

export default function AlternativesGuidesPage() {
  return (
    <MarketingPageShell
      badge="Alternatives"
      title="Platform alternatives for teams buying control keypads at production scale."
      description="These pages are structured for buyers and engineers comparing vendors under real constraints: protocol support, environmental protection, lead-time risk, and deployment complexity."
      actions={[
        { label: 'Browse keypads', href: '/shop/keypads' },
        { label: 'Open configurator', href: '/configurator', variant: 'secondary' },
      ]}
      stats={[
        { label: 'Comparison Scope', value: 'Protocol + durability + workflow' },
        { label: 'Audience', value: 'Engineering + procurement' },
        { label: 'Primary Intent', value: 'Commercial evaluation' },
        { label: 'Published Pages', value: String(alternatives.length) },
      ]}
      lastUpdated="February 22, 2026"
    >
      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Published alternatives pages
          </h2>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2f5d93]/55 bg-[#0a2149]/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9dd7ff]">
            <Compass className="h-3.5 w-3.5" />
            Opportunity-led
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-1">
          {alternatives.map((item) => (
            <article
              key={item.href}
              className="group rounded-2xl border border-white/10 bg-[#061a3b]/75 p-5 transition-colors duration-300 hover:border-white/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f6297]/55 bg-[#0b2148]/80 text-[#98d8ff]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-blue-100/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">{item.title}</h3>
              <p className="mt-1 text-sm text-blue-100/70">{item.subtitle}</p>
              <p className="mt-3 text-sm leading-relaxed text-blue-100/75">{item.summary}</p>
              <Link
                href={item.href}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#9edbff] transition-colors hover:text-white"
              >
                Open guide
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-lg font-semibold tracking-tight text-white">What each alternatives page includes</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-[#071938]/70 p-4">
            <Settings2 className="h-4 w-4 text-[#9edcff]" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">
              Decision matrix
            </p>
            <p className="mt-1 text-sm text-blue-100/75">Scenario-specific recommendations, not generic ratings.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#071938]/70 p-4">
            <Settings2 className="h-4 w-4 text-[#9edcff]" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">
              Protocol fit
            </p>
            <p className="mt-1 text-sm text-blue-100/75">CANopen, J1939, and ecosystem constraints by deployment type.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#071938]/70 p-4">
            <Settings2 className="h-4 w-4 text-[#9edcff]" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">
              Environmental fit
            </p>
            <p className="mt-1 text-sm text-blue-100/75">Ingress and ruggedization requirements for field reliability.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#071938]/70 p-4">
            <Settings2 className="h-4 w-4 text-[#9edcff]" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">
              Next-step CTA
            </p>
            <p className="mt-1 text-sm text-blue-100/75">Bridge from research intent into configuration and purchase flow.</p>
          </div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
