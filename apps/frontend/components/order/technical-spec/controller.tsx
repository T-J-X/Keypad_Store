'use client';

import { useId, useMemo, useReducer } from 'react';
import {
  buildConfiguredIconLookupFromPayload,
  resolvePreviewSlotIds,
} from '../../../lib/configuredKeypadPreview';
import { resolvePkpModelCode } from '../../../lib/keypadUtils';
import { getGeometryForModel } from '../../../config/layouts/geometry';
import {
  initialTechnicalSpecState,
  technicalSpecReducer,
} from './reducer';
import type { IconCatalogPayload, TechnicalSpecPayload } from './types';
import TechnicalSpecView from './view';

export default function TechnicalSpecController({
  orderCode,
}: {
  orderCode: string;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [state, dispatch] = useReducer(technicalSpecReducer, initialTechnicalSpecState);

  const activeLine = useMemo(() => {
    if (!state.specData) return null;
    if (state.activeLineId) {
      return state.specData.lines.find((line) => line.lineId === state.activeLineId) ?? null;
    }
    return state.specData.lines[0] ?? null;
  }, [state.activeLineId, state.specData]);

  const activeModelCode = useMemo(() => {
    if (!activeLine) return null;
    return resolvePkpModelCode('', `${activeLine.variantName} ${activeLine.variantSku}`) || null;
  }, [activeLine]);

  const activeGeometry = useMemo(
    () => (activeModelCode ? getGeometryForModel(activeModelCode) : null),
    [activeModelCode],
  );

  const activeSlotIds = useMemo(
    () => resolvePreviewSlotIds({
      modelCode: activeModelCode,
      configuration: activeLine?.configuration ?? null,
    }),
    [activeLine?.configuration, activeModelCode],
  );

  const loadTechnicalSpec = async () => {
    dispatch({ type: 'load_start' });

    try {
      const [specResponse, iconsResponse] = await Promise.all([
        fetch(`/api/order/technical-spec?orderCode=${encodeURIComponent(orderCode)}`, {
          method: 'GET',
          cache: 'no-store',
        }),
        fetch('/api/configurator/icon-catalog', {
          method: 'GET',
          cache: 'no-store',
        }),
      ]);

      const specPayload = (await specResponse.json().catch(() => ({}))) as TechnicalSpecPayload & {
        error?: string;
      };

      if (!specResponse.ok || !Array.isArray(specPayload.lines) || specPayload.lines.length === 0) {
        throw new Error(specPayload.error || 'No technical configuration data found for this order.');
      }

      const iconsPayload = (await iconsResponse.json().catch(() => ({}))) as IconCatalogPayload;
      const icons = iconsPayload.icons ?? [];

      dispatch({
        type: 'load_success',
        specData: specPayload,
        iconLookup: buildConfiguredIconLookupFromPayload(icons),
      });
    } catch (nextError) {
      const message = nextError instanceof Error
        ? nextError.message
        : 'No technical configuration data found for this order.';
      dispatch({ type: 'load_error', message });
    }
  };

  const openModal = async () => {
    dispatch({ type: 'set_open', open: true });
    if (!state.specData && !state.isLoading) {
      await loadTechnicalSpec();
    }
  };

  const onDownloadPdf = async () => {
    if (!activeLine) return;

    dispatch({ type: 'download_start', lineId: activeLine.lineId });

    try {
      const response = await fetch('/api/order/export-pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orderCode,
          modelCode: activeModelCode ?? undefined,
          configuration: activeLine.configuration,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Could not generate engineering PDF.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;

      const headerFilename = response.headers.get('content-disposition') || '';
      const filenameMatch = headerFilename.match(/filename="?([^";]+)"?/i);
      anchor.download = filenameMatch?.[1] || `Keypad-Config-${orderCode}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      dispatch({ type: 'download_success' });
    } catch (nextError) {
      const message = nextError instanceof Error
        ? nextError.message
        : 'Could not generate engineering PDF.';
      dispatch({ type: 'download_error', message });
    }
  };

  return (
    <TechnicalSpecView
      orderCode={orderCode}
      titleId={titleId}
      descriptionId={descriptionId}
      isOpen={state.isOpen}
      isLoading={state.isLoading}
      error={state.error}
      downloadError={state.downloadError}
      downloadingLineId={state.downloadingLineId}
      specData={state.specData}
      activeLine={activeLine}
      activeModelCode={activeModelCode}
      activeGeometry={activeGeometry}
      activeSlotIds={activeSlotIds}
      iconLookup={state.iconLookup}
      onOpen={() => void openModal()}
      onClose={() => dispatch({ type: 'set_open', open: false })}
      onSelectLine={(lineId) => dispatch({ type: 'set_active_line_id', lineId })}
      onDownloadPdf={() => void onDownloadPdf()}
    />
  );
}
