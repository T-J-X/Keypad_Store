import { sortSlotIds as sharedSortSlotIds } from './shared';
import type { KeypadModelGeometry, SlotId } from './shared';
import { PKP_2200_SI_GEOMETRY } from './models/pkp2200';
import { PKP_2300_SI_GEOMETRY } from './models/pkp2300';
import { PKP_2400_SI_GEOMETRY } from './models/pkp2400';
import { PKP_2500_SI_GEOMETRY } from './models/pkp2500';
import { PKP_2600_SI_GEOMETRY } from './models/pkp2600';
import { PKP_3500_SI_GEOMETRY } from './models/pkp3500';

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

export {
  PKP_2200_SI_GEOMETRY,
  PKP_2300_SI_GEOMETRY,
  PKP_2400_SI_GEOMETRY,
  PKP_2500_SI_GEOMETRY,
  PKP_2600_SI_GEOMETRY,
  PKP_3500_SI_GEOMETRY,
};

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
  return getSlotIdsForGeometry(getGeometryForModel(modelCode));
}

export function inferModelCodeFromSlotCount(slotCount: number): string | null {
  if (!Number.isFinite(slotCount) || slotCount <= 0) return null;

  const match = Object.values(KEYPAD_MODEL_GEOMETRIES).find(
    (geometry) => getSlotIdsForGeometry(geometry).length === slotCount,
  );

  return match?.modelCode ?? null;
}
