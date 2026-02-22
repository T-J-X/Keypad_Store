import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';

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

function getActionVariant(variant: MarketingAction['variant']) {
  return variant === 'secondary' ? 'secondaryDark' : 'premium';
}

const EMPTY_ACTIONS: MarketingAction[] = [];
const EMPTY_STATS: MarketingStat[] = [];

export default function MarketingPageShell({
  badge,
  title,
  description,
  lastUpdated,
  actions = EMPTY_ACTIONS,
  stats = EMPTY_STATS,
  children,
}: MarketingPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-[#17325f]/35 bg-[linear-gradient(145deg,#020916_0%,#06152f_38%,#081a3a_100%)] shadow-[0_26px_90px_rgba(2,9,22,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_85%_0%,rgba(75,127,202,0.3),transparent_50%),radial-gradient(120%_100%_at_15%_100%,rgba(56,189,248,0.2),transparent_45%)]" />
        <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative z-10 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <header className="max-w-3xl motion-safe:animate-fade-up">
            <Badge
              variant="outline"
              className="rounded-full border-[#3c5f95]/45 bg-[#0a2047]/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9edcff] backdrop-blur-lg"
            >
              {badge}
            </Badge>
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
                <Button
                  key={`${action.href}-${action.label}`}
                  asChild
                  variant={getActionVariant(action.variant)}
                  className="group min-h-[46px] rounded-2xl px-5 py-2.5 text-sm"
                >
                  <Link href={action.href}>
                    {action.label}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              ))}
            </div>
          ) : null}

          {stats.length > 0 ? (
            <dl className="staggered mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card
                  key={stat.label}
                  className="gap-0 rounded-2xl border-white/10 bg-white/[0.045] py-0 backdrop-blur-xl transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.075]"
                >
                  <CardContent className="p-4">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.13em] text-blue-100/55">{stat.label}</dt>
                    <dd className="mt-2 text-2xl font-semibold tracking-tight text-white">{stat.value}</dd>
                  </CardContent>
                </Card>
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
