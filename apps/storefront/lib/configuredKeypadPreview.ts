import type { IconCatalogItem } from './configuratorCatalog';
import {
  createEmptyConfigurationDraft,
  validateAndNormalizeConfigurationInput,
  type KeypadConfigurationDraft,
} from './keypadConfiguration';

export type ConfiguredIconLookupEntry = {
  iconId: string;
  matteAssetPath: string | null;
  category: string | null;
};

export type ConfiguredIconLookup = Map<string, ConfiguredIconLookupEntry>;
export type ConfiguredIconPayloadItem = {
  iconId: string;
  matteAssetPath: string | null;
  categories: string[];
};

export function buildConfiguredIconLookup(icons: IconCatalogItem[]): ConfiguredIconLookup {
  const lookup: ConfiguredIconLookup = new Map();

  for (const icon of icons) {
    const iconId = icon.iconId;
    if (!iconId || lookup.has(iconId)) continue;

    lookup.set(iconId, {
      iconId,
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
      name: icon.iconId,
      sku: null,
      categories: icon.categories ?? [],
      sizeMm: null,
      glossyAssetPath: null,
      matteAssetPath: icon.matteAssetPath,
    })),
  );
}

export function parseConfigurationForPreview(input: unknown): KeypadConfigurationDraft | null {
  const parsed = validateAndNormalizeConfigurationInput(input, { requireComplete: false });
  if (!parsed.ok) return null;
  return parsed.value;
}

export function countConfiguredSlots(configuration: KeypadConfigurationDraft | null): number {
  if (!configuration) return 0;

  let count = 0;
  for (const slot of Object.values(configuration)) {
    if (typeof slot.iconId === 'string' && slot.iconId.trim().length > 0) {
      count += 1;
    }
  }

  return count;
}

export function emptyPreviewConfiguration(): KeypadConfigurationDraft {
  return createEmptyConfigurationDraft();
}
