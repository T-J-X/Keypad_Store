import {
  buildSlotsFromCenterPercents,
  DEFAULT_BUTTON_VISUAL,
  type KeypadModelGeometry,
} from '../shared';

const PKP_2400_SI_SLOT_SIZE_PCT = 10.9;

const PKP_2400_SI_SLOTS = buildSlotsFromCenterPercents(
  [
    { xPct: 13.7, yPct: 18.0 }, // slot_1
    { xPct: 38.1, yPct: 16.2 }, // slot_2
    { xPct: 61.8, yPct: 16.9 }, // slot_3
    { xPct: 84.1, yPct: 16.2 }, // slot_4
    { xPct: 13.2, yPct: 75.7 }, // slot_5
    { xPct: 38.2, yPct: 74.8 }, // slot_6
    { xPct: 61.9, yPct: 74.7 }, // slot_7
    { xPct: 84.8, yPct: 74.9 }, // slot_8
  ],
  PKP_2400_SI_SLOT_SIZE_PCT,
);

export const PKP_2400_SI_GEOMETRY: KeypadModelGeometry = {
  modelCode: 'PKP-2400-SI',
  layoutLabel: '2x4',
  columns: 4,
  rows: 2,
  aspectRatio: 1320 / 580,
  intrinsicSize: {
    width: 1320,
    height: 580,
  },
  slotSizeMm: 15,
  slotCoordMode: 'topLeft',
  slots: PKP_2400_SI_SLOTS,
  buttonVisual: {
    ...DEFAULT_BUTTON_VISUAL,
  },
};
