import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, CheckCircle2, CircleAlert, Gauge, Network } from 'lucide-react';
import BreadcrumbJsonLd from '../../../../components/seo/BreadcrumbJsonLd';
import MarketingPageShell from '../../../../components/marketing/MarketingPageShell';
import {
  getCompetitorAlternative,
  listCompetitorAlternatives,
  listProgrammaticAlternativeSlugs,
} from '../../../../lib/seo/competitorAlternatives';
import { serializeJsonLd } from '../../../../lib/seo/jsonLd';
import { buildPageMetadata } from '../../../../lib/seo/metadata';

function normalizeSlug(value: string) {
  try {
    return decodeURIComponent(value || '').trim().toLowerCase();
  } catch {
    return (value || '').trim().toLowerCase();
  }
}

export function generateStaticParams() {
  return listProgrammaticAlternativeSlugs().map((competitor) => ({ competitor }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitor: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const competitorSlug = normalizeSlug(resolvedParams.competitor);
  const entry = getCompetitorAlternative(competitorSlug);

  if (!entry) {
    return buildPageMetadata({
      title: 'Competitor Alternatives Guide Not Found',
      description: 'The requested competitor alternatives guide could not be found.',
      canonical: `/guides/alternatives/${encodeURIComponent(competitorSlug || resolvedParams.competitor)}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${entry.competitorName} Alternatives for CAN and J1939 Keypads`,
    description: entry.summary,
    canonical: `/guides/alternatives/${entry.slug}`,
    keywords: [
      entry.primaryQuery,
      ...entry.secondaryKeywords,
      `${entry.competitorName} competitors`,
      `${entry.competitorName} keypad replacement`,
      'industrial keypad alternatives',
      'vehicle control keypad alternatives',
    ],
    type: 'article',
  });
}

export default async function CompetitorAlternativesPage({
  params,
}: {
  params: Promise<{ competitor: string }>;
}) {
  const resolvedParams = await params;
  const competitorSlug = normalizeSlug(resolvedParams.competitor);
  const entry = getCompetitorAlternative(competitorSlug);
  if (!entry) return notFound();

  const relatedPages = listCompetitorAlternatives({ includeLegacy: true })
    .filter((page) => page.slug !== entry.slug)
    .slice(0, 7);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entry.faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <MarketingPageShell
      badge="Alternatives"
      title={`${entry.competitorName} alternatives: scenario guidance for keypad platform selection.`}
      description={entry.summary}
      actions={[
        { label: 'Compare keypad options', href: '/shop/keypads' },
        { label: 'Build a reference configuration', href: '/configurator', variant: 'secondary' },
      ]}
      stats={[
        { label: 'Primary Query', value: entry.primaryQuery },
        { label: 'Intent Type', value: 'Commercial + evaluative' },
        { label: 'Compared Vendors', value: `${entry.alternatives.length + 1}` },
        { label: 'Review Window', value: 'Quarterly updates' },
      ]}
      lastUpdated="February 22, 2026"
    >
      <BreadcrumbJsonLd
        items={[
          { label: 'Guides', href: '/guides' },
          { label: 'Alternatives', href: '/guides/alternatives' },
          { label: `${entry.competitorName} alternatives`, href: `/guides/alternatives/${entry.slug}` },
        ]}
      />
      <script
        id={`faq-json-ld-${entry.slug}-alternatives`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#061a3b]/75 p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f6297]/55 bg-[#0b2148]/80 text-[#98d8ff]">
            <Network className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.13em] text-blue-100/55">Best when switching</p>
          <p className="mt-2 text-sm leading-relaxed text-blue-100/80">{entry.switchWhen}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#061a3b]/75 p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f6297]/55 bg-[#0b2148]/80 text-[#98d8ff]">
            <CircleAlert className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.13em] text-blue-100/55">Watch for</p>
          <p className="mt-2 text-sm leading-relaxed text-blue-100/80">{entry.watchFor}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#061a3b]/75 p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f6297]/55 bg-[#0b2148]/80 text-[#98d8ff]">
            <Gauge className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.13em] text-blue-100/55">Core decision axis</p>
          <p className="mt-2 text-sm leading-relaxed text-blue-100/80">{entry.decisionAxis}</p>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-white">Scenario-first recommendations</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {entry.scenarioGuidance.map((item) => (
            <article key={item.scenario} className="rounded-2xl border border-white/10 bg-[#071938]/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">Scenario</p>
              <h3 className="mt-2 text-sm font-semibold text-white">{item.scenario}</h3>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.11em] text-[#9dd7ff]">Recommendation</p>
              <p className="mt-1 text-sm text-blue-100/80">{item.recommendation}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">Why</p>
              <p className="mt-1 text-sm text-blue-100/75">{item.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-white">Shortlisted alternatives to evaluate</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-blue-100/75">
          This shortlist uses publicly documented protocol and product positioning as a starting point, then overlays scenario guidance for deployment decisions.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {entry.alternatives.map((item) => (
            <article key={item.slug} className="rounded-2xl border border-white/10 bg-[#071938]/70 p-4">
              <h3 className="text-lg font-semibold tracking-tight text-white">{item.name}</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">Protocols / ecosystem</dt>
                  <dd className="mt-1 text-blue-100/80">{item.protocols}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">Ruggedization signal</dt>
                  <dd className="mt-1 text-blue-100/80">{item.ruggedization}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">Strongest fit</dt>
                  <dd className="mt-1 text-blue-100/80">{item.strongestFit}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">Tradeoffs to validate</dt>
                  <dd className="mt-1 text-blue-100/80">{item.tradeoffs}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-white">Decision matrix: {entry.competitorName} vs alternatives</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm text-blue-100/80">
            <thead className="bg-[#071938]/85 text-xs uppercase tracking-[0.12em] text-blue-100/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Criteria</th>
                <th className="px-4 py-3 font-semibold">{entry.competitorName} baseline</th>
                <th className="px-4 py-3 font-semibold">Alternative signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {entry.matrixRows.map((row) => (
                <tr key={row.criteria} className="bg-[#061a3b]/55">
                  <td className="px-4 py-3 font-semibold text-white">{row.criteria}</td>
                  <td className="px-4 py-3">{row.competitorBaseline}</td>
                  <td className="px-4 py-3">{row.betterWhen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-white">Procurement checklist before switching</h2>
        <ul className="mt-4 space-y-3">
          {entry.checklist.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#071938]/70 p-4 text-sm text-blue-100/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#9edcff]" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-white">FAQ</h2>
        <div className="mt-4 space-y-3">
          {entry.faqItems.map((item) => (
            <article key={item.question} className="rounded-xl border border-white/10 bg-[#071938]/70 p-4">
              <h3 className="text-sm font-semibold text-white">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-blue-100/80">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      {relatedPages.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
          <h2 className="text-xl font-semibold tracking-tight text-white">Related alternatives guides</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedPages.map((page) => (
              <Link
                key={page.slug}
                href={`/guides/alternatives/${encodeURIComponent(page.slug)}`}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-100/80 transition-colors hover:border-white/30 hover:text-white"
              >
                {page.competitorName}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-white">Sources used in this comparison</h2>
        <p className="mt-2 text-sm text-blue-100/75">
          Public manufacturer or official product pages accessed on February 22, 2026. Validate final specifications with vendors before procurement sign-off.
        </p>
        <ul className="mt-4 space-y-2">
          {entry.references.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#9edbff] transition-colors hover:text-white"
              >
                {source.label}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#071938]/70 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-white">Next step</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-blue-100/75">
          Compare shortlisted suppliers against the same protocol map, environmental constraints, and operator workflow before deciding. Use one shared validation sheet so the decision is based on deployment reality.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/shop/keypads"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#3c6cb1]/70 bg-[#0b2653]/80 px-4 py-2 text-sm font-semibold text-[#b6e5ff] transition-colors hover:bg-[#11306a]"
          >
            Browse keypad catalog
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/configurator"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-blue-100/80 transition-colors hover:border-white/25 hover:text-white"
          >
            Open configurator
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingPageShell>
  );
}
