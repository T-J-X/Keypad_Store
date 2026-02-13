import { CONFIGURATOR_THEME } from '../configurator/theme';

export type SlotCoordMode = 'center' | 'topLeft';
export type SlotId = `slot_${number}`;

export type SlotSafeZone = {
  // Offsets measured inside the slot box.
  centerXPctOfSlot: number;
  centerYPctOfSlot: number;
  // Effective physical button/well diameter relative to slot box size.
  wellDiameterPctOfSlot: number;
  // LED ring band around the well radius.
  ledOuterPctOfWell: number;
  ledInnerPctOfWell: number;
  // Icon insert diameter relative to slot box size.
  iconDiameterPctOfSlot: number;
};

export type SlotGeometry = {
  label: string;
  // Normalized center and radius coordinates in the shared stage space.
  cx: number;
  cy: number;
  r: number;
  // Slot placement used by the SVG preview pipeline.
  leftPct: number;
  topPct: number;
  sizePct: number;
  coordMode?: SlotCoordMode;
  safeZone?: SlotSafeZone;
};

export type KeypadModelGeometry = {
  modelCode: string;
  layoutLabel: string;
  columns: number;
  rows: number;
  aspectRatio: number;
  intrinsicSize: {
    width: number;
    height: number;
  };
  slotSizeMm: number;
  slotCoordMode: SlotCoordMode;
  slots: Record<string, SlotGeometry>;
  buttonVisual: {
    ringDiameterPctOfSlot: number;
    iconDiameterPctOfSlot: number;
  };
};

export const DEFAULT_SLOT_SAFE_ZONE: SlotSafeZone = {
  centerXPctOfSlot: 50,
  centerYPctOfSlot: 50,
  wellDiameterPctOfSlot: 145,
  ledOuterPctOfWell: 94,
  ledInnerPctOfWell: 80,
  iconDiameterPctOfSlot: CONFIGURATOR_THEME.iconFitPercent,
};

export function slotGeometryToPercentBox(slot: SlotGeometry) {
  return {
    leftPct: (slot.cx - slot.r) * 100,
    topPct: (slot.cy - slot.r) * 100,
    widthPct: slot.r * 200,
    heightPct: slot.r * 200,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function createSlotId(index: number): SlotId {
  return `slot_${index}`;
}

function slotIdToIndex(slotId: string) {
  const match = slotId.match(/^slot_(\d+)$/i);
  if (!match) return Number.POSITIVE_INFINITY;
  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return parsed;
}

export function sortSlotIds(slotIds: readonly string[]) {
  return [...slotIds].sort((left, right) => slotIdToIndex(left) - slotIdToIndex(right));
}

function buildGridSlots({
  rows,
  columns,
  sizePct,
  xStartPct,
  xEndPct,
  yStartPct,
  yEndPct,
  xCentersPct,
  yCentersPct,
}: {
  rows: number;
  columns: number;
  sizePct: number;
  xStartPct?: number;
  xEndPct?: number;
  yStartPct?: number;
  yEndPct?: number;
  xCentersPct?: number[];
  yCentersPct?: number[];
}): Record<string, SlotGeometry> {
  const xSpanPct = columns === 2 ? 25 : 48;
  const defaultXStartPct = 50 - (xSpanPct / 2);
  const defaultXEndPct = 50 + (xSpanPct / 2);
  const ySpreadExpansionPct = Math.max(0, rows - 2) * 2.2;
  const defaultYStartPct = 20.7 - ySpreadExpansionPct;
  const defaultYEndPct = 71.1 + ySpreadExpansionPct;

  const resolvedXStartPct = xStartPct ?? defaultXStartPct;
  const resolvedXEndPct = xEndPct ?? defaultXEndPct;
  const resolvedYStartPct = yStartPct ?? defaultYStartPct;
  const resolvedYEndPct = yEndPct ?? defaultYEndPct;

  const resolvedXCentersPct =
    xCentersPct && xCentersPct.length === columns
      ? xCentersPct
      : Array.from({ length: columns }, (_, index) => {
          if (columns <= 1) return (resolvedXStartPct + resolvedXEndPct) / 2;
          return resolvedXStartPct + ((resolvedXEndPct - resolvedXStartPct) * index) / (columns - 1);
        });
  const resolvedYCentersPct =
    yCentersPct && yCentersPct.length === rows
      ? yCentersPct
      : Array.from({ length: rows }, (_, index) => {
          if (rows <= 1) return (resolvedYStartPct + resolvedYEndPct) / 2;
          return resolvedYStartPct + ((resolvedYEndPct - resolvedYStartPct) * index) / (rows - 1);
        });

  const slots: Record<string, SlotGeometry> = {};
  let index = 1;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const centerXPct = resolvedXCentersPct[column] ?? 50;
      const centerYPct = resolvedYCentersPct[row] ?? 50;
      const leftPct = centerXPct - (sizePct / 2);
      const topPct = centerYPct - (sizePct / 2);
      const slotId = createSlotId(index);

      slots[slotId] = {
        label: `Slot ${index}`,
        cx: centerXPct / 100,
        cy: centerYPct / 100,
        r: sizePct / 200,
        leftPct,
        topPct,
        sizePct,
        safeZone: {
          ...DEFAULT_SLOT_SAFE_ZONE,
        },
      };

      index += 1;
    }
  }

  return slots;
}

