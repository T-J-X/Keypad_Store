'use client';

import { create } from 'zustand';
import type { IconCatalogItem } from './configuratorCatalog';
import {
  createEmptyConfigurationDraft,
  normalizeRingColor,
  sortSlotIds,
  SLOT_IDS,
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
  slotIds: SlotId[];
  activeSlotId: SlotId | null;
  slots: Record<string, SlotVisualState>;
  setActiveSlotId: (slotId: SlotId | null) => void;
  selectIconForSlot: (slotId: SlotId, icon: IconCatalogItem) => void;
  setSlotGlowColor: (slotId: SlotId, color: string | null) => void;
  hydrateFromSavedConfiguration: (
    configuration: KeypadConfigurationDraft,
    iconCatalog: IconCatalogItem[],
    slotIds?: readonly string[],
  ) => void;
  clearSlot: (slotId: SlotId) => void;
  reset: (modelCode: string, slotIds?: readonly string[]) => void;
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

function resolveSlotIds(slotIds?: readonly string[]) {
  return sortSlotIds(slotIds ?? SLOT_IDS);
}

function createEmptySlots(slotIds?: readonly string[]): Record<string, SlotVisualState> {
  const keys = resolveSlotIds(slotIds);
  return keys.reduce<Record<string, SlotVisualState>>((accumulator, slotId) => {
    accumulator[slotId] = createEmptySlot();
    return accumulator;
  }, {});
}

export function buildConfigurationDraftFromSlots(
  slots: Record<string, SlotVisualState>,
  slotIds?: readonly string[],
): KeypadConfigurationDraft {
  const keys = resolveSlotIds(slotIds ?? Object.keys(slots));
  const draft = createEmptyConfigurationDraft(keys);

  for (const slotId of keys) {
    draft[slotId] = {
      iconId: slots[slotId]?.iconId ?? null,
      color: normalizeRingColor(slots[slotId]?.color),
    };
  }

  return draft;
}

export const useConfiguratorStore = create<ConfiguratorStoreState>((set) => ({
  modelCode: 'PKP-2200-SI',
  slotIds: resolveSlotIds(),
  activeSlotId: null,
  slots: createEmptySlots(resolveSlotIds()),
  setActiveSlotId: (slotId) => {
    set({ activeSlotId: slotId });
  },
  selectIconForSlot: (slotId, icon) => {
    set((state) => ({
      slots: {
        ...state.slots,
        [slotId]: {
          ...(state.slots[slotId] ?? createEmptySlot()),
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
          ...(state.slots[slotId] ?? createEmptySlot()),
          color: normalizeRingColor(color),
        },
      },
    }));
  },
  hydrateFromSavedConfiguration: (configuration, iconCatalog, slotIds) => {
    const iconsById = new Map(iconCatalog.map((icon) => [icon.iconId, icon]));
    const keys = resolveSlotIds(slotIds ?? Object.keys(configuration));

    set((state) => {
      const nextSlots = createEmptySlots(keys);

      for (const slotId of keys) {
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
        modelCode: state.modelCode,
        slotIds: keys,
        slots: nextSlots,
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
  reset: (modelCode, slotIds) => {
    const keys = resolveSlotIds(slotIds);
    set({
      modelCode,
      slotIds: keys,
      activeSlotId: null,
      slots: createEmptySlots(keys),
    });
  },
}));
