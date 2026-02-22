import type { Metadata } from 'next';
import { ArrowUpRight, CheckCircle2, CircleAlert, Gauge, Network } from 'lucide-react';
import Link from 'next/link';
import BreadcrumbJsonLd from '../../../../components/seo/BreadcrumbJsonLd';
import MarketingPageShell from '../../../../components/marketing/MarketingPageShell';
import { serializeJsonLd } from '../../../../lib/seo/jsonLd';
import { buildPageMetadata } from '../../../../lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Blink Marine Alternatives for CAN and J1939 Keypads',
  description:
    'Compare Blink Marine alternatives with a scenario-based matrix across HED, Marlin, CZone, Carling, and Grayhill for marine and vehicle control projects.',
  canonical: '/guides/alternatives/blink-marine',
  keywords: [
    'blink marine alternatives',
    'blink marine competitors',
    'marine keypad alternatives',
    'j1939 keypad alternatives',
    'canopen keypad alternatives',
  ],
  type: 'article',
});

const decisionCards = [
  {
    label: 'Best when',
    value: 'You need open CAN protocol flexibility',
    icon: Network,
  },
  {
    label: 'Watch for',
    value: 'Lead-time and toolchain fit by supplier',
    icon: CircleAlert,
  },
  {
    label: 'Core decision axis',
    value: 'Protocol + ingress + configuration workflow',
    icon: Gauge,
  },
];

const scenarioGuidance = [
  {
    scenario: 'Marine retrofit with existing digital switching bus',
    recommendation: 'Evaluate CZone first, then Blink Marine where open protocol control is preferred.',
    reason:
      'CZone keypads sit directly inside a digital switching ecosystem, while Blink is strong when teams want broader CANopen/J1939 flexibility.',
  },
  {
    scenario: 'Heavy equipment/OEM panel standardization',
    recommendation: 'Shortlist HED, Carling, and Grayhill with Blink as the flexibility benchmark.',
    reason:
      'These options emphasize ruggedized keypad hardware and documented J1939/CANopen support for recurring production programs.',
  },
  {
    scenario: 'Customization-heavy icon and legend requirements',
    recommendation: 'Start with Blink Marine and Marlin for workflow fit, then benchmark cost and lifecycle constraints.',
    reason:
      'Blink and Marlin emphasize programmable/custom interfaces and configurable button workflows suited to frequent variation.',
  },
];

const alternatives = [
  {
    name: 'HED',
    protocols: 'J1939 + CANopen keypad families',
    ruggedization: 'IP67 and IP6K9K options on Raptor line',
    strongestFit: 'OEM and upfitter applications that need configurable CAN keypads with broad market availability.',
    tradeoffs: 'Catalog breadth can require tighter filtering to avoid over-spec selection.',
  },
  {
    name: 'Marlin (M-Flex)',
    protocols: 'SAE J1939 and CANopen support',
    ruggedization: 'IP67 and IP69K listed durability',
    strongestFit: 'Custom operator interfaces where programmable behavior and branding are key requirements.',
    tradeoffs: 'Best fit depends on whether your team aligns with Marlin software/programming workflow.',
  },
  {
    name: 'CZone Contact keypads',
    protocols: 'NMEA 2000 ecosystem integration',
    ruggedization: 'Rugged waterproof marine keypad line',
    strongestFit: 'Marine builds already committed to CZone digital switching architecture.',
    tradeoffs: 'Tighter ecosystem coupling may reduce flexibility if you need broader non-CZone integration patterns.',
  },
  {
    name: 'Carling Technologies (CKP)',
    protocols: 'SAE J1939 CAN',
    ruggedization: 'IP6K8 and IP6K9K claims with 1M actuation life',
    strongestFit: 'High-volume industrial and transportation programs prioritizing durability and lifecycle.',
    tradeoffs: 'Customization path should be validated early for icon/workflow needs.',
  },
  {
    name: 'Grayhill (3KG1)',
    protocols: 'J1939 and CANopen listed',
    ruggedization: 'IP67 with up to 1M cycles claim',
    strongestFit: 'Programs balancing protocol support with long-duty-cycle panel operation.',
    tradeoffs: 'Verify model-level options against your exact enclosure and connector constraints.',
  },
];

