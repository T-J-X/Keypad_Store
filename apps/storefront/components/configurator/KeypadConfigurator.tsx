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
      <div className="card-panel p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="pill">Pilot Configurator</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{state.modelCode}</h1>
            <p className="mt-2 max-w-2xl text-sm text-panel-muted">
              {isEditingLine
                ? 'Update this cart line by editing icon IDs and ring glow colors, then save directly back to your active order.'
                : 'Select matte inserts for each slot, tune ring glow colors, save to account, and bridge directly to order PDF export.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/shop" className="btn-secondary dark">
              Browse icon catalog
            </Link>
            <button
              type="button"
              onClick={actions.resetSlots}
              className="btn-secondary dark"
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
                  className="btn-secondary dark w-full justify-center text-xs uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state.busy.downloadingPdf ? 'Generating...' : 'Download PDF'}
                </button>
                <Link
                  href="/account"
                  className="btn-secondary dark w-full justify-center text-xs uppercase tracking-[0.12em]"
                >
                  My Saved Designs
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
