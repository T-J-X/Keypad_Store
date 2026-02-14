'use client';

import { useMemo } from 'react';
import { getLayoutForModel, hasLayoutForModel } from '../../lib/keypad-layouts';
import KeypadPreview from './KeypadPreview';
import type { SlotVisualState } from '../../lib/configuratorStore';
import type { SlotId } from '../../lib/keypadConfiguration';

const EMPTY_SLOT: SlotVisualState = {
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

const DEBUG_SHELL_BY_MODEL: Record<string, string> = {
  'PKP-2200-SI': '/debug/pkp-2200-si-shell.png',
  'PKP-2400-SI': '/debug/pkp-2400-si-shell.png',
  'PKP-2500-SI': '/debug/pkp-2500-si-shell.png',
  'PKP-2600-SI': '/debug/pkp-2600-si-shell.png',
  'PKP-3500-SI': '/debug/pkp-3500-si-shell.png',
};

function resolveDebugModelCode(input: string | null | undefined) {
  const normalized = (input ?? '').trim().toUpperCase();
  if (normalized && hasLayoutForModel(normalized)) return normalized;
  return 'PKP-2200-SI';
}

function buildDebugSlots(modelCode: string): Record<SlotId, SlotVisualState> {
  const layout = getLayoutForModel(modelCode);
  return layout.slots.reduce<Record<SlotId, SlotVisualState>>((map, slotEntry) => {
    map[slotEntry.id as SlotId] = {
      ...EMPTY_SLOT,
    };
    return map;
  }, {});
}

function resolveShellPath(modelCode: string) {
  return DEBUG_SHELL_BY_MODEL[modelCode] ?? DEBUG_SHELL_BY_MODEL['PKP-2200-SI'];
}

export default function ConfiguratorRingDebugClient({
  debugMode,
  editMode = false,
  modelCode = 'PKP-2200-SI',
  shellAssetPath = null,
}: {
  debugMode: boolean;
  editMode?: boolean;
  modelCode?: string;
  shellAssetPath?: string | null;
}) {
  const origin = typeof window === 'undefined' ? 'http://127.0.0.1:3001' : window.location.origin;
  const resolvedModelCode = useMemo(() => resolveDebugModelCode(modelCode), [modelCode]);
  const slots = useMemo(() => buildDebugSlots(resolvedModelCode), [resolvedModelCode]);
  const shellPath = useMemo(() => {
    if (shellAssetPath) return shellAssetPath;
    return `${origin}${resolveShellPath(resolvedModelCode)}`;
  }, [origin, resolvedModelCode, shellAssetPath]);

  return (
    <div className="min-h-screen bg-[#eef2f8] px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-[1200px]">
        <KeypadPreview
          modelCode={resolvedModelCode}
          shellAssetPath={shellPath}
          slots={slots}
          activeSlotId={null}
          onSlotClick={() => {}}
          rotationDeg={0}
          debugMode={debugMode}
          editMode={editMode}
          showGlows
        />
      </div>
    </div>
  );
}
