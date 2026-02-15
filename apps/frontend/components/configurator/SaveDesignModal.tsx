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
  const resolvedOnSaveNameChange = onSaveNameChange ?? context?.actions.setSaveName ?? (() => {});
  const resolvedOnClose = onClose ?? context?.actions.closeSaveModal ?? (() => {});
  const resolvedOnSubmit = onSubmit ?? (() => {
    if (!context) return;
    void context.actions.submitSave();
  });

  if (!resolvedOpen) return null;

  return (
    <AccessibleModal
      open={resolvedOpen}
      onClose={resolvedOnClose}
      panelClassName="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
    >
      <h3 className="text-lg font-semibold text-ink">Name your configuration</h3>
      <p className="mt-1 text-sm text-ink/60">This name appears in your account under My Saved Designs.</p>

      <input
        type="text"
        value={resolvedSaveName}
        onChange={(event) => resolvedOnSaveNameChange(event.target.value)}
        maxLength={160}
        className="mt-4 w-full rounded-full border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-ink/30"
        placeholder="My Racing Setup"
      />

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={resolvedOnClose}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
          disabled={resolvedSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={resolvedOnSubmit}
          disabled={resolvedSaving}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {resolvedSaving ? 'Saving...' : resolvedHasLoadedConfig ? 'Update' : 'Save'}
        </button>
      </div>
    </AccessibleModal>
  );
}
