'use client';

import Link from 'next/link';

type ConfiguratorActionsProps = {
  variant: 'inline' | 'sticky';
  isComplete: boolean;
  hasVariant: boolean;
  addingToCart: boolean;
  savingToAccount: boolean;
  downloadingPdf: boolean;
  canOpenSave: boolean;
  canDownloadPdf: boolean;
  hasLoadedSavedConfig: boolean;
  onAddToCart: () => void;
  onOpenSaveModal: () => void;
  onDownloadPdf: () => void;
};

export default function ConfiguratorActions({
  variant,
  isComplete,
  hasVariant,
  addingToCart,
  savingToAccount,
  downloadingPdf,
  canOpenSave,
  canDownloadPdf,
  hasLoadedSavedConfig,
  onAddToCart,
  onOpenSaveModal,
  onDownloadPdf,
}: ConfiguratorActionsProps) {
  if (variant === 'sticky') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[75] border-t border-[#0f2c5a]/40 bg-[#061a3b]/92 px-4 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!isComplete || !hasVariant || addingToCart}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-transparent bg-[linear-gradient(90deg,#031331_0%,#0d2f63_58%,#1f59a6_100%)] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addingToCart ? 'Adding...' : 'Add To Cart'}
          </button>
          <button
            type="button"
            onClick={onOpenSaveModal}
            disabled={!isComplete || savingToAccount || !canOpenSave}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#0f3d7a] bg-white px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#0f3d7a] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {hasLoadedSavedConfig ? 'Update Save' : 'Save To Account'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!isComplete || !hasVariant || addingToCart}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-transparent bg-[linear-gradient(90deg,#031331_0%,#0d2f63_58%,#1f59a6_100%)] px-5 text-sm font-semibold uppercase tracking-[0.13em] text-white transition hover:-translate-y-[1px] hover:shadow-[0_12px_28px_rgba(8,31,64,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {addingToCart ? 'Adding...' : 'Add Configured Keypad'}
        </button>

        <button
          type="button"
          onClick={onOpenSaveModal}
          disabled={!isComplete || savingToAccount || !canOpenSave}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#0f3d7a] bg-white px-5 text-sm font-semibold uppercase tracking-[0.13em] text-[#0f3d7a] transition hover:bg-[#0f3d7a] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hasLoadedSavedConfig ? 'Update Saved Design' : 'Save To Account'}
        </button>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={!canDownloadPdf || downloadingPdf}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#0d2f63] bg-[#e8f1ff] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#0d2f63] transition hover:bg-[#d9e9ff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloadingPdf ? 'Generating...' : 'Download PDF'}
        </button>
        <Link
          href="/account"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#cdd9ec] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#5c6f90] transition hover:border-[#8ea4c8] hover:text-[#1e3355]"
        >
          Open My Saved Designs
        </Link>
      </div>
    </>
  );
}
