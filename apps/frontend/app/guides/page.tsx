import type { Metadata } from 'next';
import { ClipboardCheck, Settings2, FileSearch, Truck, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import MarketingPageShell from '../../components/marketing/MarketingPageShell';
import { buildPageMetadata } from '../../lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Guides',
  description: 'Step-by-step guides for configuring, validating, and ordering VCT keypads.',
  canonical: '/guides',
  keywords: ['keypad configuration guides', 'VCT setup guides', 'industrial keypad workflow'],
});

const steps = [
  {
    title: 'Select your hardware',
    detail: 'Choose keypad models and quantities based on panel layout and operating environment.',
    icon: ClipboardCheck,
  },
  {
    title: 'Configure icon mapping',
    detail: 'Assign icon IDs and ring glow values per slot in the configurator.',
    icon: Settings2,
  },
  {
    title: 'Validate technical outputs',
    detail: 'Review the generated spec details before adding configured units to cart.',
    icon: FileSearch,
  },
  {
    title: 'Place and track order',
    detail: 'Complete checkout and maintain clear traceability from config to delivered hardware.',
    icon: Truck,
  },
];

export default function GuidesPage() {
  return (
    <MarketingPageShell
      badge="Guides"
      title="Practical workflows from first configuration to shipped keypad."
      description="These guides are written for teams that need predictable execution. Follow the sequence to reduce rework and keep procurement aligned with engineering intent."
      actions={[
        { label: 'Open Configurator', href: '/configurator' },
        { label: 'Need help? Contact us', href: '/contact', variant: 'secondary' },
      ]}
      stats={[
        { label: 'Core Workflow Stages', value: '4' },
        { label: 'Target Outcome', value: 'Order-ready configs' },
        { label: 'Best for', value: 'Engineering teams' },
        { label: 'Support Available', value: 'Yes' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#3f6297]/55 bg-[#0b2148]/80 text-[#98d8ff] transition-colors duration-300 group-hover:border-[#5f8ed1]/80 group-hover:text-white">
                <step.icon className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100/70">
                Step {index + 1}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/70">{step.detail}</p>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
        <h2 className="text-lg font-semibold tracking-tight text-white">Where to go next</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href="/docs" className="group flex items-center justify-between rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3 text-sm text-blue-100/80 transition-colors hover:border-white/20 hover:text-white">
            Documentation hub
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link href="/shop?section=keypads" className="group flex items-center justify-between rounded-xl border border-white/10 bg-[#071938]/70 px-4 py-3 text-sm text-blue-100/80 transition-colors hover:border-white/20 hover:text-white">
            Browse keypad models
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </section>
    </MarketingPageShell>
  );
}
