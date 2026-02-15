'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { use, Suspense, useState } from 'react';
import { Breadcrumbs } from '../Breadcrumbs';
import { Info } from 'lucide-react';
import ConfigurationSidebar from './ConfigurationSidebar';
import KeypadPreview from './KeypadPreview';
import KeypadProvider, { KeypadContext } from './KeypadProvider';
import type { PilotKeypadProduct } from './types';

const ConfiguratorActions = dynamic(() => import('./ConfiguratorActions'));
const IconSelectionPopup = dynamic(() => import('./IconSelectionPopup'));
const SaveDesignModal = dynamic(() => import('./SaveDesignModal'));
const SavedDesignsModal = dynamic(() => import('./SavedDesignsModal'));

const Keypad = {
  Provider: KeypadProvider,
  Context: KeypadContext,
  Preview: KeypadPreview,
  Sidebar: ConfigurationSidebar,
  Actions: ConfiguratorActions,
  IconPicker: IconSelectionPopup,
  SaveDialog: SaveDesignModal,
  SavedDesignsModal,
};

function KeypadConfiguratorShell() {
  const context = use(Keypad.Context);
  if (!context) return null;

  const { state, actions, meta } = context;
  const isEditingLine = state.mode === 'edit-line' || Boolean(meta.editLineId);
  const [showMobileDesc, setShowMobileDesc] = useState(false);

  const descriptionText = isEditingLine
    ? 'Update this cart line by editing icon IDs and ring glow colors, then save directly back to your active order.'
    : 'Select matte inserts for each slot, tune ring glow colors, save to account, and bridge directly to order PDF export.';

  return (
    <div className="mx-auto w-full max-w-[130rem] px-4 pt-16 pb-8 lg:py-[150px] sm:px-6 lg:px-8">
      <div className="card-panel p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Breadcrumbs
              items={[
                { label: 'Configurator', href: '/configurator' },
                { label: state.modelCode },
              ]}
              className="text-panel-muted [&_a]:text-panel-muted [&_a:hover]:text-white [&_span[aria-current]]:text-white [&_svg]:text-panel-muted"
            />
            <div className="flex items-center gap-3">
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{state.modelCode}</h1>
              {state.isMobile && (
                <button
                  type="button"
                  onClick={() => setShowMobileDesc(!showMobileDesc)}
                  className="mt-4 flex h-8 items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/25 hover:border-white/40"
                >
                  <Info size={14} />
                  <span>About</span>
                </button>
              )}
            </div>

            {!state.isMobile ? (
              <p className="mt-2 max-w-2xl text-sm text-panel-muted">
                {descriptionText}
              </p>
            ) : (
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showMobileDesc ? 'max-h-48 opacity-100 mt-4 mb-4' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-panel-muted px-1">
                  {descriptionText}
                </p>
                <Link
                  href="/shop"
                  className="mt-4 flex w-fit h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-[10px] font-bold uppercase tracking-widest text-panel-accent backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
                >
                  <span>Browse Catalog</span>
                </Link>
              </div>
            )}
          </div>
          {!state.isMobile && (
            <div className="flex flex-wrap gap-2">
              <Link href="/shop" className="btn-secondary dark">
                Browse icon catalog
              </Link>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(500px,1.2fr)_minmax(500px,1fr)]">
          <div className="lg:sticky lg:top-32">
            <Keypad.Preview
              modelCode={state.modelCode}
              shellAssetPath={meta.keypad.shellAssetPath}
              description={
                isEditingLine
                  ? 'Update this cart line by editing icon IDs and ring glow colors, then save directly back to your active order.'
                  : 'Select matte inserts for each slot, tune ring glow colors, save to account, and bridge directly to order PDF export.'
              }
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
              onResetSlots={actions.resetSlots}
            />
          </div>

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
                  className="btn-pdf w-full justify-center min-h-11 text-xs font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state.busy.downloadingPdf ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  type="button"
                  onClick={actions.openSavedDesignsModal}
                  className="btn-secondary dark w-full justify-center text-xs uppercase tracking-[0.12em]"
                >
                  My Saved Designs
                </button>
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
      <Keypad.SavedDesignsModal />
    </div>
  );
}

export default function KeypadConfigurator({
  keypad,
}: {
  keypad: PilotKeypadProduct;
}) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-surface-alt/50" />}>
      <Keypad.Provider keypad={keypad}>
        <KeypadConfiguratorShell />
      </Keypad.Provider>
    </Suspense>
  );
}
