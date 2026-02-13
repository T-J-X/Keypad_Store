import {
  buildSlotsFromCenterPercents,
  DEFAULT_BUTTON_VISUAL,
  DEFAULT_SLOT_SAFE_ZONE,
  type KeypadModelGeometry,
  type SlotGeometry,
} from '../shared';

const PKP_2600_SI_SLOT_SIZE_PCT = (65 / 1000) * 100;
const PKP_2600_VISUAL_Y_SHIFT_PCT = 0;
const PKP_2600_SI_BASE_SLOTS = buildSlotsFromCenterPercents(
  [
    // Exact slot centers from PKP-2600-SI.psd layer bounds.
    { xPct: 9.65, yPct: 25.4569 }, // slot_1
    { xPct: 25.75, yPct: 25.718 }, // slot_2
    { xPct: 41.85, yPct: 25.9791 }, // slot_3
    { xPct: 58.05, yPct: 25.9791 }, // slot_4
    { xPct: 74.25, yPct: 25.9791 }, // slot_5
    { xPct: 90.35, yPct: 25.9791 }, // slot_6
    { xPct: 9.75, yPct: 76.3708 }, // slot_7
    { xPct: 25.85, yPct: 76.1097 }, // slot_8
    { xPct: 41.95, yPct: 76.1097 }, // slot_9
    { xPct: 58.15, yPct: 76.1097 }, // slot_10
    { xPct: 74.25, yPct: 76.1097 }, // slot_11
    { xPct: 90.15, yPct: 76.1097 }, // slot_12
  ].map((point) => ({
    ...point,
    yPct: point.yPct + PKP_2600_VISUAL_Y_SHIFT_PCT,
  })),
  PKP_2600_SI_SLOT_SIZE_PCT,
);
const PKP_2600_SI_WELL_DIAMETER_PCT_OF_SLOT = 122;
const PKP_2600_SI_SLOTS: Record<string, SlotGeometry> = Object.fromEntries(
  Object.entries(PKP_2600_SI_BASE_SLOTS).map(([slotId, slot]) => [
    slotId,
    {
      ...slot,
      safeZone: {
        ...DEFAULT_SLOT_SAFE_ZONE,
        ...(slot.safeZone ?? {}),
        wellDiameterPctOfSlot: PKP_2600_SI_WELL_DIAMETER_PCT_OF_SLOT,
      },
    },
  ]),
);

export const PKP_2600_SI_GEOMETRY: KeypadModelGeometry = {
  modelCode: 'PKP-2600-SI',
  layoutLabel: '2x6',
  columns: 6,
  rows: 2,
  aspectRatio: 1540 / 580,
  intrinsicSize: {
    width: 1540,
    height: 580,
  },
  slotSizeMm: 15,
  slotCoordMode: 'topLeft',
  slots: PKP_2600_SI_SLOTS,
  buttonVisual: {
    ...DEFAULT_BUTTON_VISUAL,
  },
};
