import type { Metadata } from 'next';
import { Users, Cpu, ShieldCheck, Rocket, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import MarketingPageShell from '../../components/marketing/MarketingPageShell';
import { buildPageMetadata } from '../../lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Careers',
  description: 'Explore careers at Vehicle Control Technologies and submit your interest.',
  canonical: '/careers',
  keywords: [
    'VCT careers',
    'keypad engineering jobs',
    'industrial hardware careers',
    'embedded systems careers',
    'product engineering jobs',
    'vehicle control technology jobs',
  ],
});

const principles = [
  {
    title: 'Ownership over handoffs',
    body: 'We value people who can take a problem from idea to implemented outcome with clear communication.',
    icon: Rocket,
  },
  {
    title: 'Engineering discipline',
    body: 'We optimize for reliability, maintainability, and practical systems thinking across hardware and software.',
    icon: ShieldCheck,
  },
  {
    title: 'Product empathy',
    body: 'We work close to customer use-cases and design decisions around real operating constraints.',
    icon: Users,
  },
];

export default function CareersPage() {
  return (
    <MarketingPageShell
      badge="Careers"
      title="Build products that teams rely on in real environments."
      description="We are focused on dependable interface systems and execution quality. If that matches how you work, we would like to hear from you."
      actions={[
        { label: 'Send your profile', href: 'mailto:careers@vc-tech.co.uk' },
        { label: 'Learn about VCT', href: '/about', variant: 'secondary' },
      ]}
      stats={[
        { label: 'Current Priority', value: 'Execution quality' },
        { label: 'Domain', value: 'Control interfaces' },
        { label: 'Team Style', value: 'Hands-on ownership' },
        { label: 'Contact', value: 'careers@vc-tech.co.uk' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {principles.map((principle) => (
          <article
            key={principle.title}
            className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f6297]/55 bg-[#0b2148]/80 text-[#98d8ff] transition-colors duration-300 group-hover:border-[#5f8ed1]/80 group-hover:text-white">
              <principle.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">{principle.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/70">{principle.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
            <Cpu className="h-5 w-5 text-[#98d8ff]" />
            Open roles
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-blue-100/70">
            We do not have public openings listed right now. We still review strong profiles for engineering,
            product, and operations functions when alignment is clear.
          </p>
          <a
            href="mailto:careers@vc-tech.co.uk?subject=VCT%20Career%20Interest"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#9edcff] transition-colors hover:text-white"
          >
            careers@vc-tech.co.uk <ArrowUpRight className="h-4 w-4" />
          </a>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
          <h3 className="text-lg font-semibold tracking-tight text-white">Helpful links</h3>
          <div className="mt-4 space-y-2.5">
            <Link href="/about" className="group flex items-center justify-between rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3 text-sm text-blue-100/80 transition-colors hover:border-white/20 hover:text-white">
              About the company
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link href="/contact" className="group flex items-center justify-between rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3 text-sm text-blue-100/80 transition-colors hover:border-white/20 hover:text-white">
              Contact the team
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </aside>
      </div>
    </MarketingPageShell>
  );
}
