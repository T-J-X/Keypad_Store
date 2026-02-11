export const SLOT_IDS = ['slot_1', 'slot_2', 'slot_3', 'slot_4'] as const;

export type SlotId = (typeof SLOT_IDS)[number];

export type SlotConfigurationDraft = {
  iconId: string | null;
  color: string | null;
};

export type KeypadConfigurationDraft = Record<SlotId, SlotConfigurationDraft>;

export type SlotConfiguration = {
  iconId: string;
  color: string | null;
};

export type KeypadConfiguration = Record<SlotId, SlotConfiguration>;

const ICON_ID_PATTERN = /^[A-Za-z0-9]{3,4}$/;
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

export function createEmptyConfigurationDraft(): KeypadConfigurationDraft {
  return {
    slot_1: { iconId: null, color: null },
    slot_2: { iconId: null, color: null },
    slot_3: { iconId: null, color: null },
    slot_4: { iconId: null, color: null },
  };
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

export function isConfigurationComplete(configuration: KeypadConfigurationDraft) {
  return SLOT_IDS.every((slotId) => {
    const iconId = configuration[slotId]?.iconId;
    return typeof iconId === 'string' && iconId.length > 0 && isValidIconId(iconId);
  });
}

export function asStrictConfiguration(
  configuration: KeypadConfigurationDraft,
): KeypadConfiguration | null {
  const strictConfiguration = {} as KeypadConfiguration;

  for (const slotId of SLOT_IDS) {
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

export function serializeConfiguration(configuration: KeypadConfigurationDraft | KeypadConfiguration): string {
  const orderedConfiguration = {} as KeypadConfigurationDraft | KeypadConfiguration;
  for (const slotId of SLOT_IDS) {
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

  for (const key of payloadKeys) {
    if (!SLOT_IDS.includes(key as SlotId)) {
      return { ok: false, error: `Unexpected slot key "${key}" in configuration.` };
    }
  }

  const normalized = createEmptyConfigurationDraft();

  for (const slotId of SLOT_IDS) {
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

  if (requireComplete && !isConfigurationComplete(normalized)) {
    return {
      ok: false,
      error: 'Configuration is incomplete. All 4 slots require a valid iconId before checkout.',
    };
  }

  return { ok: true, value: normalized };
}
