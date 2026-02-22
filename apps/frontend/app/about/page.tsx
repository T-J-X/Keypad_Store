import type { Metadata } from 'next';
import { Cpu, ShieldCheck, Layers, Wrench, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import MarketingPageShell from '../../components/marketing/MarketingPageShell';

export const metadata: Metadata = {
  title: 'About Us | VCT',
  description: 'Learn how Vehicle Control Technologies designs rugged keypad systems for demanding environments.',
  alternates: {
    canonical: '/about',
  },
};

const pillars = [
  {
    title: 'Hardware-first engineering',
    body: 'Our keypad systems are designed as production hardware from day one, with clear mechanical tolerances and fit-for-purpose materials.',
    icon: Cpu,
  },
  {
    title: 'Safety and reliability',
    body: 'We focus on deterministic behavior, validated build quality, and repeatable assembly workflows for field-ready deployments.',
    icon: ShieldCheck,
  },
  {
    title: 'Modular by default',
    body: 'Icon libraries, keypad layouts, and exports are structured to scale cleanly across teams and across product lines.',
    icon: Layers,
  },
];

export default function AboutPage() {
  return (
    <MarketingPageShell
      badge="About Us"
      title="We build control interfaces that stay clear under pressure."
      description="Vehicle Control Technologies helps teams design, configure, and ship rugged keypad systems with confidence. Our workflow connects catalog hardware, configurable icon systems, and order-ready outputs."
      actions={[
        { label: 'Browse Keypads', href: '/shop?section=keypads' },
        { label: 'Contact Sales', href: '/contact', variant: 'secondary' },
      ]}
      stats={[
        { label: 'Core Product Lines', value: '2' },
        { label: 'Configurable Layouts', value: '6+' },
        { label: 'Icon Coverage', value: '200+' },
        { label: 'Export Formats', value: 'PDF + Data' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <article
            key={pillar.title}
            className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f6297]/55 bg-[#0b2148]/80 text-[#98d8ff] transition-colors duration-300 group-hover:border-[#5f8ed1]/80 group-hover:text-white">
              <pillar.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">{pillar.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/70">{pillar.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
          <h2 className="text-lg font-semibold tracking-tight text-white">How we work</h2>
          <ol className="mt-4 space-y-3 text-sm text-blue-100/75">
            <li className="rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3">
              <span className="font-semibold text-white">1. Configure with intent:</span> choose hardware, assign icon IDs, and preview fit.
            </li>
            <li className="rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3">
              <span className="font-semibold text-white">2. Validate before build:</span> review technical specs and outputs before purchase.
            </li>
            <li className="rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3">
              <span className="font-semibold text-white">3. Ship faster:</span> reuse saved configurations to reduce repeat work.
            </li>
          </ol>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f6297]/55 bg-[#0b2148]/80 text-[#98d8ff]">
            <Wrench className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">Need a custom rollout?</h3>
          <p className="mt-2 text-sm leading-relaxed text-blue-100/70">
            We support teams standardizing icon sets and keypad models across multiple vehicle platforms.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#9edcff] transition-colors hover:text-white"
          >
            Start a conversation <ArrowUpRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </MarketingPageShell>
  );
}
