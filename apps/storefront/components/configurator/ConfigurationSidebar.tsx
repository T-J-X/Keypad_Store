'use client';

import Link from 'next/link';
import type { SlotVisualState } from '../../lib/configuratorStore';
import { SLOT_IDS, type SlotId } from '../../lib/keypadConfiguration';
import { PKP_2200_SI_LAYOUT } from './pkp2200Layout';
import type { StatusMessage } from './types';

export default function ConfigurationSidebar({
  slots,
  isComplete,
  loadingSavedConfig,
  iconsLoading,
  iconsError,
  savedConfigError,
  cartStatus,
  saveStatus,
  onOpenSlotPopup,
  onClearSlot,
  children,
}: {
  slots: Record<SlotId, SlotVisualState>;
  isComplete: boolean;
  loadingSavedConfig: boolean;
  iconsLoading: boolean;
  iconsError: string | null;
  savedConfigError: string | null;
  cartStatus: StatusMessage | null;
  saveStatus: StatusMessage | null;
  onOpenSlotPopup: (slotId: SlotId) => void;
  onClearSlot: (slotId: SlotId) => void;
  children?: React.ReactNode;
}) {
  return (
    <section className="card relative border border-white/20 bg-[linear-gradient(180deg,#f7fbff_0%,#ebf2ff_100%)] p-5 shadow-[0_18px_36px_rgba(6,22,47,0.24)] sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-[#10223f]">Slot Configuration</h2>
      <p className="mt-1 text-sm text-[#3a4e72]">
        Each slot requires a valid alphanumeric icon ID before checkout and account save.
      </p>

      <div className="mt-4 space-y-2">
        {SLOT_IDS.map((slotId) => {
          const slot = slots[slotId];
          const label = PKP_2200_SI_LAYOUT[slotId].label;
          const isAssigned = Boolean(slot.iconId);
          const iconName = slot.iconName?.trim() || null;
          const iconId = slot.iconId?.trim() || null;

          return (
            <div
              key={slotId}
              className="flex items-center justify-between rounded-2xl border border-[#d5e2f5] bg-white px-3 py-3 shadow-[0_6px_14px_rgba(17,42,85,0.08)]"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4c648a]">{label}</div>
                <div className="mt-1 truncate text-sm font-semibold text-[#0f2241]">{iconName || 'Empty'}</div>
                <div className="mt-0.5 text-xs text-[#4d5f7f]">{iconId ? `ID ${iconId}` : 'No insert selected'}</div>
                <div className="mt-0.5 text-xs text-[#4d5f7f]">{slot.color ? `Ring ${slot.color}` : 'No glow'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenSlotPopup(slotId)}
                  className="inline-flex min-h-10 min-w-[112px] items-center justify-center rounded-full border border-[#1c4f95] bg-[linear-gradient(180deg,#f5faff_0%,#edf5ff_100%)] px-3 text-xs font-semibold text-[#0f3d7a] transition hover:border-[#0f3d7a] hover:bg-[linear-gradient(180deg,#ebf4ff_0%,#dcecff_100%)]"
                >
                  {isAssigned ? 'Edit insert' : 'Choose insert'}
                </button>
                {isAssigned ? (
                  <button
                    type="button"
                    onClick={() => onClearSlot(slotId)}
                    className="inline-flex min-h-10 min-w-[80px] items-center justify-center rounded-full border border-[#c8d8ef] bg-white px-3 text-xs font-semibold text-[#5c6f90] transition hover:border-[#8ea4c8] hover:bg-[#f6f9ff] hover:text-[#1e3355]"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {children}

      {!isComplete ? (
        <p className="mt-2 text-xs font-semibold text-[#8a2f2f]">
          All 4 slots must be filled before Add to cart and Save to account.
        </p>
      ) : null}

      {loadingSavedConfig ? <p className="mt-3 text-xs text-[#445f89]">Loading saved design...</p> : null}
      {iconsLoading ? <p className="mt-3 text-xs text-[#445f89]">Loading icon catalog...</p> : null}
      {iconsError ? <p className="mt-3 text-xs font-semibold text-rose-700">{iconsError}</p> : null}
      {savedConfigError ? <p className="mt-3 text-xs font-semibold text-rose-700">{savedConfigError}</p> : null}
      {cartStatus ? (
        <p className={cartStatus.type === 'success' ? 'mt-3 text-sm font-semibold text-[#123f2f]' : 'mt-3 text-sm font-semibold text-rose-700'}>
          {cartStatus.message}
        </p>
      ) : null}
      {saveStatus ? (
        <p className={saveStatus.type === 'success' ? 'mt-3 text-sm font-semibold text-[#123f2f]' : 'mt-3 text-sm font-semibold text-rose-700'}>
          {saveStatus.message}
        </p>
      ) : null}
      <div className="mt-4">
        <Link href="/cart" className="text-sm font-semibold text-[#0f3d7a] underline underline-offset-4">
          Review cart
        </Link>
      </div>
    </section>
  );
}
