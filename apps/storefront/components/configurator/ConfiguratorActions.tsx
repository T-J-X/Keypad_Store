'use client';

import Link from 'next/link';
import { use } from 'react';
import { KeypadContext } from './KeypadProvider';

type ConfiguratorActionsProps = {
  variant?: 'inline' | 'sticky';
  isComplete?: boolean;
  hasVariant?: boolean;
  isEditingLine?: boolean;
  addingToCart?: boolean;
  savingToAccount?: boolean;
  downloadingPdf?: boolean;
  canOpenSave?: boolean;
  canDownloadPdf?: boolean;
  hasLoadedSavedConfig?: boolean;
  onAddToCart?: () => void;
  onOpenSaveModal?: () => void;
  onDownloadPdf?: () => void;
};

type ActionFrameProps = {
  placement?: 'inline' | 'sticky';
  children: React.ReactNode;
};

type CompoundActionProps = {
  compact?: boolean;
};

const primaryActionClass = [
  'group relative isolate inline-flex items-center justify-center rounded-full border border-transparent text-white',
  'bg-[linear-gradient(90deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#203f7a_0%,#2f5da8_55%,#4b7fca_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box]',
  'transition-[background,box-shadow,transform] duration-300',
  'hover:-translate-y-[1px] hover:bg-[linear-gradient(270deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#24497d_0%,#39629a_55%,#537bb0_100%)] hover:shadow-[0_0_0_1px_rgba(72,116,194,0.56),0_10px_24px_rgba(4,15,46,0.29)]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29457A]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white/70',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

const strongGhostClass =
  'btn-ghost-strong inline-flex items-center justify-center transition hover:border-[#6d88b6] hover:bg-white/80';

const glowLayerClass =
  'pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(270deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.08)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-45';

const glowRingClass =
  'pointer-events-none absolute -inset-[1px] -z-10 rounded-full bg-[linear-gradient(90deg,rgba(11,27,58,0.44)_0%,rgba(27,52,95,0.30)_55%,rgba(58,116,198,0.30)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-55';

function PrimaryButtonLabel({ label }: { label: string }) {
  return (
    <>
      <span className={glowLayerClass} />
      <span className={glowRingClass} />
      <span className="relative z-10">{label}</span>
    </>
  );
}

function ActionFrame({
  placement = 'inline',
  children,
}: ActionFrameProps) {
  if (placement === 'sticky') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[75] border-t border-[#0f2c5a]/40 bg-[#061a3b]/92 px-4 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="mt-5 grid gap-2 sm:grid-cols-2">
      {children}
    </div>
  );
}

function AddToCartAction({ compact = false }: CompoundActionProps) {
  const context = use(KeypadContext);
  if (!context) return null;

  const { state, actions } = context;
  const isEditingLine = state.mode === 'edit-line';
  const label = state.busy.addingToCart
    ? (isEditingLine ? 'Updating...' : 'Adding...')
    : (isEditingLine ? (compact ? 'Update Cart' : 'Update Cart Line') : (compact ? 'Add To Cart' : 'Add Configured Keypad'));

  return (
    <button
      type="button"
      onClick={() => {
        void actions.addToCart();
      }}
      disabled={!state.isComplete || !state.hasVariant || state.busy.addingToCart}
      className={`${primaryActionClass} ${compact ? 'min-h-11 px-3 text-[11px] tracking-[0.11em]' : 'min-h-11 px-4 text-xs tracking-[0.12em]'} font-semibold uppercase`}
    >
      <PrimaryButtonLabel label={label} />
    </button>
  );
}

function SaveAction({ compact = false }: CompoundActionProps) {
  const context = use(KeypadContext);
  if (!context) return null;

  const { state, actions } = context;
  const label = state.hasLoadedSavedConfig
    ? (compact ? 'Update Save' : 'Update Saved Design')
    : 'Save To Account';

  return (
    <button
      type="button"
      onClick={actions.openSaveModal}
      disabled={!state.isComplete || state.busy.savingToAccount || !state.canOpenSaveAction}
      className={`${primaryActionClass} ${compact ? 'min-h-11 px-3 text-[11px] tracking-[0.11em]' : 'min-h-11 px-4 text-xs tracking-[0.12em]'} font-semibold uppercase`}
    >
      <PrimaryButtonLabel label={label} />
    </button>
  );
}

function DownloadPdfAction() {
  const context = use(KeypadContext);
  if (!context) return null;

  const { state, actions } = context;
  return (
    <button
      type="button"
      onClick={() => {
        void actions.downloadPdf();
      }}
      disabled={!state.canDownloadPdf || state.busy.downloadingPdf}
      className={`${strongGhostClass} min-h-11 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#0d2f63] disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {state.busy.downloadingPdf ? 'Generating...' : 'Download PDF'}
    </button>
  );
}

function SavedDesignsAction() {
  return (
    <Link
      href="/account"
      className={`${strongGhostClass} min-h-11 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#5c6f90] hover:text-[#1e3355]`}
    >
      Open My Saved Designs
    </Link>
  );
}

function ConfiguratorActionsRoot({
  variant = 'inline',
  isComplete,
  hasVariant,
  isEditingLine,
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
  const context = use(KeypadContext);
  if (context) {
    if (variant === 'sticky') {
      return (
        <ActionFrame placement="sticky">
          <AddToCartAction compact />
          <SaveAction compact />
        </ActionFrame>
      );
    }

    return (
      <>
        <ActionFrame placement="inline">
          <AddToCartAction />
          <SaveAction />
        </ActionFrame>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <DownloadPdfAction />
          <SavedDesignsAction />
        </div>
      </>
    );
  }

  const resolvedIsComplete = Boolean(isComplete);
  const resolvedHasVariant = Boolean(hasVariant);
  const resolvedIsEditingLine = Boolean(isEditingLine);
  const resolvedAddingToCart = Boolean(addingToCart);
  const resolvedSavingToAccount = Boolean(savingToAccount);
  const resolvedDownloadingPdf = Boolean(downloadingPdf);
  const resolvedCanOpenSave = Boolean(canOpenSave);
  const resolvedCanDownloadPdf = Boolean(canDownloadPdf);
  const resolvedHasLoadedSavedConfig = Boolean(hasLoadedSavedConfig);

  if (variant === 'sticky') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[75] border-t border-[#0f2c5a]/40 bg-[#061a3b]/92 px-4 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!resolvedIsComplete || !resolvedHasVariant || resolvedAddingToCart}
            className={`${primaryActionClass} min-h-11 px-3 text-[11px] font-semibold uppercase tracking-[0.11em]`}
          >
            <PrimaryButtonLabel
              label={resolvedAddingToCart ? (resolvedIsEditingLine ? 'Updating...' : 'Adding...') : (resolvedIsEditingLine ? 'Update Cart' : 'Add To Cart')}
            />
          </button>
          <button
            type="button"
            onClick={onOpenSaveModal}
            disabled={!resolvedIsComplete || resolvedSavingToAccount || !resolvedCanOpenSave}
            className={`${primaryActionClass} min-h-11 px-3 text-[11px] font-semibold uppercase tracking-[0.11em]`}
          >
            <PrimaryButtonLabel label={resolvedHasLoadedSavedConfig ? 'Update Save' : 'Save To Account'} />
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
          disabled={!resolvedIsComplete || !resolvedHasVariant || resolvedAddingToCart}
          className={`${primaryActionClass} min-h-11 px-4 text-xs font-semibold uppercase tracking-[0.12em]`}
        >
          <PrimaryButtonLabel
            label={resolvedAddingToCart
              ? (resolvedIsEditingLine ? 'Updating...' : 'Adding...')
              : (resolvedIsEditingLine ? 'Update Cart Line' : 'Add Configured Keypad')}
          />
        </button>

        <button
          type="button"
          onClick={onOpenSaveModal}
          disabled={!resolvedIsComplete || resolvedSavingToAccount || !resolvedCanOpenSave}
          className={`${primaryActionClass} min-h-11 px-4 text-xs font-semibold uppercase tracking-[0.12em]`}
        >
          <PrimaryButtonLabel label={resolvedHasLoadedSavedConfig ? 'Update Saved Design' : 'Save To Account'} />
        </button>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={!resolvedCanDownloadPdf || resolvedDownloadingPdf}
          className={`${strongGhostClass} min-h-11 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#0d2f63] disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {resolvedDownloadingPdf ? 'Generating...' : 'Download PDF'}
        </button>
        <Link
          href="/account"
          className={`${strongGhostClass} min-h-11 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#5c6f90] hover:text-[#1e3355]`}
        >
          Open My Saved Designs
        </Link>
      </div>
    </>
  );
}

const ConfiguratorActions = Object.assign(ConfiguratorActionsRoot, {
  Frame: ActionFrame,
  AddToCart: AddToCartAction,
  Save: SaveAction,
  DownloadPdf: DownloadPdfAction,
  SavedDesigns: SavedDesignsAction,
});

export default ConfiguratorActions;