const matrixRows = [
  {
    criteria: 'Open protocol flexibility',
    blink: 'Strong on CANopen and J1939 positioning',
    betterWhen:
      'Select HED/Carling/Grayhill when procurement needs broader enterprise purchasing channels.',
  },
  {
    criteria: 'Marine ecosystem integration',
    blink: 'Works well when you want open architecture choices',
    betterWhen:
      'Select CZone when your system standard is already centered on CZone and NMEA 2000 workflows.',
  },
  {
    criteria: 'Customization pace',
    blink: 'Removable inserts and configuration tooling are major strengths',
    betterWhen:
      'Select Marlin when a programmable custom UI path maps better to your team workflow.',
  },
  {
    criteria: 'Ruggedized heavy-duty requirements',
    blink: 'Suitable for marine/vehicle controls',
    betterWhen:
      'Select HED, Carling, or Grayhill when you need explicit high-durability spec targeting in procurement docs.',
  },
];

const faqItems = [
  {
    question: 'What is the best Blink Marine alternative for J1939 keypads?',
    answer:
      'For J1939-heavy applications, common shortlists include HED, Carling, and Grayhill. Final choice should be based on ingress requirements, software workflow, and procurement constraints.',
  },
  {
    question: 'Which alternative is closest to Blink Marine for marine digital switching?',
    answer:
      'CZone is often the closest fit when your architecture is already based on CZone digital switching and NMEA 2000 components.',
  },
  {
    question: 'Are these alternatives only for marine systems?',
    answer:
      'No. Several vendors in this shortlist are used across marine, heavy equipment, transportation, and specialty vehicle programs.',
  },
  {
    question: 'How should teams compare Blink Marine competitors?',
    answer:
      'Score each option on protocol fit, ingress/durability, configuration workflow, support model, and deployment lead-time risk. Avoid comparing only unit price.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const references = [
  {
    label: 'Blink Marine product shop (CANopen/J1939 lines)',
    href: 'https://shop.blinkmarine.com/',
  },
  {
    label: 'Blink Marine PKP package details',
    href: 'https://www.blinkmarine.com/products/products-detail/professional-keypad-pkp-2000-series',
  },
  {
    label: 'HED Raptor programmable keypads',
    href: 'https://www.hedonline.com/product/raptor-programmable-keypads/',
  },
  {
    label: 'Marlin M-Flex keypads',
    href: 'https://www.marlintechnologies.com/product/m-flex-keypads/',
  },
  {
    label: 'CZone Contact 6 and Contact 6 PLUS keypads',
    href: 'https://czone.net/contact-6-contact-6-plus',
  },
  {
    label: 'Carling CKP Series',
    href: 'https://www.carlingtech.com/ckp-series',
  },
  {
    label: 'Grayhill 3KG1 programmable keypad',
    href: 'https://grayhill.com/products/controls/human-interface-solutions/canbus-keypads/3kg1-programmable-canbus-keypad-with-j1939-and-canopen-communications/',
  },
];

export default function BlinkMarineAlternativesPage() {
  return (
    <MarketingPageShell
      badge="Alternatives"
      title="Blink Marine alternatives: scenario guidance for CAN and J1939 keypad programs."
      description="This page is built for engineering and procurement teams comparing keypad platforms where protocol support, ruggedization, and deployment workflow all determine total program risk."
      actions={[
        { label: 'Compare keypad options', href: '/shop/keypads' },
        { label: 'Build a reference configuration', href: '/configurator', variant: 'secondary' },
      ]}
      stats={[
        { label: 'Primary Query', value: 'blink marine alternatives' },
        { label: 'Intent Type', value: 'Commercial + evaluative' },
        { label: 'Compared Vendors', value: `${alternatives.length + 1}` },
        { label: 'Review Window', value: 'Quarterly updates' },
      ]}
      lastUpdated="February 22, 2026"
    >
      <BreadcrumbJsonLd
        items={[
          { label: 'Guides', href: '/guides' },
          { label: 'Alternatives', href: '/guides/alternatives' },
          { label: 'Blink Marine alternatives', href: '/guides/alternatives/blink-marine' },
        ]}
      />
      <script
        id="faq-json-ld-blink-marine-alternatives"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {decisionCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-white/10 bg-[#061a3b]/75 p-5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f6297]/55 bg-[#0b2148]/80 text-[#98d8ff]">
              <card.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.13em] text-blue-100/55">{card.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/80">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-white">Scenario-first recommendations</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {scenarioGuidance.map((item) => (
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
        <h2 className="text-xl font-semibold tracking-tight text-white">Verified alternatives to evaluate</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-blue-100/75">
          This shortlist uses publicly documented protocol and durability positioning as a starting point, then adds deployment-fit guidance for commercial selection.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {alternatives.map((item) => (
            <article key={item.name} className="rounded-2xl border border-white/10 bg-[#071938]/70 p-4">
              <h3 className="text-lg font-semibold tracking-tight text-white">{item.name}</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">Protocols</dt>
                  <dd className="mt-1 text-blue-100/80">{item.protocols}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.11em] text-blue-100/55">Ruggedization</dt>
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
        <h2 className="text-xl font-semibold tracking-tight text-white">Selection matrix: Blink Marine vs alternatives</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm text-blue-100/80">
            <thead className="bg-[#071938]/85 text-xs uppercase tracking-[0.12em] text-blue-100/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Criteria</th>
                <th className="px-4 py-3 font-semibold">Blink Marine baseline</th>
                <th className="px-4 py-3 font-semibold">Alternative signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {matrixRows.map((row) => (
                <tr key={row.criteria} className="bg-[#061a3b]/55">
                  <td className="px-4 py-3 font-semibold text-white">{row.criteria}</td>
                  <td className="px-4 py-3">{row.blink}</td>
                  <td className="px-4 py-3">{row.betterWhen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-white">Procurement checklist before you switch vendors</h2>
        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#071938]/70 p-4 text-sm text-blue-100/80">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#9edcff]" />
            Confirm protocol behavior at message-map level, not just protocol name labels.
          </li>
          <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#071938]/70 p-4 text-sm text-blue-100/80">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#9edcff]" />
            Match ingress and lifecycle requirements to your actual field environment and enclosure design.
          </li>
          <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#071938]/70 p-4 text-sm text-blue-100/80">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#9edcff]" />
            Validate tooling and onboarding effort for icon mapping, firmware, and diagnostics workflow.
          </li>
          <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#071938]/70 p-4 text-sm text-blue-100/80">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#9edcff]" />
            Require pilot run data before full program migration decisions.
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-white">FAQ</h2>
        <div className="mt-4 space-y-3">
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-xl border border-white/10 bg-[#071938]/70 p-4">
              <h3 className="text-sm font-semibold text-white">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-blue-100/80">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-xl font-semibold tracking-tight text-white">Sources used in this comparison</h2>
        <p className="mt-2 text-sm text-blue-100/75">
          Public product pages accessed on February 22, 2026. Verify final specifications with vendors before procurement sign-off.
        </p>
        <ul className="mt-4 space-y-2">
          {references.map((source) => (
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
          Use the configurator to model your target workflow, then compare suppliers against the same protocol map and environmental constraints so your decision is based on deployment reality.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/configurator"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#3c6cb1]/70 bg-[#0b2653]/80 px-4 py-2 text-sm font-semibold text-[#b6e5ff] transition-colors hover:bg-[#11306a]"
          >
            Open configurator
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/guides/alternatives"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-blue-100/80 transition-colors hover:border-white/25 hover:text-white"
          >
            Browse all alternatives guides
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarketingPageShell>
  );
}
