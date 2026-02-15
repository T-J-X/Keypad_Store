import {
  DEFAULT_BUTTON_VISUAL,
  DEFAULT_SLOT_SAFE_ZONE,
  type KeypadModelGeometry,
  type SlotGeometry,
} from '../shared';

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
    ...DEFAULT_BUTTON_VISUAL,
  },
};
