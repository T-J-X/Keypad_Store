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

type SlotMicroTweak = {
  centerOffsetXPct?: number;
  centerOffsetYPct?: number;
  sizeScale?: number;
  sizeOffsetPct?: number;
};

export const DEFAULT_SLOT_SAFE_ZONE: SlotSafeZone = {
  centerXPctOfSlot: 50,
  centerYPctOfSlot: 50,
  wellDiameterPctOfSlot: 145,
  ledOuterPctOfWell: 94,
  ledInnerPctOfWell: 80,
  iconDiameterPctOfSlot: CONFIGURATOR_THEME.iconFitPercent,
};

const DEFAULT_BUTTON_VISUAL: KeypadModelGeometry['buttonVisual'] = {
  ringDiameterPctOfSlot: 136.3,
  iconDiameterPctOfSlot: CONFIGURATOR_THEME.iconFitPercent,
};

function slotGeometryToPercentBox(slot: SlotGeometry) {
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

function buildSlotsFromCenterPercents(
  centerPoints: Array<{ xPct: number; yPct: number }>,
  sizePct: number,
): Record<string, SlotGeometry> {
  const slots: Record<string, SlotGeometry> = {};

  centerPoints.forEach((point, index) => {
    const slotId = createSlotId(index + 1);
    slots[slotId] = {
      label: `Slot ${index + 1}`,
      cx: point.xPct / 100,
      cy: point.yPct / 100,
      r: sizePct / 200,
      leftPct: point.xPct - (sizePct / 2),
      topPct: point.yPct - (sizePct / 2),
      sizePct,
      safeZone: {
        ...DEFAULT_SLOT_SAFE_ZONE,
      },
    };
  });

  return slots;
}

function buildSlotsFromPsdBounds(
  canvasSize: { width: number; height: number },
  bounds: Array<{ left: number; top: number; right: number; bottom: number }>,
  options?: {
    sizePctOverride?: number;
    sizePctScale?: number;
    centerOffsetXPct?: number;
    centerOffsetYPct?: number;
  },
): Record<string, SlotGeometry> {
  const slots: Record<string, SlotGeometry> = {};
  const resolvedSizePctOverride = options?.sizePctOverride;
  const resolvedSizePctScale = options?.sizePctScale ?? 1;
  const resolvedCenterOffsetXPct = options?.centerOffsetXPct ?? 0;
  const resolvedCenterOffsetYPct = options?.centerOffsetYPct ?? 0;

  bounds.forEach((bound, index) => {
    const slotId = createSlotId(index + 1);
    const width = bound.right - bound.left;
    const rawSizePct = (width / canvasSize.width) * 100;
    const sizePct = resolvedSizePctOverride ?? (rawSizePct * resolvedSizePctScale);
    const centerX = bound.left + (width / 2);
    const centerY = bound.top + ((bound.bottom - bound.top) / 2);
    const centerXPct = ((centerX / canvasSize.width) * 100) + resolvedCenterOffsetXPct;
    const centerYPct = ((centerY / canvasSize.height) * 100) + resolvedCenterOffsetYPct;

    slots[slotId] = {
      label: `Slot ${index + 1}`,
      cx: centerXPct / 100,
      cy: centerYPct / 100,
      r: sizePct / 200,
      leftPct: centerXPct - (sizePct / 2),
      topPct: centerYPct - (sizePct / 2),
      sizePct,
      safeZone: {
        ...DEFAULT_SLOT_SAFE_ZONE,
      },
    };
  });

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
      ...DEFAULT_BUTTON_VISUAL,
    },
  };
}

function applySlotMicroTweaks(
  slots: Record<string, SlotGeometry>,
  tweaks: Partial<Record<SlotId, SlotMicroTweak>>,
): Record<string, SlotGeometry> {
  const adjusted: Record<string, SlotGeometry> = {};

  for (const [slotId, slot] of Object.entries(slots)) {
    const tweak = tweaks[slotId as SlotId];
    if (!tweak) {
      adjusted[slotId] = slot;
      continue;
    }

    const baseSizePct = Number.isFinite(slot.sizePct) ? slot.sizePct : slot.r * 200;
    const sizeScale = tweak.sizeScale ?? 1;
    const sizeOffsetPct = tweak.sizeOffsetPct ?? 0;
    const sizePct = Math.max(0.1, (baseSizePct * sizeScale) + sizeOffsetPct);
    const centerXPct = (slot.cx * 100) + (tweak.centerOffsetXPct ?? 0);
    const centerYPct = (slot.cy * 100) + (tweak.centerOffsetYPct ?? 0);

    adjusted[slotId] = {
      ...slot,
      cx: centerXPct / 100,
      cy: centerYPct / 100,
      r: sizePct / 200,
      leftPct: centerXPct - (sizePct / 2),
      topPct: centerYPct - (sizePct / 2),
      sizePct,
    };
  }

  return adjusted;
}