function buildGridModelGeometry({
  modelCode,
  layoutLabel,
  columns,
  rows,
  intrinsicSize,
  slotSizePctOverride,
  gridBounds,
}: {
  modelCode: string;
  layoutLabel: string;
  columns: number;
  rows: number;
  intrinsicSize: {
    width: number;
    height: number;
  };
  slotSizePctOverride?: number;
  gridBounds?: {
    xStartPct?: number;
    xEndPct?: number;
    yStartPct?: number;
    yEndPct?: number;
    xCentersPct?: number[];
    yCentersPct?: number[];
  };
}): KeypadModelGeometry {
  const defaultSizePct = clamp(
    12.4 - (Math.max(0, rows - 2) * 0.72) - (Math.max(0, columns - 2) * 0.85),
    8.6,
    12.4,
  );
  const slotSizePct = slotSizePctOverride ?? defaultSizePct;

  return {
    modelCode,
    layoutLabel,
    columns,
    rows,
    aspectRatio: intrinsicSize.width / intrinsicSize.height,
    intrinsicSize,
    slotSizeMm: 15,
    slotCoordMode: 'topLeft',
    slots: buildGridSlots({
      rows,
      columns,
      sizePct: slotSizePct,
      ...gridBounds,
    }),
    buttonVisual: {
      ringDiameterPctOfSlot: 136.3,
      iconDiameterPctOfSlot: CONFIGURATOR_THEME.iconFitPercent,
    },
  };
}

const PKP_2200_SI_SLOTS: Record<string, SlotGeometry> = {
  slot_1: {
    label: 'Slot 1',
    // Source placement: left 31.3%, top 14.4%, width 12.4%
    cx: 0.375,
    cy: 0.206,
    r: 0.062,
    leftPct: 31.3,
    topPct: 14.4,
    sizePct: 12.4,
    safeZone: {
      ...DEFAULT_SLOT_SAFE_ZONE,
    },
  },
  slot_2: {
    label: 'Slot 2',
    // Source placement: left 56.3%, top 14.6%, width 12.4%
    cx: 0.625,
    cy: 0.208,
    r: 0.062,
    leftPct: 56.3,
    topPct: 14.6,
    sizePct: 12.4,
    safeZone: {
      ...DEFAULT_SLOT_SAFE_ZONE,
    },
  },
  slot_3: {
    label: 'Slot 3',
    // Source placement: left 31.6%, top 65.1%, width 12.4%
    cx: 0.378,
    cy: 0.713,
    r: 0.062,
    leftPct: 31.6,
    topPct: 65.1,
    sizePct: 12.4,
    safeZone: {
      ...DEFAULT_SLOT_SAFE_ZONE,
    },
  },
  slot_4: {
    label: 'Slot 4',
    // Source placement: left 56.1%, top 64.8%, width 12.4%
    cx: 0.623,
    cy: 0.71,
    r: 0.062,
    leftPct: 56.1,
    topPct: 64.8,
    sizePct: 12.4,
    safeZone: {
      ...DEFAULT_SLOT_SAFE_ZONE,
    },
  },
};

