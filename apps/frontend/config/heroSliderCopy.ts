import { modelCodeToPkpSlug, resolvePkpModelCode } from '../lib/keypadUtils';

export type HeroConfigureCopyEntry = {
  configureHint: string;
};

const DEFAULT_CONFIGURE_HINT =
  'Map icons slot-by-slot, save your layout, then add directly to cart with production-ready data.';

// Entry point: edit this map to customize button popup text per keypad model.
export const HERO_CONFIGURE_COPY_BY_MODEL: Record<string, HeroConfigureCopyEntry> = {
  'pkp-2200-si': {
    configureHint: 'Perfect for compact dashboards. Assign each of the 4 slots and export the build sheet in minutes.',
  },
  'pkp-2300-si': {
    configureHint: 'Balanced 2x3 layout. Tune each icon for fast glance recognition and add your configured unit to cart.',
  },
  'pkp-2400-si': {
    configureHint: '8-slot format with extra headroom for layered controls. Map now and keep your standard layout reusable.',
  },
  'pkp-2500-si': {
    configureHint: '10 slots for advanced workflows. Configure legends once, then duplicate the setup across your fleet.',
  },
  'pkp-2600-si': {
    configureHint: 'High-density 12-slot model. Build a complete control map with consistent icon placement per function.',
  },
  'pkp-3500-si': {
    configureHint: 'Maximum 3x5 capacity for complex systems. Configure all 15 positions with production-ready output.',
  },
};

function normalizeModelKey(modelIdentifier: string) {
  const value = modelIdentifier.trim();
  if (!value) return '';

  if (/^pkp-\d{4}-si$/i.test(value)) {
    return value.toLowerCase();
  }

  const modelCode = resolvePkpModelCode(value, value);
  if (!modelCode) return '';

  return modelCodeToPkpSlug(modelCode) ?? '';
}

export function resolveHeroConfigureCopy(modelIdentifier: string): HeroConfigureCopyEntry {
  const normalizedModelKey = normalizeModelKey(modelIdentifier);
  if (!normalizedModelKey) {
    return { configureHint: DEFAULT_CONFIGURE_HINT };
  }

  return HERO_CONFIGURE_COPY_BY_MODEL[normalizedModelKey] ?? {
    configureHint: DEFAULT_CONFIGURE_HINT,
  };
}

export function resolveHeroConfigureHint(modelIdentifier: string) {
  return resolveHeroConfigureCopy(modelIdentifier).configureHint;
}
