import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

type MarketingAction = {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
};

type MarketingStat = {
  label: string;
  value: string;
};

type MarketingPageShellProps = {
  badge: string;
  title: string;
  description: string;
  lastUpdated?: string;
  actions?: MarketingAction[];
  stats?: MarketingStat[];
  children: ReactNode;
};

const primaryActionClass = 'inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-transparent px-5 py-2.5 text-sm font-semibold text-white bg-[linear-gradient(90deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#203f7a_0%,#2f5da8_55%,#4b7fca_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box] shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-[transform,background,box-shadow] duration-300 hover:-translate-y-[1px] hover:bg-[linear-gradient(270deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#24497d_0%,#39629a_55%,#537bb0_100%)] hover:shadow-[0_0_0_1px_rgba(72,116,194,0.56),0_10px_24px_rgba(4,15,46,0.29)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29457A]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white';
const secondaryActionClass = 'inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-[#2d4d81]/45 bg-[#071634]/55 px-5 py-2.5 text-sm font-semibold text-blue-50 backdrop-blur-xl transition-[transform,border-color,background-color,color] duration-300 hover:-translate-y-[1px] hover:border-[#4f79bb]/70 hover:bg-[#0a1f45]/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f79bb]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

function getActionClass(variant: MarketingAction['variant']) {
  return variant === 'secondary' ? secondaryActionClass : primaryActionClass;
}

export default function MarketingPageShell({
  badge,
  title,
  description,
  lastUpdated,
  actions = [],
  stats = [],
  children,
}: MarketingPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-[#17325f]/35 bg-[linear-gradient(145deg,#020916_0%,#06152f_38%,#081a3a_100%)] shadow-[0_26px_90px_rgba(2,9,22,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_85%_0%,rgba(75,127,202,0.3),transparent_50%),radial-gradient(120%_100%_at_15%_100%,rgba(56,189,248,0.2),transparent_45%)]" />
        <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative z-10 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <header className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-[#3c5f95]/45 bg-[#0a2047]/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9edcff] backdrop-blur-lg">
              {badge}
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-blue-100/75 sm:text-lg">
              {description}
            </p>
            {lastUpdated ? (
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.13em] text-blue-100/45">
                Last updated: {lastUpdated}
              </p>
            ) : null}
          </header>

          {actions.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link key={`${action.href}-${action.label}`} href={action.href} className={getActionClass(action.variant)}>
                  {action.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          ) : null}

          {stats.length > 0 ? (
            <dl className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.075]"
                >
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-blue-100/55">{stat.label}</dt>
                  <dd className="mt-2 text-2xl font-semibold tracking-tight text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-12 [content-visibility:auto]">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
