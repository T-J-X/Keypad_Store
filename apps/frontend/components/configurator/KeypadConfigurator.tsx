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
    <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
      <div className="mb-12 flex flex-col gap-6 px-2">
        <Breadcrumbs
          items={[
            { label: 'Configurator', href: '/configurator' },
            { label: state.modelCode },
          ]}
          className="text-blue-900/60 [&_a]:text-blue-900/60 [&_a:hover]:text-blue-900 [&_span[aria-current]]:text-blue-900 [&_svg]:text-blue-900/40"
        />

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl font-bold tracking-tighter text-ink sm:text-7xl">{state.modelCode}</h1>
            {state.isMobile && (
              <button
                type="button"
                onClick={() => setShowMobileDesc(!showMobileDesc)}
                className="flex h-8 items-center gap-2 rounded-full border border-ink/10 bg-white/50 px-3 text-[10px] font-bold uppercase tracking-widest text-ink backdrop-blur-md transition-all hover:bg-white/80 hover:border-ink/20"
              >
                <Info size={14} />
                <span>About</span>
              </button>
            )}
          </div>

          {!state.isMobile ? (
            <div className="max-w-2xl">
              <p className="text-lg text-slate-500 leading-relaxed">
                {descriptionText}
              </p>
              <Link
                href="/shop"
                className="group mt-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
              >
                Browse icon catalog
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          ) : (
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showMobileDesc ? 'max-h-56 opacity-100 mt-2 mb-4' : 'max-h-0 opacity-0'}`}>
              <p className="text-sm text-slate-600 px-1">
                {descriptionText}
              </p>
              <Link
                href="/shop"
                className="mt-4 flex w-fit h-9 items-center gap-2 rounded-full border border-ink/10 bg-white/50 px-4 text-[10px] font-bold uppercase tracking-widest text-panel-accent backdrop-blur-md transition-all hover:bg-white/80 hover:text-ink"
              >
                <span>Browse Catalog</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="card-panel p-6 sm:p-8">

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
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
