'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { use } from 'react';
import ConfigurationSidebar from './ConfigurationSidebar';
import KeypadPreview from './KeypadPreview';
import KeypadProvider, { KeypadContext } from './KeypadProvider';
import type { PilotKeypadProduct } from './types';

const ConfiguratorActions = dynamic(() => import('./ConfiguratorActions'));
const IconSelectionPopup = dynamic(() => import('./IconSelectionPopup'));
const SaveDesignModal = dynamic(() => import('./SaveDesignModal'));

const Keypad = {
  Provider: KeypadProvider,
  Context: KeypadContext,
  Preview: KeypadPreview,
  Sidebar: ConfigurationSidebar,
  Actions: ConfiguratorActions,
  IconPicker: IconSelectionPopup,
  SaveDialog: SaveDesignModal,
};

function KeypadConfiguratorShell() {
  const context = use(Keypad.Context);
  if (!context) return null;

  const { state, actions, meta } = context;
  const isEditingLine = state.mode === 'edit-line' || Boolean(meta.editLineId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-10 sm:px-6 lg:px-8 lg:pb-20">
      <div className="overflow-hidden rounded-3xl border border-[#0f2c5a] bg-[radial-gradient(130%_120%_at_50%_0%,#1e63bc_0%,#102d5a_36%,#060f24_100%)] p-6 shadow-[0_34px_100px_rgba(2,10,28,0.45)] sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="pill bg-[#1052ab]">{isEditingLine ? 'Edit Configuration' : 'Pilot Configurator'}</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{state.modelCode}</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100/80">
              {isEditingLine
                ? 'Update this cart line by editing icon IDs and ring glow colors, then save directly back to your active order.'
                : 'Select matte inserts for each slot, tune ring glow colors, save to account, and bridge directly to order PDF export.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/shop" className="inline-flex min-h-11 items-center rounded-full border border-white/35 px-4 text-sm font-semibold text-blue-50 transition hover:border-white hover:bg-white/10">
              Browse icon catalog
            </Link>
            <button
              type="button"
              onClick={actions.resetSlots}
              className="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/16"
            >
              Reset slots
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Keypad.Preview
            modelCode={state.modelCode}
            shellAssetPath={meta.keypad.shellAssetPath}
            slots={state.slots}
            activeSlotId={state.popupSlotId}
            onSlotClick={actions.openSlot}
            rotationDeg={state.preview.rotationDeg}
            iconScale={state.preview.iconScale}
            iconVisibleComp={state.preview.iconVisibleComp}
            debugMode={state.preview.debugMode}
            editMode={state.preview.editMode}
            descriptionText={state.preview.descriptionText}
            showGlows={state.preview.showGlows}
            onRotate={actions.rotatePreview}
            onToggleGlows={actions.togglePreviewGlows}
          />

          <Keypad.Sidebar>
            {!state.isMobile ? (
              <Keypad.Actions variant="inline" />
            ) : (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    void actions.downloadPdf();
                  }}
                  disabled={!state.canDownloadPdf || state.busy.downloadingPdf}
                  className="btn-ghost-strong inline-flex min-h-11 items-center justify-center px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#0d2f63] transition hover:border-[#6d88b6] hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state.busy.downloadingPdf ? 'Generating...' : 'Download PDF'}
                </button>
                <Link
                  href="/account"
                  className="btn-ghost-strong inline-flex min-h-11 items-center justify-center px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#5c6f90] transition hover:border-[#8ea4c8] hover:bg-white/80 hover:text-[#1e3355]"
                >
                  Open My Saved Designs
                </Link>
              </div>
            )}
          </Keypad.Sidebar>
        </div>
      </div>

      {state.isMobile ? (
        <Keypad.Actions variant="sticky" />
      ) : null}

      <Keypad.IconPicker />
      <Keypad.SaveDialog />
    </div>
  );
}

export default function KeypadConfigurator({
  keypad,
}: {
  keypad: PilotKeypadProduct;
}) {
  return (
    <Keypad.Provider keypad={keypad}>
      <KeypadConfiguratorShell />
    </Keypad.Provider>
  );
}
