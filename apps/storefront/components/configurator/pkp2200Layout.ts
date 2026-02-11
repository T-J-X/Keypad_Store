import { PKP_2200_SI_GEOMETRY, type SlotGeometry } from '../../config/layouts/geometry';
import type { SlotId } from '../../lib/keypadConfiguration';

export type { SlotGeometry };

export const PKP_2200_SI_LAYOUT: Record<SlotId, SlotGeometry> = PKP_2200_SI_GEOMETRY.slots;
export const PKP_2200_SI_SLOT_SIZE_MM = PKP_2200_SI_GEOMETRY.slotSizeMm;
