import {
  buildSlotsFromCenterPercents,
  DEFAULT_BUTTON_VISUAL,
  DEFAULT_SLOT_SAFE_ZONE,
  type KeypadModelGeometry,
  type SlotGeometry,
} from '../shared';

const PKP_2500_SI_SLOT_SIZE_PCT = (76 / 1001) * 100;
const PKP_2500_VISUAL_Y_SHIFT_PCT = 0;
const PKP_2500_SI_BASE_SLOTS = buildSlotsFromCenterPercents(
  [
    // Runtime-shell aligned centers for /assets/source/a5/pkp-2500-si.png.
    // (This shell differs subtly from local PKP-2500-SI.png, so use runtime-aligned centers.)
    { xPct: 11.5884, yPct: 26.2693 }, // slot_1
    { xPct: 30.6693, yPct: 26.4901 }, // slot_2
    { xPct: 49.7502, yPct: 26.4901 }, // slot_3
    { xPct: 68.8312, yPct: 26.4901 }, // slot_4
    { xPct: 87.9121, yPct: 26.4901 }, // slot_5
    { xPct: 11.7882, yPct: 75.9382 }, // slot_6
    { xPct: 30.7692, yPct: 75.7174 }, // slot_7
    { xPct: 49.8501, yPct: 75.7174 }, // slot_8
    { xPct: 68.8312, yPct: 75.7174 }, // slot_9
    { xPct: 87.7123, yPct: 75.7174 }, // slot_10
  ].map((point) => ({
    ...point,
    yPct: point.yPct + PKP_2500_VISUAL_Y_SHIFT_PCT,
  })),
  PKP_2500_SI_SLOT_SIZE_PCT,
);
const PKP_2500_SI_WELL_DIAMETER_PCT_OF_SLOT = 122;
const PKP_2500_SI_SLOTS: Record<string, SlotGeometry> = Object.fromEntries(
  Object.entries(PKP_2500_SI_BASE_SLOTS).map(([slotId, slot]) => [
    slotId,
    {
      ...slot,
      safeZone: {
        ...DEFAULT_SLOT_SAFE_ZONE,
        ...(slot.safeZone ?? {}),
        wellDiameterPctOfSlot: PKP_2500_SI_WELL_DIAMETER_PCT_OF_SLOT,
      },
    },
  ]),
);

export const PKP_2500_SI_GEOMETRY: KeypadModelGeometry = {
  modelCode: 'PKP-2500-SI',
  layoutLabel: '2x5',
  columns: 5,
  rows: 2,
  aspectRatio: 1420 / 580,
  intrinsicSize: {
    width: 1420,
    height: 580,
  },
  slotSizeMm: 15,
  slotCoordMode: 'topLeft',
  slots: PKP_2500_SI_SLOTS,
  buttonVisual: {
    ...DEFAULT_BUTTON_VISUAL,
  },
};
