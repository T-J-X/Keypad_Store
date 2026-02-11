'use client';

import { create } from 'zustand';
import type { IconCatalogItem } from './configuratorCatalog';
import {
  createEmptyConfigurationDraft,
  normalizeRingColor,
  type KeypadConfigurationDraft,
  type SlotId,
} from './keypadConfiguration';

export type SlotVisualState = {
  iconId: string | null;
  iconName: string | null;
  matteAssetPath: string | null;
  glossyAssetPath: string | null;
  productId: string | null;
  variantId: string | null;
  category: string | null;
  sizeMm: number | null;
  color: string | null;
};

type ConfiguratorStoreState = {
  modelCode: string;
  activeSlotId: SlotId | null;
  slots: Record<SlotId, SlotVisualState>;
  setActiveSlotId: (slotId: SlotId | null) => void;
  selectIconForSlot: (slotId: SlotId, icon: IconCatalogItem) => void;
  setSlotGlowColor: (slotId: SlotId, color: string | null) => void;
  hydrateFromSavedConfiguration: (
    configuration: KeypadConfigurationDraft,
    iconCatalog: IconCatalogItem[],
  ) => void;
  clearSlot: (slotId: SlotId) => void;
  reset: (modelCode: string) => void;
};

function createEmptySlot(): SlotVisualState {
  return {
    iconId: null,
    iconName: null,
    matteAssetPath: null,
    glossyAssetPath: null,
    productId: null,
    variantId: null,
    category: null,
    sizeMm: null,
    color: null,
  };
}

function createEmptySlots(): Record<SlotId, SlotVisualState> {
  return {
    slot_1: createEmptySlot(),
    slot_2: createEmptySlot(),
    slot_3: createEmptySlot(),
    slot_4: createEmptySlot(),
  };
}

export function buildConfigurationDraftFromSlots(
  slots: Record<SlotId, SlotVisualState>,
): KeypadConfigurationDraft {
  const draft = createEmptyConfigurationDraft();

  for (const slotId of Object.keys(draft) as SlotId[]) {
    draft[slotId] = {
      iconId: slots[slotId]?.iconId ?? null,
      color: normalizeRingColor(slots[slotId]?.color),
    };
  }

  return draft;
}

export const useConfiguratorStore = create<ConfiguratorStoreState>((set) => ({
  modelCode: 'PKP-2200-SI',
  activeSlotId: null,
  slots: createEmptySlots(),
  setActiveSlotId: (slotId) => {
    set({ activeSlotId: slotId });
  },
  selectIconForSlot: (slotId, icon) => {
    set((state) => ({
      slots: {
        ...state.slots,
        [slotId]: {
          ...state.slots[slotId],
          iconId: icon.iconId,
          iconName: icon.name,
          matteAssetPath: icon.matteAssetPath,
          glossyAssetPath: icon.glossyAssetPath,
          productId: icon.productId,
          variantId: icon.variantId,
          category: icon.categories[0] ?? 'Uncategorised',
          sizeMm: icon.sizeMm,
        },
      },
    }));
  },
  setSlotGlowColor: (slotId, color) => {
    set((state) => ({
      slots: {
        ...state.slots,
        [slotId]: {
          ...state.slots[slotId],
          color: normalizeRingColor(color),
        },
      },
    }));
  },
  hydrateFromSavedConfiguration: (configuration, iconCatalog) => {
    const iconsById = new Map(iconCatalog.map((icon) => [icon.iconId, icon]));

    set((state) => {
      const nextSlots = createEmptySlots();

      for (const slotId of Object.keys(nextSlots) as SlotId[]) {
        const savedSlot = configuration[slotId];
        const iconId = typeof savedSlot?.iconId === 'string' ? savedSlot.iconId.trim() : '';
        const matchedIcon = iconId ? iconsById.get(iconId) : undefined;

        nextSlots[slotId] = {
          iconId: iconId || null,
          iconName: matchedIcon?.name ?? null,
          matteAssetPath: matchedIcon?.matteAssetPath ?? null,
          glossyAssetPath: matchedIcon?.glossyAssetPath ?? null,
          productId: matchedIcon?.productId ?? null,
          variantId: matchedIcon?.variantId ?? null,
          category: matchedIcon?.categories[0] ?? null,
          sizeMm: matchedIcon?.sizeMm ?? null,
          color: normalizeRingColor(savedSlot?.color),
        };
      }

      return {
        slots: {
          ...state.slots,
          ...nextSlots,
        },
      };
    });
  },
  clearSlot: (slotId) => {
    set((state) => ({
      slots: {
        ...state.slots,
        [slotId]: createEmptySlot(),
      },
    }));
  },
  reset: (modelCode) => {
    set({ modelCode, activeSlotId: null, slots: createEmptySlots() });
  },
}));
