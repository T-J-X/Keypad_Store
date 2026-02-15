import { ProductService, type RequestContext } from '@vendure/core';

const SLOT_ID_PATTERN = /^slot_(\d+)$/i;

export type SlotId = `slot_${number}`;

export type SlotConfiguration = {
  iconId: string;
  color: string | null;
};

export type StrictConfiguration = Record<SlotId, SlotConfiguration> & {
  _meta?: { rotation?: number };
};

const ICON_ID_PATTERN = /^[A-Za-z0-9]{3,4}$/;
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;
const ICON_ID_CACHE_TTL_MS = 60_000;
const ICON_PAGE_SIZE = 100;

type IconIdCacheValue = {
  expiresAt: number;
  iconIds: Set<string>;
};

const iconIdCache = new Map<string, IconIdCacheValue>();

export class ConfigurationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationValidationError';
  }
}

function isSlotId(value: string): value is SlotId {
  return SLOT_ID_PATTERN.test(value);
}

function slotIdToIndex(slotId: string) {
  const match = slotId.match(SLOT_ID_PATTERN);
  if (!match) return Number.POSITIVE_INFINITY;
  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return parsed;
}

function sortSlotIds(slotIds: string[]): SlotId[] {
  const unique = Array.from(new Set(slotIds.filter((slotId): slotId is SlotId => isSlotId(slotId))));
  unique.sort((left, right) => slotIdToIndex(left) - slotIdToIndex(right));
  return unique;
}

export function parseAndValidateStrictConfiguration(
  raw: string,
  label = 'Configuration',
): StrictConfiguration {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConfigurationValidationError(`${label} must be valid JSON.`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ConfigurationValidationError(`${label} must be an object keyed by slot IDs.`);
  }

  const payload = parsed as Record<string, unknown>;
  const payloadKeys = Object.keys(payload);
  const nonSlotKeys = payloadKeys.filter((key) => !isSlotId(key) && key !== '_meta');
  if (nonSlotKeys.length > 0) {
    throw new ConfigurationValidationError(`Unexpected slot key "${nonSlotKeys[0]}" in configuration.`);
  }

  const slotIds = sortSlotIds(payloadKeys);
  if (slotIds.length === 0) {
    throw new ConfigurationValidationError(`${label} must include at least one slot entry.`);
  }

  const strictConfiguration = {} as StrictConfiguration;
  for (const slotId of slotIds) {
    const rawSlot = payload[slotId];
    if (!rawSlot || typeof rawSlot !== 'object' || Array.isArray(rawSlot)) {
      throw new ConfigurationValidationError(`Slot "${slotId}" must be an object with iconId and color.`);
    }

    const slot = rawSlot as Record<string, unknown>;
    const iconId = typeof slot.iconId === 'string' ? slot.iconId.trim() : '';
    if (!iconId || !ICON_ID_PATTERN.test(iconId)) {
      throw new ConfigurationValidationError(`Slot "${slotId}" has an invalid iconId.`);
    }

    let color: string | null = null;
    if (slot.color != null && slot.color !== '') {
      if (typeof slot.color !== 'string') {
        throw new ConfigurationValidationError(`Slot "${slotId}" has an invalid color. Use #RRGGBB.`);
      }

      const normalizedColor = slot.color.trim().toUpperCase();
      if (!HEX_COLOR_PATTERN.test(normalizedColor)) {
        throw new ConfigurationValidationError(`Slot "${slotId}" has an invalid color. Use #RRGGBB.`);
      }
      color = normalizedColor;
    }

    strictConfiguration[slotId] = {
      iconId,
      color,
    };
  }

  if (payload._meta && typeof payload._meta === 'object') {
    strictConfiguration._meta = payload._meta as { rotation?: number };
  }

  return strictConfiguration;
}

export async function findMissingIconIds(
  ctx: RequestContext,
  productService: ProductService,
  configuration: StrictConfiguration,
): Promise<string[]> {
  const requiredIconIds = new Set<string>();

  const slotIds = sortSlotIds(Object.keys(configuration));
  for (const slotId of slotIds) {
    requiredIconIds.add(configuration[slotId].iconId);
  }

  if (requiredIconIds.size === 0) {
    return [];
  }

  const availableIconIds = await getAvailableIconIds(ctx, productService);
  return Array.from(requiredIconIds).filter((iconId) => !availableIconIds.has(iconId));
}

async function getAvailableIconIds(ctx: RequestContext, productService: ProductService): Promise<Set<string>> {
  const channelKey = String(ctx.channelId ?? 'default');
  const now = Date.now();

  const cached = iconIdCache.get(channelKey);
  if (cached && cached.expiresAt > now) {
    return cached.iconIds;
  }

  const iconIds = new Set<string>();
  let skip = 0;

  while (true) {
    const page = await productService.findAll(
      ctx,
      {
        take: ICON_PAGE_SIZE,
        skip,
        filter: {
          isIconProduct: {
            eq: true,
          },
        },
      } as never,
      ['variants'],
    );

    const items = page.items ?? [];
    for (const product of items as Array<{
      customFields?: { iconId?: unknown };
      variants?: Array<{ customFields?: { iconId?: unknown } }>;
    }>) {
      const productIconId = normalizeIconId(product.customFields?.iconId);
      if (productIconId) {
        iconIds.add(productIconId);
      }

      for (const variant of product.variants ?? []) {
        const variantIconId = normalizeIconId(variant.customFields?.iconId);
        if (variantIconId) {
          iconIds.add(variantIconId);
        }
      }
    }

    const nextSkip = skip + items.length;
    if (items.length === 0 || nextSkip >= page.totalItems) {
      break;
    }
    skip = nextSkip;
  }

  iconIdCache.set(channelKey, {
    expiresAt: now + ICON_ID_CACHE_TTL_MS,
    iconIds,
  });

  return iconIds;
}

function normalizeIconId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const iconId = value.trim();
  if (!iconId || !ICON_ID_PATTERN.test(iconId)) return null;
  return iconId;
}
