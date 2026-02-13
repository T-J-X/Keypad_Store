import {
  buildSlotsFromCenterPercents,
  DEFAULT_BUTTON_VISUAL,
  type KeypadModelGeometry,
} from '../shared';

const PKP_2300_SI_SLOT_SIZE_PCT = 11.85;

const PKP_2300_SI_SLOTS = buildSlotsFromCenterPercents(
  [
    // Slot-by-slot from PKP-2300-SI.psd, transformed to this shell's render frame.
    { xPct: 25.25, yPct: 20.87 }, // slot_1
    { xPct: 50.15, yPct: 21.04 }, // slot_2
    { xPct: 74.55, yPct: 21.04 }, // slot_3
    { xPct: 25.65, yPct: 71.56 }, // slot_4
    { xPct: 50.25, yPct: 71.39 }, // slot_5
    { xPct: 74.45, yPct: 71.56 }, // slot_6
  ],
  PKP_2300_SI_SLOT_SIZE_PCT,
);

export const PKP_2300_SI_GEOMETRY: KeypadModelGeometry = {
  modelCode: 'PKP-2300-SI',
  layoutLabel: '2x3',
  columns: 3,
  rows: 2,
  aspectRatio: 1200 / 580,
  intrinsicSize: {
    width: 1200,
    height: 580,
  },
  slotSizeMm: 15,
  slotCoordMode: 'topLeft',
  slots: PKP_2300_SI_SLOTS,
  buttonVisual: {
    ...DEFAULT_BUTTON_VISUAL,
  },
};
