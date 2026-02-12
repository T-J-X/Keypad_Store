'use client';

import Link from 'next/link';
import type { SlotVisualState } from '../../lib/configuratorStore';
import { SLOT_IDS, type SlotId } from '../../lib/keypadConfiguration';
import { PKP_2200_SI_LAYOUT } from './pkp2200Layout';
import type { StatusMessage } from './types';

const primarySlotButtonClass = [
  'group relative isolate inline-flex min-h-10 min-w-[112px] items-center justify-center rounded-full border border-transparent px-3 text-xs font-semibold uppercase tracking-[0.1em] text-white',
  'bg-[linear-gradient(90deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#203f7a_0%,#2f5da8_55%,#4b7fca_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box]',
  'transition-[background,box-shadow,transform] duration-300',
  'hover:-translate-y-[1px] hover:bg-[linear-gradient(270deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#24497d_0%,#39629a_55%,#537bb0_100%)] hover:shadow-[0_0_0_1px_rgba(72,116,194,0.56),0_10px_24px_rgba(4,15,46,0.29)]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29457A]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80',
].join(' ');

const strongGhostButtonClass =
  'btn-ghost-strong inline-flex min-h-10 items-center justify-center px-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#1f3a64] transition hover:border-[#6d88b6] hover:bg-white/85 hover:text-[#14335c]';

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
    <section className="card-soft relative border-white/30 bg-white/70 p-5 shadow-[0_24px_48px_rgba(6,22,47,0.2)] backdrop-blur-xl sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-[#10223f]">Slot Configuration</h2>
      <p className="mt-1 text-sm text-[#324a71]">
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
              className="flex items-center justify-between rounded-2xl border border-[#b8c8df]/80 bg-white/76 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),inset_0_-6px_14px_rgba(18,40,72,0.07),0_10px_22px_rgba(13,35,67,0.12)]"
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
                  className={primarySlotButtonClass}
                >
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(270deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.08)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-45" />
                  <span className="pointer-events-none absolute -inset-[1px] -z-10 rounded-full bg-[linear-gradient(90deg,rgba(11,27,58,0.44)_0%,rgba(27,52,95,0.30)_55%,rgba(58,116,198,0.30)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-55" />
                  <span className="relative z-10">{isAssigned ? 'Edit insert' : 'Choose insert'}</span>
                </button>
                {isAssigned ? (
                  <button
                    type="button"
                    onClick={() => onClearSlot(slotId)}
                    className={strongGhostButtonClass}
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
        <Link href="/cart" className="btn-ghost-strong inline-flex min-h-10 items-center px-4 text-sm font-semibold text-[#0f3d7a]">
          Review cart
        </Link>
      </div>
    </section>
  );
}
