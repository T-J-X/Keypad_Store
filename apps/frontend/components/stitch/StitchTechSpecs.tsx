import { CircuitBoard, Palette, Wrench } from 'lucide-react';
import type { StitchTechnicalSpec } from '../../data/stitchMockData';

export interface StitchTechSpecsProps {
  readonly items: readonly StitchTechnicalSpec[];
}

function TechSpecIcon({ id }: { readonly id: StitchTechnicalSpec['icon'] }) {
  if (id === 'chip') {
    return <CircuitBoard className="size-4 text-sky-300" />;
  }

  if (id === 'palette') {
    return <Palette className="size-4 text-sky-300" />;
  }

  return <Wrench className="size-4 text-sky-300" />;
}

export default function StitchTechSpecs({ items }: Readonly<StitchTechSpecsProps>) {
  return (
    <section className="border-y border-white/10 bg-white/[0.03] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[var(--stitch-panel)] px-4 py-3 text-center">
            <span className="flex size-8 items-center justify-center rounded-full bg-[var(--stitch-panel-strong)]">
              <TechSpecIcon id={item.icon} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-200">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
