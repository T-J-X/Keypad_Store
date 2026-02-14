import {
  sortSlotIds as sharedSortSlotIds,
} from './shared';
import type {
  KeypadModelGeometry,
  SlotId,
} from './shared';
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

export const KEYPAD_MODEL_GEOMETRIES: Readonly<Record<string, KeypadModelGeometry>> = Object.freeze({
  [PKP_2200_SI_GEOMETRY.modelCode]: PKP_2200_SI_GEOMETRY,
  [PKP_2300_SI_GEOMETRY.modelCode]: PKP_2300_SI_GEOMETRY,
  [PKP_2400_SI_GEOMETRY.modelCode]: PKP_2400_SI_GEOMETRY,
  [PKP_2500_SI_GEOMETRY.modelCode]: PKP_2500_SI_GEOMETRY,
  [PKP_2600_SI_GEOMETRY.modelCode]: PKP_2600_SI_GEOMETRY,
  [PKP_3500_SI_GEOMETRY.modelCode]: PKP_3500_SI_GEOMETRY,
});

export function getGeometryForModel(modelCode: string) {
  const normalized = modelCode.trim().toUpperCase();
  return KEYPAD_MODEL_GEOMETRIES[normalized] ?? PKP_2200_SI_GEOMETRY;
}

export function getSlotIdsForGeometry(geometry: KeypadModelGeometry): SlotId[] {
  return sharedSortSlotIds(Object.keys(geometry.slots)) as SlotId[];
}

export function getSlotIdsForModel(modelCode: string): SlotId[] {
  return getSlotIdsForGeometry(getGeometryForModel(modelCode));
}

export function inferModelCodeFromSlotCount(slotCount: number): string | null {
  if (slotCount === 4) return 'PKP-2200-SI';
  if (slotCount === 6) return 'PKP-2300-SI';
  if (slotCount === 8) return 'PKP-2400-SI';
  if (slotCount === 10) return 'PKP-2500-SI';
  if (slotCount === 12) return 'PKP-2600-SI';
  if (slotCount === 15) return 'PKP-3500-SI';
  return null;
}
