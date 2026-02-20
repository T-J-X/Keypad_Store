'use client';

import { use } from 'react';
import AccessibleModal from '../ui/AccessibleModal';
import { KeypadContext } from './KeypadProvider';

type SaveDesignModalProps = {
  isOpen?: boolean;
  saveName?: string;
  onSaveNameChange?: (next: string) => void;
  savingToAccount?: boolean;
  hasLoadedSavedConfig?: boolean;
  onClose?: () => void;
  onSubmit?: () => void;
};

export default function SaveDesignModal({
  isOpen,
  saveName,
  onSaveNameChange,
  savingToAccount,
  hasLoadedSavedConfig,
  onClose,
  onSubmit,
}: SaveDesignModalProps) {
  const context = use(KeypadContext);
  const resolvedOpen = isOpen ?? context?.state.saveModalOpen ?? false;
  const resolvedSaveName = saveName ?? context?.state.saveName ?? '';
  const resolvedSaving = savingToAccount ?? context?.state.busy.savingToAccount ?? false;
  const resolvedHasLoadedConfig = hasLoadedSavedConfig ?? context?.state.hasLoadedSavedConfig ?? false;
  const resolvedOnSaveNameChange = onSaveNameChange ?? context?.actions.setSaveName ?? (() => { });
  const resolvedOnClose = onClose ?? context?.actions.closeSaveModal ?? (() => { });
  const resolvedOnSubmit = onSubmit ?? (() => {
    if (!context) return;
    void context.actions.submitSave();
  });

  if (!resolvedOpen) return null;

  return (
    <AccessibleModal
      open={resolvedOpen}
      onClose={resolvedOnClose}
      panelClassName="w-full max-w-md rounded-3xl border border-panel-border bg-panel text-white p-6 shadow-[0_30px_80px_rgba(2,8,24,0.55)]"
    >
      <h3 className="text-lg font-semibold text-white">Name your configuration</h3>
      <p className="mt-1 text-sm text-panel-muted">This name appears in your account under My Saved Designs.</p>

      <input
        type="text"
        value={resolvedSaveName}
        onChange={(event) => resolvedOnSaveNameChange(event.target.value)}
        maxLength={160}
        className="mt-5 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-panel-accent focus:bg-white/10 transition-colors placeholder:text-white/30"
        placeholder="My Racing Setup"
      />

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={resolvedOnClose}
          className="rounded-full border border-white/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/5 transition-colors"
          disabled={resolvedSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={resolvedOnSubmit}
          disabled={resolvedSaving}
          className="btn-premium rounded-full text-xs font-semibold uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {resolvedSaving ? 'Saving...' : resolvedHasLoadedConfig ? 'Update' : 'Save'}
        </button>
      </div>
    </AccessibleModal>
  );
}
