import type { Metadata } from 'next';
import { Headset, BadgeCheck, Building2, Mail, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import MarketingPageShell from '../../components/marketing/MarketingPageShell';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Talk to Vehicle Control Technologies about sales, support, and integration planning.',
  alternates: {
    canonical: '/contact',
  },
};

const channels = [
  {
    title: 'Sales',
    details: 'Sizing, product selection, and order planning',
    email: 'sales@vc-tech.co.uk',
    icon: Building2,
  },
  {
    title: 'Technical Support',
    details: 'Configuration help, troubleshooting, and deployment guidance',
    email: 'support@vc-tech.co.uk',
    icon: Headset,
  },
  {
    title: 'Program & Fleet',
    details: 'Multi-unit rollout support and account coordination',
    email: 'projects@vc-tech.co.uk',
    icon: BadgeCheck,
  },
];

export default function ContactPage() {
  return (
    <MarketingPageShell
      badge="Contact"
      title="Get in touch with the right team, fast."
      description="Whether you are specifying one keypad or coordinating a broader deployment, we can help you move from requirement to shipped hardware with less friction."
      actions={[
        { label: 'Start Configuring', href: '/configurator' },
        { label: 'View Catalog', href: '/shop', variant: 'secondary' },
      ]}
      stats={[
        { label: 'Response Window', value: '< 1 business day' },
        { label: 'Order Support', value: 'Pre + post purchase' },
        { label: 'Deployment Scope', value: 'Single to fleet' },
        { label: 'Regions Supported', value: 'Global shipping' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {channels.map((channel) => (
          <article
            key={channel.title}
            className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f6297]/55 bg-[#0b2148]/80 text-[#98d8ff] transition-colors duration-300 group-hover:border-[#5f8ed1]/80 group-hover:text-white">
              <channel.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">{channel.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/70">{channel.details}</p>
            <a
              href={`mailto:${channel.email}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#9edcff] transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4" />
              {channel.email}
            </a>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
          <h2 className="text-lg font-semibold tracking-tight text-white">What to include in your request</h2>
          <ul className="mt-4 space-y-3 text-sm text-blue-100/75">
            <li className="rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3">
              Vehicle/application context and target environment.
            </li>
            <li className="rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3">
              Preferred keypad model(s), quantity, and timeline.
            </li>
            <li className="rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3">
              Any existing icon IDs, standards, or integration constraints.
            </li>
          </ul>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
          <h3 className="text-lg font-semibold tracking-tight text-white">Quick links</h3>
          <div className="mt-4 space-y-2.5">
            <Link href="/guides" className="group flex items-center justify-between rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3 text-sm text-blue-100/80 transition-colors hover:border-white/20 hover:text-white">
              Installation guides
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link href="/docs" className="group flex items-center justify-between rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3 text-sm text-blue-100/80 transition-colors hover:border-white/20 hover:text-white">
              Documentation hub
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </aside>
      </div>
    </MarketingPageShell>
  );
}
