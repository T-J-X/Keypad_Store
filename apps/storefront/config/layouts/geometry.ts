import {
  getLayoutForModel,
  getSlotIdsForLayout,
  inferLayoutModelCodeFromSlotCount,
} from '../../lib/keypad-layouts';
import {
  DEFAULT_SLOT_SAFE_ZONE,
  sortSlotIds as sharedSortSlotIds,
} from './shared';
import type {
  KeypadModelGeometry,
  SlotGeometry,
  SlotId,
} from './shared';

export {
  buildGridModelGeometry,
  buildSlotsFromCenterPercents,
  buildSlotsFromPsdBounds,
  DEFAULT_BUTTON_VISUAL,
  DEFAULT_SLOT_SAFE_ZONE,
  slotGeometryToPercentBox,
  sortSlotIds,
} from './shared';
export type {
  KeypadModelGeometry,
  SlotCoordMode,
  SlotGeometry,
  SlotId,
  SlotSafeZone,
} from './shared';

const MODEL_GRID_META: Record<string, { layoutLabel: string; columns: number; rows: number }> = {
  'PKP-2200-SI': { layoutLabel: '2x2', columns: 2, rows: 2 },
  'PKP-2300-SI': { layoutLabel: '2x3', columns: 3, rows: 2 },
  'PKP-2400-SI': { layoutLabel: '2x4', columns: 4, rows: 2 },
  'PKP-2500-SI': { layoutLabel: '2x5', columns: 5, rows: 2 },
  'PKP-2600-SI': { layoutLabel: '2x6', columns: 6, rows: 2 },
  'PKP-3500-SI': { layoutLabel: '3x5', columns: 5, rows: 3 },
};

function inferGridMeta(slotCount: number) {
  if (slotCount === 4) return { layoutLabel: '2x2', columns: 2, rows: 2 };
  if (slotCount === 6) return { layoutLabel: '2x3', columns: 3, rows: 2 };
  if (slotCount === 8) return { layoutLabel: '2x4', columns: 4, rows: 2 };
  if (slotCount === 10) return { layoutLabel: '2x5', columns: 5, rows: 2 };
  if (slotCount === 12) return { layoutLabel: '2x6', columns: 6, rows: 2 };
  if (slotCount === 15) return { layoutLabel: '3x5', columns: 5, rows: 3 };

  const columns = Math.max(1, Math.round(Math.sqrt(Math.max(1, slotCount))));
  const rows = Math.max(1, Math.ceil(slotCount / columns));
  return {
    layoutLabel: `${rows}x${columns}`,
    columns,
    rows,
  };
}

function buildGeometryFromLayout(modelCode: string): KeypadModelGeometry {
  const layout = getLayoutForModel(modelCode);
  const slotIds = getSlotIdsForLayout(layout);
  const modelMeta = MODEL_GRID_META[layout.model] ?? inferGridMeta(layout.slots.length);

  const slots: Record<string, SlotGeometry> = {};
  let iconDiameterTotal = 0;

  slotIds.forEach((slotId, index) => {
    const slotEntry = layout.slots.find((candidate) => candidate.id === slotId);
    if (!slotEntry) return;

    const slotDiameterPx = Math.max(slotEntry.bezelD, slotEntry.insertD);
    const slotRadiusPx = slotDiameterPx / 2;
    const leftPx = slotEntry.cx - slotRadiusPx;
    const topPx = slotEntry.cy - slotRadiusPx;
    const iconDiameterPctOfSlot = slotDiameterPx > 0
      ? (slotEntry.insertD / slotDiameterPx) * 100
      : 100;

    iconDiameterTotal += iconDiameterPctOfSlot;

    slots[slotId] = {
      label: `Slot ${index + 1}`,
      cx: slotEntry.cx / layout.baseW,
      cy: slotEntry.cy / layout.baseH,
      r: slotRadiusPx / layout.baseW,
      leftPct: (leftPx / layout.baseW) * 100,
      topPct: (topPx / layout.baseH) * 100,
      sizePct: (slotDiameterPx / layout.baseW) * 100,
      coordMode: 'center',
      safeZone: {
        ...DEFAULT_SLOT_SAFE_ZONE,
        centerXPctOfSlot: 50,
        centerYPctOfSlot: 50,
        wellDiameterPctOfSlot: 100,
        ledOuterPctOfWell: 100,
        ledInnerPctOfWell: 92.5,
        iconDiameterPctOfSlot,
      },
    };
  });

  const averageIconDiameterPct = slotIds.length > 0
    ? iconDiameterTotal / slotIds.length
    : 100;

  return {
    modelCode: layout.model,
    layoutLabel: modelMeta.layoutLabel,
    columns: modelMeta.columns,
    rows: modelMeta.rows,
    aspectRatio: layout.baseW / layout.baseH,
    intrinsicSize: {
      width: layout.baseW,
      height: layout.baseH,
    },
    slotSizeMm: 15,
    slotCoordMode: 'center',
    slots,
    buttonVisual: {
      ringDiameterPctOfSlot: 100,
      iconDiameterPctOfSlot: averageIconDiameterPct,
    },
  };
}

export const PKP_2200_SI_GEOMETRY = buildGeometryFromLayout('PKP-2200-SI');
export const PKP_2300_SI_GEOMETRY = buildGeometryFromLayout('PKP-2300-SI');
export const PKP_2400_SI_GEOMETRY = buildGeometryFromLayout('PKP-2400-SI');
export const PKP_2500_SI_GEOMETRY = buildGeometryFromLayout('PKP-2500-SI');
export const PKP_2600_SI_GEOMETRY = buildGeometryFromLayout('PKP-2600-SI');
export const PKP_3500_SI_GEOMETRY = buildGeometryFromLayout('PKP-3500-SI');

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
  return sharedSortSlotIds(Object.keys(geometry.slots)) as SlotId[];
}

export function getSlotIdsForModel(modelCode: string): SlotId[] {
  return getSlotIdsForLayout(getLayoutForModel(modelCode)) as SlotId[];
}

export function inferModelCodeFromSlotCount(slotCount: number): string | null {
  return inferLayoutModelCodeFromSlotCount(slotCount);
}
