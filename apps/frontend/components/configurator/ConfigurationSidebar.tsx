'use client';

import Link from 'next/link';
import { use } from 'react';
import type { SlotVisualState } from '../../lib/configuratorStore';
import type { SlotId } from '../../lib/keypadConfiguration';
import type { StatusMessage } from './types';
import { KeypadContext } from './KeypadProvider';

const primarySlotButtonClass = 'btn-primary min-h-10 px-3 text-xs tracking-[0.1em] uppercase';

const strongGhostButtonClass =
  'btn-secondary dark min-h-10 items-center justify-center px-3 text-xs uppercase tracking-[0.1em]';

type ConfigurationSidebarProps = {
  slotIds?: SlotId[];
  slotLabels?: Record<string, string>;
  slots?: Record<string, SlotVisualState>;
  isComplete?: boolean;
  loadingSavedConfig?: boolean;
  iconsLoading?: boolean;
  iconsError?: string | null;
  savedConfigError?: string | null;
  cartStatus?: StatusMessage | null;
  saveStatus?: StatusMessage | null;
  onOpenSlotPopup?: (slotId: SlotId) => void;
  onClearSlot?: (slotId: SlotId) => void;
  children?: React.ReactNode;
};

export default function ConfigurationSidebar({
  slotIds,
  slotLabels,
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
}: ConfigurationSidebarProps) {
  const context = use(KeypadContext);
  const resolvedSlotIds = slotIds ?? context?.state.slotIds ?? [];
  const resolvedSlotLabels = slotLabels ?? context?.state.slotLabels ?? {};
  const resolvedSlots = slots ?? context?.state.slots ?? {};
  const resolvedIsComplete = isComplete ?? context?.state.isComplete ?? false;
  const resolvedLoadingSavedConfig = loadingSavedConfig ?? context?.state.busy.loadingSavedConfig ?? false;
  const resolvedIconsLoading = iconsLoading ?? context?.state.busy.iconsLoading ?? false;
  const resolvedIconsError = iconsError ?? context?.state.iconsError ?? null;
  const resolvedSavedConfigError = savedConfigError ?? context?.state.savedConfigError ?? null;
  const resolvedCartStatus = cartStatus ?? context?.state.cartStatus ?? null;
  const resolvedSaveStatus = saveStatus ?? context?.state.saveStatus ?? null;
  const resolvedOnOpenSlotPopup = onOpenSlotPopup ?? context?.actions.openSlot ?? (() => { });
  const resolvedOnClearSlot = onClearSlot ?? context?.actions.clearSlot ?? (() => { });
  const totalSlots = resolvedSlotIds.length;

  return (
    <section className="card-soft relative p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-[#10223f]">Slot Configuration</h2>
      <p className="mt-1 text-sm text-[#324a71]">
        Each slot requires a valid alphanumeric icon ID before checkout and account save.
      </p>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-2">
        {resolvedSlotIds.map((slotId) => {
          const slot = resolvedSlots[slotId] ?? {
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
          const label = resolvedSlotLabels?.[slotId] ?? slotId.replace('_', ' ');
          const isAssigned = Boolean(slot.iconId);
          const iconName = slot.iconName?.trim() || null;
          const iconId = slot.iconId?.trim() || null;

          return (
            <div
              key={slotId}
              className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-alt/50 px-3 py-3 ring-1 ring-inset ring-transparent transition-all hover:bg-surface-alt hover:shadow-soft"
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
                  onClick={() => resolvedOnOpenSlotPopup(slotId)}
                  className={primarySlotButtonClass}
                  aria-label={`${isAssigned ? 'Edit' : 'Choose'} insert for ${label}`}
                >
                  <span className="relative z-10">{isAssigned ? 'Edit insert' : 'Choose insert'}</span>
                </button>
                {isAssigned ? (
                  <button
                    type="button"
                    onClick={() => resolvedOnClearSlot(slotId)}
                    className={strongGhostButtonClass}
                    aria-label={`Clear insert for ${label}`}
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

      {!resolvedIsComplete ? (
        <p className="mt-2 text-xs font-semibold text-[#8a2f2f]">
          All {totalSlots} slots must be filled before Add to cart and Save to account.
        </p>
      ) : null}

      {resolvedLoadingSavedConfig ? <p className="mt-3 text-xs text-[#445f89]">Loading saved design...</p> : null}
      {resolvedIconsLoading ? <p className="mt-3 text-xs text-[#445f89]">Loading icon catalog...</p> : null}
      {resolvedIconsError ? <p className="mt-3 text-xs font-semibold text-rose-700">{resolvedIconsError}</p> : null}
      {resolvedSavedConfigError ? <p className="mt-3 text-xs font-semibold text-rose-700">{resolvedSavedConfigError}</p> : null}
      {resolvedCartStatus ? (
        <p className={resolvedCartStatus.type === 'success' ? 'mt-3 text-sm font-semibold text-[#123f2f]' : 'mt-3 text-sm font-semibold text-rose-700'}>
          {resolvedCartStatus.message}
        </p>
      ) : null}
      {resolvedSaveStatus ? (
        <p className={resolvedSaveStatus.type === 'success' ? 'mt-3 text-sm font-semibold text-[#123f2f]' : 'mt-3 text-sm font-semibold text-rose-700'}>
          {resolvedSaveStatus.message}
        </p>
      ) : null}
      <div className="mt-4">
        <Link href="/cart" className="btn-secondary dark inline-flex min-h-10 items-center justify-center px-4 w-full sm:w-auto text-sm font-semibold">
          Review cart
        </Link>
      </div>
    </section>
  );
}
