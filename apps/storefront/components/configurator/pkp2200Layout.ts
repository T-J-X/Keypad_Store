import type { SlotId } from '../../lib/keypadConfiguration';

export type SlotGeometry = {
  label: string;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
};

export const PKP_2200_SI_LAYOUT: Record<SlotId, SlotGeometry> = {
  slot_1: {
    label: 'Slot 1',
    leftPct: 25,
    topPct: 23.5,
    widthPct: 23,
    heightPct: 23,
  },
  slot_2: {
    label: 'Slot 2',
    leftPct: 52,
    topPct: 23.5,
    widthPct: 23,
    heightPct: 23,
  },
  slot_3: {
    label: 'Slot 3',
    leftPct: 25,
    topPct: 51,
    widthPct: 23,
    heightPct: 23,
  },
  slot_4: {
    label: 'Slot 4',
    leftPct: 52,
    topPct: 51,
    widthPct: 23,
    heightPct: 23,
  },
};
