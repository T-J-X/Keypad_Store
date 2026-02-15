'use client';

import Link from 'next/link';
import Image from 'next/image';
import { use } from 'react';
import { Plus, X } from 'lucide-react';
import { assetUrl } from '../../lib/vendure';
import type { SlotVisualState } from '../../lib/configuratorStore';
import type { SlotId } from '../../lib/keypadConfiguration';
import type { StatusMessage } from './types';
import { KeypadContext } from './KeypadProvider';

const primarySlotButtonClass = 'btn-primary min-h-10 px-3 text-xs tracking-[0.1em] uppercase';

type ConfigurationSidebarProps = {
  slotIds?: SlotId[];
  slotLabels?: Record<string, string>;
  slots?: Record<string, SlotVisualState>;
  isComplete?: boolean;
  loadingSavedConfig?: boolean;
  iconsLoading?: boolean; // Keep for backward compat/props
  iconsError?: string | null;
  savedConfigError?: string | null;
  cartStatus?: StatusMessage | null;
  saveStatus?: StatusMessage | null;
  onOpenSlotPopup?: (slotId: SlotId) => void;
  onClearSlot?: (slotId: SlotId) => void;
  children?: React.ReactNode;
};

// --- Mobile Component: Circular Icon-Only ---
function MobileSlotItem({
  slotId,
  label,
  slot,
  isActive,
  onClick,
}: {
  slotId: string;
  label: string;
  slot: SlotVisualState;
  isActive: boolean;
  onClick: () => void;
}) {
  const isAssigned = Boolean(slot.iconId);
  const previewImage = slot.matteAssetPath ? assetUrl(slot.matteAssetPath) : null;

  if (isAssigned && previewImage) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative flex aspect-square w-full items-center justify-center transition-transform active:scale-95 ${isActive ? 'scale-105 contrast-125' : ''
          }`}
        aria-label={`Configure ${label}`}
      >
        <div className="relative h-full w-full drop-shadow-md">
          <Image
            src={previewImage}
            alt={label}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 25vw, 10vw"
          />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex aspect-square w-full items-center justify-center rounded-full border-2 border-dashed transition-all active:scale-95 ${isActive
        ? 'border-sky-500 bg-sky-50 text-sky-600'
        : 'border-white/30 bg-white/20 backdrop-blur-sm text-white/50 hover:border-white/50 hover:bg-white/30 hover:text-white/80'
        }`}
      aria-label={`Configure ${label}`}
    >
      <Plus size={24} />
    </button>
  );
}

