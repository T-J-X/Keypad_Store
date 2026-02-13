export const SLOT_IDS = ['slot_1', 'slot_2', 'slot_3', 'slot_4'] as const;

export type SlotId = `slot_${number}`;

export type SlotConfigurationDraft = {
  iconId: string | null;
  color: string | null;
};

export type KeypadConfigurationDraft = Record<string, SlotConfigurationDraft>;

export type SlotConfiguration = {
  iconId: string;
  color: string | null;
};

export type KeypadConfiguration = Record<string, SlotConfiguration>;

const ICON_ID_PATTERN = /^[A-Za-z0-9]{3,4}$/;
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;
const SLOT_ID_PATTERN = /^slot_(\d+)$/i;

function slotIdToIndex(slotId: string) {
  const match = slotId.match(SLOT_ID_PATTERN);
  if (!match) return Number.POSITIVE_INFINITY;
  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return parsed;
}

export function isSlotId(value: string): value is SlotId {
  return SLOT_ID_PATTERN.test(value);
}

export function sortSlotIds(slotIds: readonly string[]): SlotId[] {
  const unique = Array.from(new Set(slotIds.filter((slotId): slotId is SlotId => isSlotId(slotId))));
  unique.sort((left, right) => slotIdToIndex(left) - slotIdToIndex(right));
  return unique;
}

export function getOrderedSlotIdsFromConfiguration(configuration: unknown): SlotId[] {
  if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) {
    return [];
  }
  return sortSlotIds(Object.keys(configuration as Record<string, unknown>));
}

function resolveSlotIds(
  slotIds: readonly string[] | undefined,
  fallbackSlotIds: readonly string[] = SLOT_IDS,
) {
  const normalized = sortSlotIds(slotIds ?? []);
  if (normalized.length > 0) return normalized;
  return sortSlotIds(fallbackSlotIds);
}

export function createEmptyConfigurationDraft(slotIds: readonly string[] = SLOT_IDS): KeypadConfigurationDraft {
  const draft: KeypadConfigurationDraft = {};
  for (const slotId of resolveSlotIds(slotIds)) {
    draft[slotId] = { iconId: null, color: null };
  }
  return draft;
}

export function isValidIconId(value: string) {
  return ICON_ID_PATTERN.test(value);
}

export function normalizeRingColor(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toUpperCase();
  return HEX_COLOR_PATTERN.test(normalized) ? normalized : null;
}

export function isConfigurationComplete(
  configuration: KeypadConfigurationDraft,
  slotIds?: readonly string[],
) {
  const keys = resolveSlotIds(slotIds, getOrderedSlotIdsFromConfiguration(configuration));
  return keys.every((slotId) => {
    const iconId = configuration[slotId]?.iconId;
    return typeof iconId === 'string' && iconId.length > 0 && isValidIconId(iconId);
  });
}

export function asStrictConfiguration(
  configuration: KeypadConfigurationDraft,
  slotIds?: readonly string[],
): KeypadConfiguration | null {
  const keys = resolveSlotIds(slotIds, getOrderedSlotIdsFromConfiguration(configuration));
  const strictConfiguration: KeypadConfiguration = {};

  for (const slotId of keys) {
    const slot = configuration[slotId];
    const iconId = typeof slot?.iconId === 'string' ? slot.iconId.trim() : '';
    if (!iconId || !isValidIconId(iconId)) {
      return null;
    }

    strictConfiguration[slotId] = {
      iconId,
      color: normalizeRingColor(slot?.color),
    };
  }

  return strictConfiguration;
}

export function serializeConfiguration(
  configuration: KeypadConfigurationDraft | KeypadConfiguration,
  slotIds?: readonly string[],
): string {
  const keys = resolveSlotIds(slotIds, getOrderedSlotIdsFromConfiguration(configuration));
  const orderedConfiguration: KeypadConfigurationDraft | KeypadConfiguration = {};
  for (const slotId of keys) {
    const slot = configuration[slotId];
    orderedConfiguration[slotId] = {
      iconId: slot?.iconId ?? null,
      color: normalizeRingColor(slot?.color),
    };
  }
  return JSON.stringify(orderedConfiguration);
}

type ValidationResult =
  | {
      ok: true;
      value: KeypadConfigurationDraft;
    }
  | {
      ok: false;
      error: string;
    };

export function validateAndNormalizeConfigurationInput(
  input: unknown,
  options: {
    requireComplete?: boolean;
    slotIds?: readonly string[];
  } = {},
): ValidationResult {
  const requireComplete = options.requireComplete ?? false;

  let parsed: unknown = input;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return { ok: false, error: 'Configuration must be valid JSON.' };
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Configuration must be an object keyed by slot IDs.' };
  }

  const payload = parsed as Record<string, unknown>;
  const payloadKeys = Object.keys(payload);

  const nonSlotKeys = payloadKeys.filter((key) => !isSlotId(key));
  if (nonSlotKeys.length > 0) {
    return { ok: false, error: `Unexpected key "${nonSlotKeys[0]}" in configuration.` };
  }

  const expectedSlotIds = sortSlotIds(options.slotIds ?? []);
  const payloadSlotIds = sortSlotIds(payloadKeys);
  const slotIds = expectedSlotIds.length > 0 ? expectedSlotIds : payloadSlotIds;

  if (slotIds.length === 0) {
    return { ok: false, error: 'Configuration must include at least one slot entry.' };
  }

  if (expectedSlotIds.length > 0) {
    for (const key of payloadSlotIds) {
      if (!expectedSlotIds.includes(key)) {
        return { ok: false, error: `Unexpected slot key "${key}" in configuration.` };
      }
    }
  }

  const normalized = createEmptyConfigurationDraft(slotIds);

  for (const slotId of slotIds) {
    if (!(slotId in payload)) {
      return { ok: false, error: `Missing required slot "${slotId}" in configuration.` };
    }

    const rawSlot = payload[slotId];
    if (!rawSlot || typeof rawSlot !== 'object' || Array.isArray(rawSlot)) {
      return { ok: false, error: `Slot "${slotId}" must be an object with iconId and color.` };
    }

    const slot = rawSlot as Record<string, unknown>;
    const rawIconId = slot.iconId;

    if (rawIconId == null || rawIconId === '') {
      normalized[slotId].iconId = null;
    } else if (typeof rawIconId === 'string') {
      const iconId = rawIconId.trim();
      if (!iconId || !isValidIconId(iconId)) {
        return { ok: false, error: `Slot "${slotId}" has an invalid iconId.` };
      }
      normalized[slotId].iconId = iconId;
    } else {
      return { ok: false, error: `Slot "${slotId}" iconId must be a string.` };
    }

    const normalizedColor = normalizeRingColor(slot.color);
    if (slot.color != null && slot.color !== '' && normalizedColor == null) {
      return { ok: false, error: `Slot "${slotId}" has an invalid color. Use #RRGGBB.` };
    }
    normalized[slotId].color = normalizedColor;
  }

  if (requireComplete && !isConfigurationComplete(normalized, slotIds)) {
    return {
      ok: false,
      error: `Configuration is incomplete. All ${slotIds.length} slots require a valid iconId before checkout.`,
    };
  }

  return { ok: true, value: normalized };
}
