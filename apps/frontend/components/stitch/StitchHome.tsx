'use client';

import type { CSSProperties } from 'react';
import StitchFeaturedGrid from './StitchFeaturedGrid';
import StitchBottomNav from './StitchBottomNav';
import StitchHeader from './StitchHeader';
import StitchHero from './StitchHero';
import StitchPromoBanner from './StitchPromoBanner';
import StitchTechSpecs from './StitchTechSpecs';
import { useStitchLandingData } from '../../hooks/stitch/useStitchLandingData';

const stitchThemeVars = {
  '--stitch-bg': '#020617',
  '--stitch-primary': '#4d4dff',
  '--stitch-primary-strong': '#5858ff',
  '--stitch-panel': '#0d1833',
  '--stitch-panel-strong': '#0b1a36',
} as CSSProperties;

export interface StitchHomeProps {}

export default function StitchHome(_props: Readonly<StitchHomeProps>) {
  const { data, activeBottomNav, setActiveBottomNav } = useStitchLandingData();

  return (
    <div className="relative min-h-screen bg-[var(--stitch-bg)] text-slate-100" style={stitchThemeVars}>
      <div className="pointer-events-none fixed -left-24 top-20 -z-10 size-72 rounded-full bg-[var(--stitch-primary)]/15 blur-[110px]" />
      <div className="pointer-events-none fixed -right-24 bottom-28 -z-10 size-80 rounded-full bg-sky-500/10 blur-[130px]" />

      <StitchHeader cartCount={2} />

      <main>
        <StitchHero
          badgeLabel={data.badgeLabel}
          headlineStart={data.headlineStart}
          headlineAccent={data.headlineAccent}
          description={data.description}
          modelLabel={data.modelLabel}
          modelName={data.modelName}
          modelPriceLabel={data.modelPriceLabel}
          heroImageUrl={data.heroImageUrl}
          heroImageAlt={data.heroImageAlt}
          heroSpecs={data.heroSpecs}
        />

        <StitchTechSpecs items={data.technicalSpecs} />
        <StitchFeaturedGrid products={data.featuredProducts} />
        <StitchPromoBanner title={data.promoTitle} body={data.promoBody} href={data.promoHref} />
      </main>

      <StitchBottomNav items={data.bottomNav} activeId={activeBottomNav} onSelect={setActiveBottomNav} />
    </div>
  );
}