// --- Desktop/Tablet Component: Compact Tile ---
function DesktopSlotItem({
  slotId,
  label,
  slot,
  isActive,
  onClick,
  onClear,
}: {
  slotId: string;
  label: string;
  slot: SlotVisualState;
  isActive: boolean;
  onClick: () => void;
  onClear: () => void;
}) {
  const isAssigned = Boolean(slot.iconId);
  const iconName = slot.iconName?.trim() || null;
  const iconId = slot.iconId?.trim() || null;
  const previewImage = slot.matteAssetPath ? assetUrl(slot.matteAssetPath) : null;

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border transition-all duration-300 ease-out ${isActive
        ? 'border-panel-accent ring-2 ring-panel-accent ring-offset-2 ring-offset-[#0B1221] bg-white shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)] scale-[1.02]'
        : 'border-white/10 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 hover:bg-white/95'
        }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full flex-col text-left"
      >
        <div className="flex w-full items-start justify-between p-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/40 group-hover:text-ink/60 transition-colors">
            {label}
          </span>
          {isAssigned && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onClear();
                }
              }}
              className="z-10 -mr-1 -mt-1 flex h-6 w-6 items-center justify-center rounded-full text-ink/30 hover:bg-rose-100 hover:text-rose-500 transition-colors"
              title="Clear slot"
            >
              <X size={12} />
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center py-4 min-h-[5rem]">
          {previewImage ? (
            <div className="relative h-16 w-16 transition-transform duration-300 group-hover:scale-110">
              <Image
                src={previewImage}
                alt={iconName || 'Slot icon'}
                fill
                className="object-contain"
                sizes="64px"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-ink/10 text-ink/20 opacity-70 group-hover:border-ink/20 group-hover:text-ink/40 transition-colors">
              <Plus size={20} />
            </div>
          )}
        </div>

        <div className="bg-ink/[0.02] p-3 pt-2">
          <div className="truncate text-xs font-semibold text-ink">
            {iconName || <span className="text-ink/30 italic font-normal">Select icon...</span>}
          </div>
          <div className="mt-0.5 h-3 text-[9px] font-mono text-ink/40 truncate">
            {iconId || ''}
          </div>
        </div>
      </button>
    </div>
  );
}

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
  const activeSlotId = context?.state.popupSlotId;

  // Use context for modelCode and isMobile
  const modelCode = context?.state.modelCode;
  const isMobile = context?.state.isMobile ?? false;

  const getDesktopGridClass = (code: string | undefined) => {
    switch (code) {
      case 'PKP-2300-SI': // 2x3 (6)
        return 'grid-cols-2 lg:grid-cols-3';
      case 'PKP-2400-SI': // 2x4 (8)
      case 'PKP-2600-SI': // 2x6 (12)
        return 'grid-cols-2 lg:grid-cols-4';
      case 'PKP-2500-SI': // 2x5 (10)
      case 'PKP-3500-SI': // 3x5 (15)
        return 'grid-cols-3 lg:grid-cols-5';
      default:
        // PKP-2200 (4)
        return 'grid-cols-2';
    }
  };

  const getMobileGridClass = (code: string | undefined) => {
    // Mimic keypad layout roughly, or just fit them nicely
    switch (code) {
      case 'PKP-3500-SI':
        return 'grid-cols-5'; // 5 wide
      case 'PKP-2600-SI':
      case 'PKP-2500-SI':
      case 'PKP-2400-SI':
        return 'grid-cols-4';
      case 'PKP-2300-SI':
        return 'grid-cols-3';
      default:
        return 'grid-cols-4'; // Fallback
    }
  };

  const renderHeader = () => (
    <div className={`flex flex-col gap-2 ${isMobile ? 'text-center' : 'mb-6 border-b border-white/10 pb-6'}`}>
      <h1 className={`font-semibold tracking-tight text-white ${isMobile ? 'text-xl' : 'text-3xl sm:text-4xl lg:text-5xl'}`}>
        Slot Configuration
      </h1>
      <p className={`text-panel-muted ${isMobile ? 'text-xs px-8' : 'max-w-xl text-sm'}`}>
        Tap a slot to assign an icon. {isMobile ? 'Use preview above.' : 'Drag to rotate the preview.'}
      </p>
    </div>
  );

  return (
    <section className={`relative transition-all ${isMobile ? 'px-4 pb-8 pt-0' : 'px-6 pb-20 pt-6 lg:pt-[50px]'}`}>

      {/* Desktop: Header Top */}
      {!isMobile && renderHeader()}

      {/* Grid Area */}
      {isMobile ? (
        <div className="space-y-6">
          {/* Mobile: Containerized Grid */}
          <div className="-mt-12 relative z-20 rounded-[40px] bg-white/15 backdrop-blur-md p-6 shadow-[0_32px_64px_-12px_rgba(14,17,26,0.12)] border border-white/25 ring-1 ring-white/10">
            <div className={`grid gap-4 ${getMobileGridClass(modelCode)} mx-auto max-w-sm`}>
              {resolvedSlotIds.map((slotId) => {
                const slot = resolvedSlots[slotId] ?? {};
                const label = resolvedSlotLabels?.[slotId] ?? slotId.replace('_', ' '); // Keep label for MobileSlotItem if it needs it
                const isActive = slotId === activeSlotId;

                return (
                  <MobileSlotItem
                    key={slotId}
                    slotId={slotId}
                    label={label} // Assuming label is still needed or can be removed if not used by MobileSlotItem
                    slot={slot as SlotVisualState} // Changed to value={slot} in example, but keeping original prop name for consistency with MobileSlotItem definition
                    isActive={isActive}
                    onClick={() => resolvedOnOpenSlotPopup(slotId)} // Changed to onSlotClick(slotId) in example, but keeping original prop name
                  />
                );
              })}
            </div>
          </div>


          {/* Mobile: Header Bottom */}
        </div>
      ) : (
        <div className={`grid gap-4 ${getDesktopGridClass(modelCode)}`}>
          {resolvedSlotIds.map((slotId) => {
            const slot = resolvedSlots[slotId] ?? {};
            const label = resolvedSlotLabels?.[slotId] ?? slotId.replace('_', ' ');
            const isActive = slotId === activeSlotId;

            return (
              <DesktopSlotItem
                key={slotId}
                slotId={slotId}
                label={label}
                slot={slot as SlotVisualState}
                isActive={isActive}
                onClick={() => resolvedOnOpenSlotPopup(slotId)}
                onClear={() => resolvedOnClearSlot(slotId)}
              />
            );
          })}
        </div>
      )}


      <div className="mt-8">
        {children}
      </div>

      <div className={`space-y-2 border-t border-white/10 pt-4 ${isMobile ? 'mt-4 text-center' : 'mt-6'}`}>
        {!resolvedIsComplete ? (
          <p className="text-xs font-semibold text-rose-400">
            * All {totalSlots} slots must be assigned.
          </p>
        ) : (
          <p className="text-xs font-semibold text-emerald-400">
            ✓ All slots assigned. Ready for checkout.
          </p>
        )}

        {resolvedLoadingSavedConfig && <p className="text-xs text-panel-muted">Loading saved design...</p>}
        {resolvedIconsLoading && <p className="text-xs text-panel-muted">Loading icon catalog...</p>}
        {resolvedIconsError && <p className="text-xs font-semibold text-rose-400">{resolvedIconsError}</p>}
        {resolvedSavedConfigError && <p className="text-xs font-semibold text-rose-400">{resolvedSavedConfigError}</p>}
        {resolvedCartStatus && (
          <p className={`text-sm font-semibold ${resolvedCartStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
            }`}>
            {resolvedCartStatus.message}
          </p>
        )}
        {resolvedSaveStatus && (
          <p className={`text-sm font-semibold ${resolvedSaveStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
            }`}>
            {resolvedSaveStatus.message}
          </p>
        )}
      </div>
    </section>
  );
}