export const PKP_2200_SI_GEOMETRY: KeypadModelGeometry = {
  modelCode: 'PKP-2200-SI',
  layoutLabel: '2x2',
  columns: 2,
  rows: 2,
  // Render canvas is 1000x580.
  aspectRatio: 50 / 29,
  intrinsicSize: {
    width: 1000,
    height: 580,
  },
  slotSizeMm: 15,
  slotCoordMode: 'topLeft',
  slots: PKP_2200_SI_SLOTS,
  buttonVisual: {
    // Tuned against 12.4% slot boxes so ring sits on the outer grey channel
    // and matte symbols do not render undersized.
    ringDiameterPctOfSlot: 136.3,
    iconDiameterPctOfSlot: CONFIGURATOR_THEME.iconFitPercent,
  },
};

export const PKP_2300_SI_GEOMETRY = buildGridModelGeometry({
  modelCode: 'PKP-2300-SI',
  layoutLabel: '2x3',
  columns: 3,
  rows: 2,
  intrinsicSize: {
    width: 1200,
    height: 580,
  },
  gridBounds: {
    xCentersPct: [23.8, 50.0, 75.5],
    yCentersPct: [20.7, 74.0],
  },
});

export const PKP_2400_SI_GEOMETRY = buildGridModelGeometry({
  modelCode: 'PKP-2400-SI',
  layoutLabel: '2x4',
  columns: 4,
  rows: 2,
  intrinsicSize: {
    width: 1320,
    height: 580,
  },
  gridBounds: {
    xCentersPct: [13.5, 38.1, 61.9, 84.2],
    yCentersPct: [17.2, 75.3],
  },
});

export const PKP_2500_SI_GEOMETRY = buildGridModelGeometry({
  modelCode: 'PKP-2500-SI',
  layoutLabel: '2x5',
  columns: 5,
  rows: 2,
  intrinsicSize: {
    width: 1420,
    height: 580,
  },
  gridBounds: {
    xCentersPct: [9.9, 30.8, 50.0, 69.0, 89.2],
    yCentersPct: [24.0, 75.6],
  },
});

export const PKP_2600_SI_GEOMETRY = buildGridModelGeometry({
  modelCode: 'PKP-2600-SI',
  layoutLabel: '2x6',
  columns: 6,
  rows: 2,
  intrinsicSize: {
    width: 1540,
    height: 580,
  },
  gridBounds: {
    xCentersPct: [9.9, 25.9, 41.8, 58.0, 74.0, 90.0],
    yCentersPct: [24.0, 75.0],
  },
});

export const PKP_3500_SI_GEOMETRY = buildGridModelGeometry({
  modelCode: 'PKP-3500-SI',
  layoutLabel: '3x5',
  columns: 5,
  rows: 3,
  intrinsicSize: {
    width: 1400,
    height: 700,
  },
  gridBounds: {
    xCentersPct: [10.8, 30.9, 49.8, 68.2, 89.0],
    yCentersPct: [15.0, 50.2, 83.2],
  },
});

export const KEYPAD_MODEL_GEOMETRIES: Record<string, KeypadModelGeometry> = {
  [PKP_2200_SI_GEOMETRY.modelCode]: PKP_2200_SI_GEOMETRY,
  [PKP_2300_SI_GEOMETRY.modelCode]: PKP_2300_SI_GEOMETRY,
  [PKP_2400_SI_GEOMETRY.modelCode]: PKP_2400_SI_GEOMETRY,
  [PKP_2500_SI_GEOMETRY.modelCode]: PKP_2500_SI_GEOMETRY,
  [PKP_2600_SI_GEOMETRY.modelCode]: PKP_2600_SI_GEOMETRY,
  [PKP_3500_SI_GEOMETRY.modelCode]: PKP_3500_SI_GEOMETRY,
};

export function getGeometryForModel(modelCode: string) {
  return KEYPAD_MODEL_GEOMETRIES[modelCode] ?? PKP_2200_SI_GEOMETRY;
}

export function getSlotIdsForGeometry(geometry: KeypadModelGeometry): SlotId[] {
  return sortSlotIds(Object.keys(geometry.slots)) as SlotId[];
}

export function getSlotIdsForModel(modelCode: string): SlotId[] {
  return getSlotIdsForGeometry(getGeometryForModel(modelCode));
}

export function inferModelCodeFromSlotCount(slotCount: number): string | null {
  if (!Number.isFinite(slotCount) || slotCount <= 0) return null;

  const match = Object.values(KEYPAD_MODEL_GEOMETRIES).find(
    (geometry) => getSlotIdsForGeometry(geometry).length === slotCount,
  );

  return match?.modelCode ?? null;
}
