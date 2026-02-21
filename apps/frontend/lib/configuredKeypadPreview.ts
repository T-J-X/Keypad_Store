import type { IconCatalogItem } from './configuratorCatalog';
import {
  createEmptyConfigurationDraft,
  getOrderedSlotIdsFromConfiguration,
  validateAndNormalizeConfigurationInput,
  type KeypadConfigurationDraft,
} from './keypadConfiguration';
import {
  KEYPAD_MODEL_GEOMETRIES,
  getSlotIdsForModel,
  inferModelCodeFromSlotCount,
} from '../config/layouts/geometry';

export type ConfiguredIconLookupEntry = {
  iconId: string;
  iconName: string;
  matteAssetPath: string | null;
  category: string | null;
};

export type ConfiguredIconLookup = Map<string, ConfiguredIconLookupEntry>;
type ConfiguredIconPayloadItem = {
  iconId: string;
  name?: string;
  matteAssetPath: string | null;
  categories: string[];
};

function buildConfiguredIconLookup(icons: IconCatalogItem[]): ConfiguredIconLookup {
  const lookup: ConfiguredIconLookup = new Map();

  for (const icon of icons) {
    const iconId = icon.iconId;
    if (!iconId || lookup.has(iconId)) continue;

    lookup.set(iconId, {
      iconId,
      iconName: icon.name || icon.iconId,
      matteAssetPath: icon.matteAssetPath,
      category: icon.categories[0] ?? null,
    });
  }

  return lookup;
}

export function buildConfiguredIconLookupFromPayload(
  icons: ConfiguredIconPayloadItem[],
): ConfiguredIconLookup {
  return buildConfiguredIconLookup(
    icons.map((icon) => ({
      id: icon.iconId,
      productId: '',
      variantId: '',
      iconId: icon.iconId,
      name: icon.name || icon.iconId,
      sku: null,
      categories: icon.categories ?? [],
      sizeMm: null,
      glossyAssetPath: null,
      matteAssetPath: icon.matteAssetPath,
    })),
  );
}

export function parseConfigurationForPreview(input: unknown): KeypadConfigurationDraft | null {
  let slotSource: unknown = input;
  if (typeof input === 'string') {
    try {
      slotSource = JSON.parse(input);
    } catch {
      slotSource = null;
    }
  }

  const slotIds = getOrderedSlotIdsFromConfiguration(slotSource);
  const parsed = validateAndNormalizeConfigurationInput(input, {
    requireComplete: false,
    slotIds,
  });
  if (!parsed.ok) return null;
  return parsed.value;
}

export function countConfiguredSlots(configuration: KeypadConfigurationDraft | null): number {
  if (!configuration) return 0;

  const slotIds = getOrderedSlotIdsFromConfiguration(configuration);
  let count = 0;
  for (const slotId of slotIds) {
    const slot = configuration[slotId];
    if (slot && typeof slot.iconId === 'string' && slot.iconId.trim().length > 0) {
      count += 1;
    }
  }

  return count;
}

export function emptyPreviewConfiguration(): KeypadConfigurationDraft {
  return createEmptyConfigurationDraft();
}

export function resolvePreviewSlotIds({
  modelCode,
  configuration,
}: {
  modelCode?: string | null;
  configuration?: KeypadConfigurationDraft | null;
}) {
  const normalizedModelCode = (modelCode ?? '').trim().toUpperCase();
  if (normalizedModelCode && KEYPAD_MODEL_GEOMETRIES[normalizedModelCode]) {
    return getSlotIdsForModel(normalizedModelCode);
  }

  const configuredSlotCount = getOrderedSlotIdsFromConfiguration(configuration ?? {});
  if (configuredSlotCount.length > 0) {
    const inferredModelCode = inferModelCodeFromSlotCount(configuredSlotCount.length);
    if (inferredModelCode) {
      return getSlotIdsForModel(inferredModelCode);
    }
    return configuredSlotCount;
  }

  return getSlotIdsForModel('PKP-2200-SI');
}
