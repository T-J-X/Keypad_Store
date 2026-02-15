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

const primaryActionClass = 'btn-premium';

const strongGhostClass = 'btn-secondary dark justify-center';



function PrimaryButtonLabel({ label }: { label: string }) {
  return <span className="relative z-10">{label}</span>;
}

function ActionFrame({
  placement = 'inline',
  children,
}: ActionFrameProps) {
  if (placement === 'sticky') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[75] border-t border-panel-border bg-panel/95 px-4 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
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
}: ConfiguratorActionsProps) {
  const context = use(KeypadContext);
  if (!context) return null;

  const { state, actions } = context;

  const resolvedAddingToCart = state.busy.addingToCart;
  const resolvedIsEditingLine = state.mode === 'edit-line';
  const resolvedIsComplete = state.isComplete;
  const resolvedHasVariant = state.hasVariant;
  const resolvedSavingToAccount = state.busy.savingToAccount;
  const resolvedCanOpenSave = state.canOpenSaveAction;
  const resolvedHasLoadedSavedConfig = state.hasLoadedSavedConfig;
  const resolvedCanDownloadPdf = state.canDownloadPdf;
  const resolvedDownloadingPdf = state.busy.downloadingPdf;

  const onAddToCart = () => {
    void actions.addToCart();
  };

  const onOpenSaveModal = () => {
    actions.openSaveModal();
  };

  const onDownloadPdf = () => {
    void actions.downloadPdf();
  };

  if (variant === 'sticky') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[75] border-t border-panel-border bg-panel/95 px-4 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!resolvedIsComplete || !resolvedHasVariant || resolvedAddingToCart}
            className="btn-premium min-h-11 px-3 text-[11px] font-semibold uppercase tracking-[0.11em]"
          >
            <PrimaryButtonLabel
              label={resolvedAddingToCart ? (resolvedIsEditingLine ? 'Updating...' : 'Adding...') : (resolvedIsEditingLine ? 'Update Cart' : 'Add To Cart')}
            />
          </button>
          <button
            type="button"
            onClick={onOpenSaveModal}
            disabled={!resolvedIsComplete || resolvedSavingToAccount || !resolvedCanOpenSave}
            className="btn-save-account min-h-11 px-3 text-[11px] font-semibold uppercase tracking-[0.11em]"
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
          className={`btn-premium min-h-11 px-4 text-xs font-semibold uppercase tracking-[0.12em]`}
        >
          <PrimaryButtonLabel
            label={resolvedAddingToCart
              ? (resolvedIsEditingLine ? 'Updating...' : 'Adding...')
              : (resolvedIsEditingLine ? 'Update Cart Line' : 'Add Keypad to Cart')}
          />
        </button>

        <button
          type="button"
          onClick={onOpenSaveModal}
          disabled={!resolvedIsComplete || resolvedSavingToAccount || !resolvedCanOpenSave}
          className={`btn-save-account min-h-11 px-4 text-xs font-semibold uppercase tracking-[0.12em]`}
        >
          <PrimaryButtonLabel label={resolvedHasLoadedSavedConfig ? 'Update Saved Design' : 'Save To Account'} />
        </button>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={!resolvedCanDownloadPdf || resolvedDownloadingPdf}
          className={`btn-pdf min-h-11 px-4 text-xs font-semibold uppercase tracking-[0.12em]`}
        >
          {resolvedDownloadingPdf ? 'Generating...' : 'Download PDF'}
        </button>
        <button
          type="button"
          onClick={actions.openSavedDesignsModal}
          className={`min-h-11 flex items-center justify-center rounded-btn border border-surface-border bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted transition-colors hover:border-ink-muted hover:text-ink w-full`}
        >
          My Saved Designs
        </button>
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
