import type { SlotId } from '../../lib/keypadConfiguration';

export type SlotCoordMode = 'center' | 'topLeft';

export type GlowPhysics = {
  defaultAlpha: number;
  thumbnailAlpha: number;
  haloNearBlurFactor: number;
  haloFarBlurFactor: number;
  haloNearBlurMin: number;
  haloFarBlurMin: number;
  intensityBase: number;
  intensityByDarkness: number;
  colorMatrixAlphaFloor: number;
  colorMatrixAlphaMultiplier: number;
  matteIconFitPct: number;
};

export type SlotSafeZone = {
  // Offsets measured inside the slot box.
  centerXPctOfSlot: number;
  centerYPctOfSlot: number;
  // Effective physical button/well diameter relative to slot box size.
  wellDiameterPctOfSlot: number;
  // LED ring band around the well radius.
  ledOuterPctOfWell: number;
  ledInnerPctOfWell: number;
  // Icon insert diameter relative to slot box size.
  iconDiameterPctOfSlot: number;
};

export type SlotGeometry = {
  label: string;
  // Normalized center and radius coordinates in the shared stage space.
  cx: number;
  cy: number;
  r: number;
  // Slot placement used by the SVG preview pipeline.
  leftPct: number;
  topPct: number;
  sizePct: number;
  coordMode?: SlotCoordMode;
  safeZone?: SlotSafeZone;
};

export type KeypadModelGeometry = {
  modelCode: string;
  aspectRatio: number;
  intrinsicSize: {
    width: number;
    height: number;
  };
  slotSizeMm: number;
  slotCoordMode: SlotCoordMode;
  slots: Record<SlotId, SlotGeometry>;
  buttonVisual: {
    ringDiameterPctOfSlot: number;
    iconDiameterPctOfSlot: number;
  };
};

export const DEFAULT_SLOT_SAFE_ZONE: SlotSafeZone = {
  centerXPctOfSlot: 50,
  centerYPctOfSlot: 50,
  wellDiameterPctOfSlot: 145,
  ledOuterPctOfWell: 94,
  ledInnerPctOfWell: 80,
  iconDiameterPctOfSlot: 60,
};

export const GLOBAL_GLOW_PHYSICS: GlowPhysics = {
  defaultAlpha: 0.46,
  thumbnailAlpha: 0.42,
  haloNearBlurFactor: 0.022,
  haloFarBlurFactor: 0.062,
  haloNearBlurMin: 1.1,
  haloFarBlurMin: 2.1,
  intensityBase: 1.1,
  intensityByDarkness: 0.55,
  colorMatrixAlphaFloor: 0.85,
  colorMatrixAlphaMultiplier: 2.25,
  matteIconFitPct: 58,
};

export function slotGeometryToPercentBox(slot: SlotGeometry) {
  return {
    leftPct: (slot.cx - slot.r) * 100,
    topPct: (slot.cy - slot.r) * 100,
    widthPct: slot.r * 200,
    heightPct: slot.r * 200,
  };
}

export const PKP_2200_SI_GEOMETRY: KeypadModelGeometry = {
  modelCode: 'PKP-2200-SI',
  // Render canvas is 1000x580.
  aspectRatio: 50 / 29,
  intrinsicSize: {
    width: 1000,
    height: 580,
  },
  slotSizeMm: 15,
  slotCoordMode: 'topLeft',
  slots: {
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
  },
  buttonVisual: {
    // Tuned against 12.4% slot boxes so ring sits on the outer grey channel
    // and matte symbols do not render undersized.
    ringDiameterPctOfSlot: 136.3,
    iconDiameterPctOfSlot: 60,
  },
};
