import type { SlotId } from '../../lib/keypadConfiguration';

export type SlotGeometry = {
  label: string;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
};

export type KeypadModelGeometry = {
  modelCode: string;
  slotSizeMm: number;
  slots: Record<SlotId, SlotGeometry>;
  buttonVisual: {
    ringDiameterPctOfSlot: number;
    iconDiameterPctOfSlot: number;
  };
};

export const PKP_2200_SI_GEOMETRY: KeypadModelGeometry = {
  modelCode: 'PKP-2200-SI',
  slotSizeMm: 15,
  slots: {
    slot_1: {
      label: 'Slot 1',
      leftPct: 22.9,
      topPct: 21.5,
      widthPct: 22,
      heightPct: 22,
    },
    slot_2: {
      label: 'Slot 2',
      leftPct: 54.3,
      topPct: 21.9,
      widthPct: 22,
      heightPct: 22,
    },
    slot_3: {
      label: 'Slot 3',
      leftPct: 23.7,
      topPct: 55.7,
      widthPct: 22,
      heightPct: 22,
    },
    slot_4: {
      label: 'Slot 4',
      leftPct: 54.1,
      topPct: 55.5,
      widthPct: 22,
      heightPct: 22,
    },
  },
  buttonVisual: {
    ringDiameterPctOfSlot: 59,
    iconDiameterPctOfSlot: 39,
  },
};
