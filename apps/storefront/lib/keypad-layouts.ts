export type Slot = {
  id: string;
  cx: number;
  cy: number;
  insertD: number;
  bezelD: number;
};

export type ModelLayout = {
  model: string;
  baseW: number;
  baseH: number;
  slots: Slot[];
};

const DEFAULT_MODEL_CODE = 'PKP-2200-SI';

function slot(id: string, cx: number, cy: number, insertD: number, bezelD: number): Slot {
  return {
    id,
    cx,
    cy,
    insertD,
    bezelD,
  };
}

export const KEYPAD_LAYOUTS: Record<string, ModelLayout> = {
  'PKP-2200-SI': {
    model: 'PKP-2200-SI',
    baseW: 1000,
    baseH: 580,
    slots: [
      slot('slot_1', 375, 145.52, 116.56, 169.01),
      slot('slot_2', 625, 146.68, 116.56, 169.01),
      slot('slot_3', 378, 439.58, 116.56, 169.01),
      slot('slot_4', 623, 437.84, 116.56, 169.01),
    ],
  },
  'PKP-2300-SI': {
    model: 'PKP-2300-SI',
    baseW: 1000,
    baseH: 580,
    slots: [
      slot('slot_1', 252.5, 121.05, 111.39, 161.52),
      slot('slot_2', 501.5, 122.03, 111.39, 161.52),
      slot('slot_3', 745.5, 122.03, 111.39, 161.52),
      slot('slot_4', 256.5, 415.05, 111.39, 161.52),
      slot('slot_5', 502.5, 414.06, 111.39, 161.52),
      slot('slot_6', 744.5, 415.05, 111.39, 161.52),
    ],
  },
  'PKP-2400-SI': {
    model: 'PKP-2400-SI',
    baseW: 1000,
    baseH: 580,
    slots: [
      slot('slot_1', 143, 151, 76, 90),
      slot('slot_2', 382, 152, 76, 90),
      slot('slot_3', 618, 155, 76, 90),
      slot('slot_4', 855, 149, 76, 90),
      slot('slot_5', 148, 433, 76, 90),
      slot('slot_6', 384, 433, 76, 90),
      slot('slot_7', 619, 431, 76, 90),
      slot('slot_8', 855, 432, 76, 90),
    ],
  },
  'PKP-2500-SI': {
    model: 'PKP-2500-SI',
    baseW: 1001,
    baseH: 453,
    slots: [
      slot('slot_1', 116, 119, 76, 87.16),
      slot('slot_2', 308, 120, 76, 87.16),
      slot('slot_3', 500, 121, 76, 87.16),
      slot('slot_4', 693, 121, 76, 87.16),
      slot('slot_5', 884, 120, 76, 87.16),
      slot('slot_6', 119, 345, 76, 87.16),
      slot('slot_7', 310, 345, 76, 87.16),
      slot('slot_8', 501, 344, 76, 87.16),
      slot('slot_9', 692, 344, 76, 87.16),
      slot('slot_10', 882, 344, 76, 87.16),
    ],
  },
  'PKP-2600-SI': {
    model: 'PKP-2600-SI',
    baseW: 1000,
    baseH: 383,
    slots: [
      slot('slot_1', 96.5, 97.5, 65, 74.54),
      slot('slot_2', 257.5, 98.5, 65, 74.54),
      slot('slot_3', 418.5, 99.5, 65, 74.54),
      slot('slot_4', 580.5, 99.5, 65, 74.54),
      slot('slot_5', 742.5, 99.5, 65, 74.54),
      slot('slot_6', 903.5, 99.5, 65, 74.54),
      slot('slot_7', 97.5, 292.5, 65, 74.54),
      slot('slot_8', 258.5, 291.5, 65, 74.54),
      slot('slot_9', 419.5, 291.5, 65, 74.54),
      slot('slot_10', 581.5, 291.5, 65, 74.54),
      slot('slot_11', 742.5, 291.5, 65, 74.54),
      slot('slot_12', 901.5, 291.5, 65, 74.54),
    ],
  },
  'PKP-3500-SI': {
    model: 'PKP-3500-SI',
    baseW: 1000,
    baseH: 688,
    slots: [
      slot('slot_1', 110, 114, 62, 90),
      slot('slot_2', 302, 115, 62, 90),
      slot('slot_3', 495, 115, 62, 90),
      slot('slot_4', 687, 117, 62, 90),
      slot('slot_5', 879, 115, 62, 90),
      slot('slot_6', 111, 341, 62, 90),
      slot('slot_7', 302, 342, 62, 90),
      slot('slot_8', 495, 343, 62, 90),
      slot('slot_9', 686, 344, 62, 90),
      slot('slot_10', 878, 343, 62, 90),
      slot('slot_11', 113, 573, 62, 90),
      slot('slot_12', 304, 573, 62, 90),
      slot('slot_13', 496, 572, 62, 90),
      slot('slot_14', 686, 573, 62, 90),
      slot('slot_15', 876, 572, 62, 90),
    ],
  },
};

function slotIdToIndex(slotId: string) {
  const match = slotId.match(/^slot_(\d+)$/i);
  if (!match) return Number.POSITIVE_INFINITY;
  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return parsed;
}

function sortSlots(slots: Slot[]) {
  return [...slots].sort((left, right) => slotIdToIndex(left.id) - slotIdToIndex(right.id));
}

export function hasLayoutForModel(modelCode: string | null | undefined): boolean {
  const normalized = (modelCode ?? '').trim().toUpperCase();
  return Boolean(normalized && KEYPAD_LAYOUTS[normalized]);
}

export function getLayoutForModel(modelCode: string | null | undefined): ModelLayout {
  const normalized = (modelCode ?? '').trim().toUpperCase();
  const layout = KEYPAD_LAYOUTS[normalized] ?? KEYPAD_LAYOUTS[DEFAULT_MODEL_CODE];

  return {
    ...layout,
    slots: sortSlots(layout.slots),
  };
}

export function cloneModelLayout(layout: ModelLayout): ModelLayout {
  return {
    model: layout.model,
    baseW: layout.baseW,
    baseH: layout.baseH,
    slots: layout.slots.map((slotEntry) => ({ ...slotEntry })),
  };
}

export function getSlotIdsForLayout(layout: ModelLayout): string[] {
  return sortSlots(layout.slots).map((slotEntry) => slotEntry.id);
}

export function getSlotIdsForLayoutModel(modelCode: string | null | undefined): string[] {
  return getSlotIdsForLayout(getLayoutForModel(modelCode));
}

export function inferLayoutModelCodeFromSlotCount(slotCount: number): string | null {
  if (!Number.isFinite(slotCount) || slotCount <= 0) return null;

  const match = Object.values(KEYPAD_LAYOUTS).find((layout) => layout.slots.length === slotCount);
  return match?.model ?? null;
}
