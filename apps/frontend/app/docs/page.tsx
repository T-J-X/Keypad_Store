import type { Metadata } from 'next';
import { FileText, Settings2, PackageSearch, ShieldCheck, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import MarketingPageShell from '../../components/marketing/MarketingPageShell';
import { buildPageMetadata } from '../../lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Documentation',
  description: 'Central documentation for configuring, ordering, and deploying VCT keypad products.',
  canonical: '/docs',
  keywords: [
    'VCT documentation',
    'keypad configurator guide',
    'keypad ordering documentation',
    'CAN keypad documentation',
    'J1939 keypad documentation',
    'button insert documentation',
    'keypad integration documentation',
  ],
});

const docsCards = [
  {
    title: 'Configurator basics',
    body: 'Model selection, slot mapping, and save workflow fundamentals.',
    href: '/configurator',
    icon: Settings2,
  },
  {
    title: 'Product catalog references',
    body: 'Icon sets, keypad families, and variant lookup from the storefront.',
    href: '/shop',
    icon: PackageSearch,
  },
  {
    title: 'Checkout and ordering',
    body: 'Order flow, review checkpoints, and technical spec export guidance.',
    href: '/cart',
    icon: FileText,
  },
];

export default function DocsPage() {
  return (
    <MarketingPageShell
      badge="Documentation"
      title="Reference material for each step of the keypad workflow."
      description="Use this hub to navigate setup instructions, product references, and ordering guidance. Each section is tuned for practical execution, not generic theory."
      actions={[
        { label: 'View Installation Guides', href: '/guides' },
        { label: 'Contact Support', href: '/contact', variant: 'secondary' },
      ]}
      stats={[
        { label: 'Documentation Areas', value: '3' },
        { label: 'Audience', value: 'Engineering + Ops' },
        { label: 'Content Focus', value: 'Hands-on workflows' },
        { label: 'Support Path', value: 'Direct contact' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {docsCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f6297]/55 bg-[#0b2148]/80 text-[#98d8ff] transition-colors duration-300 group-hover:border-[#5f8ed1]/80 group-hover:text-white">
              <card.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/70">{card.body}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#9edcff] transition-colors group-hover:text-white">
              Open section <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
          <ShieldCheck className="h-5 w-5 text-[#98d8ff]" />
          Recommended pre-order checklist
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-blue-100/75">
          <li className="rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3">Verify model and slot count for your application.</li>
          <li className="rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3">Confirm icon IDs and ring glow requirements.</li>
          <li className="rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3">Review technical spec export before final purchase.</li>
          <li className="rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3">Coordinate shipping timeline with your build schedule.</li>
        </ul>
      </section>
    </MarketingPageShell>
  );
}
