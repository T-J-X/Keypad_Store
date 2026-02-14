'use client';

import { useId } from 'react';
import AccessibleModal from '../ui/AccessibleModal';

export default function SaveDesignModal({
  isOpen,
  saveName,
  onSaveNameChange,
  savingToAccount,
  hasLoadedSavedConfig,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  saveName: string;
  onSaveNameChange: (next: string) => void;
  savingToAccount: boolean;
  hasLoadedSavedConfig: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!isOpen) return null;

  const titleId = useId();
  const descriptionId = useId();

  return (
    <AccessibleModal
      open={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={descriptionId}
      panelClassName="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
    >
      <h3 id={titleId} className="text-lg font-semibold text-ink">Name your configuration</h3>
      <p id={descriptionId} className="mt-1 text-sm text-ink/60">This name appears in your account under My Saved Designs.</p>

      <input
        type="text"
        value={saveName}
        onChange={(event) => onSaveNameChange(event.target.value)}
        maxLength={160}
        className="mt-4 w-full rounded-full border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-ink/30"
        placeholder="My Racing Setup"
      />

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
          disabled={savingToAccount}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={savingToAccount}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {savingToAccount ? 'Saving...' : hasLoadedSavedConfig ? 'Update' : 'Save'}
        </button>
      </div>
    </AccessibleModal>
  );
}
