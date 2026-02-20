type ModelRenderTuning = {
  model: string;
  iconScale: number;
  iconVisibleComp: number;
};

const DEFAULT_RENDER_TUNING: ModelRenderTuning = {
  model: 'DEFAULT',
  iconScale: 0.94,
  iconVisibleComp: 1,
};

const KEYPAD_RENDER_TUNING: Record<string, ModelRenderTuning> = {
  'PKP-2200-SI': {
    model: 'PKP-2200-SI',
    iconScale: 1,
    iconVisibleComp: 1.29,
  },
  'PKP-2300-SI': {
    model: 'PKP-2300-SI',
    iconScale: 1,
    iconVisibleComp: 1.29,
  },
  'PKP-2400-SI': {
    model: 'PKP-2400-SI',
    iconScale: 1.1,
    iconVisibleComp: 1.29,
  },
  'PKP-2500-SI': {
    model: 'PKP-2500-SI',
    iconScale: 1.28,
    iconVisibleComp: 1.01,
  },
  'PKP-2600-SI': {
    model: 'PKP-2600-SI',
    iconScale: 1.28,
    iconVisibleComp: 1.01,
  },
  'PKP-3500-SI': {
    model: 'PKP-3500-SI',
    iconScale: 1.05,
    iconVisibleComp: 1.29,
  },
};

function normalizeModelCode(modelCode: string | null | undefined) {
  return (modelCode ?? '').trim().toUpperCase();
}

export function getRenderTuningForModel(modelCode: string | null | undefined): ModelRenderTuning {
  const normalized = normalizeModelCode(modelCode);
  const tuning = KEYPAD_RENDER_TUNING[normalized];
  if (tuning) return { ...tuning };

  if (!normalized) return { ...DEFAULT_RENDER_TUNING };
  return {
    ...DEFAULT_RENDER_TUNING,
    model: normalized,
  };
}
