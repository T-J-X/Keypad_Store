'use client';

import { useMemo } from 'react';
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

function buildDebugSlots(origin: string): Record<SlotId, SlotVisualState> {
  return {
    slot_1: {
      ...EMPTY_SLOT,
      iconId: 'B791',
      iconName: 'Green matt',
      matteAssetPath: `${origin}/debug/inserts/b791-green-matt.png`,
      color: '#16db53',
    },
    slot_2: {
      ...EMPTY_SLOT,
      iconId: 'B790',
      iconName: 'Blue matt',
      matteAssetPath: `${origin}/debug/inserts/b790-blue-matt.png`,
      color: '#2f6dff',
    },
    slot_3: {
      ...EMPTY_SLOT,
      iconId: '003',
      iconName: 'Acc',
      matteAssetPath: `${origin}/debug/inserts/003-acc.png`,
      color: null,
    },
    slot_4: {
      ...EMPTY_SLOT,
      iconId: 'C018',
      iconName: 'Stop red matt',
      matteAssetPath: `${origin}/debug/inserts/c018-stop-red-matt.png`,
      color: '#ff2d2d',
    },
  };
}

export default function ConfiguratorRingDebugClient({ debugSlots }: { debugSlots: boolean }) {
  const origin = typeof window === 'undefined' ? 'http://127.0.0.1:3001' : window.location.origin;
  const slots = useMemo(() => buildDebugSlots(origin), [origin]);

  return (
    <div className="min-h-screen bg-[#eef2f8] px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-[1200px]">
        <KeypadPreview
          modelCode="PKP-2200-SI"
          shellAssetPath={`${origin}/debug/pkp-2200-si-shell.png`}
          slots={slots}
          activeSlotId={null}
          onSlotClick={() => {}}
          rotationDeg={0}
          debugSlots={debugSlots}
          showGlows
        />
      </div>
    </div>
  );
}
