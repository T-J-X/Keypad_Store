'use client';

import Link from 'next/link';
import Image from 'next/image';
import { use } from 'react';
import { assetUrl } from '../../lib/vendure';
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

  const modelCode = context?.state.modelCode;

  const getGridClass = (code: string | undefined) => {
    switch (code) {
      case 'PKP-2300-SI':
        return 'xl:grid-cols-3';
      case 'PKP-2400-SI':
      case 'PKP-2600-SI':
        return 'xl:grid-cols-4';
      case 'PKP-2500-SI':
      case 'PKP-3500-SI':
        return 'xl:grid-cols-5';
      default:
        // Default (e.g. 2200) fits nicely in 2 cols
        return 'xl:grid-cols-2';
    }
  };

  return (
    <section className="card-soft relative py-[50px] px-6">
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#10223f] sm:text-5xl">Slot Configuration</h1>
      <p className="mt-16 text-sm text-[#324a71]">
        Each slot requires a valid alphanumeric icon ID before checkout and account save.
      </p>

      <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 ${getGridClass(modelCode)}`}>
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
          const previewImage = slot.matteAssetPath ? assetUrl(slot.matteAssetPath) : null;

          return (
            <div
              key={slotId}
              className="group flex flex-col justify-between rounded-xl border border-surface-border bg-white transition-all hover:shadow-soft overflow-hidden"
            >
              {/* Top Section: Header & Preview */}
              <button
                type="button"
                onClick={() => resolvedOnOpenSlotPopup(slotId)}
                className="relative block w-full border-b border-surface-border/50 bg-surface-alt/30 transition-colors hover:bg-surface-alt/60 text-left"
              >
                <div className="absolute left-3 top-3 z-10">
                  <div className="text-xl font-bold uppercase tracking-[0.14em] text-[#4c648a] transition-colors group-hover:text-sky">{label}</div>
                </div>

                <div className={`flex w-full items-center justify-center ${modelCode === 'PKP-2200-SI' ? 'h-32 p-4' : 'h-48 pt-14 pb-4 px-4'}`}>
                  {previewImage ? (
                    <div className="relative h-full w-full transition-transform duration-500 group-hover:scale-105">
                      <Image
                        src={previewImage}
                        alt={`Slot ${label} - ${iconName}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 opacity-30 transition-opacity group-hover:opacity-50">
                      <div className="h-12 w-12 rounded-full border-2 border-dashed border-current" />
                      <span className="text-xs uppercase tracking-wider font-medium">Empty</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Middle Section: Details */}
              <div className="flex flex-1 flex-col p-3">
                <div className="min-h-[2.5rem]">
                  <div className="truncate text-sm font-semibold text-[#0f2241]">
                    {iconName || <span className="text-ink-subtle italic opacity-50">Select an insert</span>}
                  </div>
                  {isAssigned ? (
                    <div className="font-mono text-[10px] text-[#4d5f7f] mt-0.5">ID: {iconId}</div>
                  ) : (
                    <div className="text-[10px] text-ink-subtle mt-0.5">No ID assigned</div>
                  )}
                </div>

                {slot.color && (
                  <div className="mt-2 text-[10px] font-medium text-[#4d5f7f]">
                    Glow: <span className="text-ink">{slot.color}</span>
                  </div>
                )}
              </div>

              {/* Bottom Section: Actions */}
              <div className="flex items-center gap-2 border-t border-surface-border p-2 bg-surface-alt/20">
                <button
                  type="button"
                  onClick={() => resolvedOnOpenSlotPopup(slotId)}
                  className="btn-premium min-h-[32px] h-8 w-full justify-center text-[10px] uppercase tracking-wider shadow-sm hover:shadow-md"
                  aria-label={`${isAssigned ? 'Change' : 'Choose'} insert for ${label}`}
                >
                  {isAssigned ? 'Change' : 'Choose'}
                </button>
                {isAssigned && (
                  <button
                    type="button"
                    onClick={() => resolvedOnClearSlot(slotId)}
                    className="h-8 w-8 flex items-center justify-center rounded-md text-ink-subtle hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    aria-label={`Clear insert for ${label}`}
                    title="Clear slot"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                )}
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

    </section>
  );
}
