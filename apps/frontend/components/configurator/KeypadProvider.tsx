'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, createContext, useEffect, useMemo, useRef, useState, useReducer } from 'react';
import useSWR from 'swr';
import { notifyCartUpdated } from '../../lib/cartEvents';

const jsonFetcher = (url: string) => fetch(url).then((res) => res.json());
import type { IconCatalogItem } from '../../lib/configuratorCatalog';
import {
  buildConfigurationDraftFromSlots,
  useConfiguratorStore,
} from '../../lib/configuratorStore';
import {
  asStrictConfiguration,
  isConfigurationComplete,
  validateAndNormalizeConfigurationInput,
  type SlotId,
} from '../../lib/keypadConfiguration';
import {
  getGeometryForModel,
  getSlotIdsForGeometry,
} from '../../config/layouts/geometry';
import { getRenderTuningForModel } from '../../lib/keypad-render-tuning';
import { resolvePkpModelCode } from '../../lib/keypadUtils';
import { useUIStore } from '../../lib/uiStore';
import type {
  KeypadConfiguratorContextValue,
  PilotKeypadProduct,
  SavedConfigurationItem,
  StatusMessage,
  SessionSummary,
} from './types';

type IconCatalogPayload = {
  icons?: IconCatalogItem[];
  error?: string;
};

type SessionSummaryPayload = {
  authenticated?: boolean;
  error?: string;
};

type SavedConfigurationPayload = {
  item?: SavedConfigurationItem;
  error?: string;
};

type ActiveCartPayload = {
  order?: {
    lines?: Array<{
      id: string;
      quantity?: number | null;
      customFields?: {
        configuration?: string | null;
      } | null;
      productVariant?: {
        name?: string | null;
        product?: {
          slug?: string | null;
          name?: string | null;
        } | null;
      } | null;
    }> | null;
  } | null;
  error?: string;
};

function buildDefaultSavedName(modelCode: string) {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `${modelCode} ${stamp}`;
}

function toPlainText(value: string | null | undefined) {
  if (!value) return '';
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveConfiguratorModelCode(keypad: PilotKeypadProduct) {
  const resolved = resolvePkpModelCode(keypad.slug, keypad.name);
  if (resolved) return resolved;
  if (keypad.modelCode?.trim()) return keypad.modelCode.trim().toUpperCase();
  return 'PKP-2200-SI';
}

type KeypadProviderState = {
  popupSlotId: SlotId | null;
  iconsLoading: boolean;
  iconsError: string | null;
  isMobile: boolean;
  isAuthenticated: boolean | null;
  cartStatus: StatusMessage | null;
  addingToCart: boolean;
  lastOrderCode: string | null;
  loadedSavedConfig: SavedConfigurationItem | null;
  loadingSavedConfig: boolean;
  savedConfigError: string | null;
  isSaveModalOpen: boolean;
  saveName: string;
  saveStatus: StatusMessage | null;
  savingToAccount: boolean;
  isSavedDesignsModalOpen: boolean;
  savedDesigns: SavedConfigurationItem[];
  savedDesignsLoading: boolean;
  savedDesignsError: string | null;
  downloadingPdf: boolean;
  editLineQuantity: number;
  recommendationSeedIconId: string | null;
  previewRotationDeg: number;
  previewShowGlows: boolean;
};

export const KeypadContext = createContext<KeypadConfiguratorContextValue | null>(null);

export default function KeypadProvider(props: {
  keypad: PilotKeypadProduct;
  children: React.ReactNode;
  iconCatalog: IconCatalogItem[];
  sessionSummary: SessionSummary;
}) {
  return (
    <Suspense fallback={props.children}>
      <KeypadProviderInner {...props} />
    </Suspense>
  );
}

function KeypadProviderInner({
  keypad,
  children,
  iconCatalog,
  sessionSummary,
}: {
  keypad: PilotKeypadProduct;
  children: React.ReactNode;
  iconCatalog: IconCatalogItem[];
  sessionSummary: SessionSummary;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedModelCode = resolveConfiguratorModelCode(keypad);
  const modelGeometry = useMemo(() => getGeometryForModel(resolvedModelCode), [resolvedModelCode]);
  const slotIds = useMemo(() => getSlotIdsForGeometry(modelGeometry), [modelGeometry]);
  const slotLabelById = useMemo(
    () => slotIds.reduce<Record<string, string>>((map, slotId) => {
      map[slotId] = modelGeometry.slots[slotId]?.label ?? slotId.replace('_', ' ');
      return map;
    }, {}),
    [modelGeometry.slots, slotIds],
  );
  const slotCount = slotIds.length;

  const slots = useConfiguratorStore((state) => state.slots);
  const setActiveSlotId = useConfiguratorStore((state) => state.setActiveSlotId);
  const selectIconForSlot = useConfiguratorStore((state) => state.selectIconForSlot);
  const setSlotGlowColor = useConfiguratorStore((state) => state.setSlotGlowColor);
  const clearSlot = useConfiguratorStore((state) => state.clearSlot);
  const reset = useConfiguratorStore((state) => state.reset);
  const hydrateFromSavedConfiguration = useConfiguratorStore((state) => state.hydrateFromSavedConfiguration);

  const [state, updateState] = useReducer(
    (prev: KeypadProviderState, next: Partial<KeypadProviderState>) => ({ ...prev, ...next }),
    {
      popupSlotId: null,
      iconsLoading: false,
      iconsError: null,
      isMobile: false,
      isAuthenticated: sessionSummary.authenticated,
      cartStatus: null,
      addingToCart: false,
      lastOrderCode: null,
      loadedSavedConfig: null,
      loadingSavedConfig: false,
      savedConfigError: null,
      isSaveModalOpen: false,
      saveName: '',
      saveStatus: null,
      savingToAccount: false,
      isSavedDesignsModalOpen: false,
      savedDesigns: [],
      savedDesignsLoading: false,
      savedDesignsError: null,
      downloadingPdf: false,
      editLineQuantity: 1,
      recommendationSeedIconId: null,
      previewRotationDeg: 0, // Gets overridden by query in useEffect
      previewShowGlows: true, // Gets overridden by query in useEffect
    } as KeypadProviderState
  );

  const {
    popupSlotId, iconsLoading, iconsError, isMobile, isAuthenticated,
    cartStatus, addingToCart, lastOrderCode, loadedSavedConfig, loadingSavedConfig,
    savedConfigError, isSaveModalOpen, saveName, saveStatus, savingToAccount,
    isSavedDesignsModalOpen, savedDesigns, savedDesignsLoading, savedDesignsError,
    downloadingPdf, editLineQuantity, recommendationSeedIconId, previewRotationDeg,
    previewShowGlows,
  } = state;

  const fetchSavedDesigns = async () => {
    updateState({ savedDesignsLoading: true, savedDesignsError: null });
    try {
      const response = await fetch('/api/account/saved-configurations', {
        method: 'GET',
        cache: 'no-store',
      });
      const payload = (await response.json().catch(() => ({}))) as { items?: SavedConfigurationItem[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Could not load saved designs.');
      }
      updateState({ savedDesigns: payload.items || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load saved designs.';
      updateState({ savedDesignsError: message });
    } finally {
      updateState({ savedDesignsLoading: false });
    }
  };

  const openSavedDesignsModal = () => {
    if (isAuthenticated === false) {
      const query = searchParams.toString();
      const redirectTo = `${pathname}${query ? `?${query}` : ''}`;
      window.location.assign(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }
    updateState({ isSavedDesignsModalOpen: true });
    void fetchSavedDesigns();
  };

  const hydratedLoadIdRef = useRef<string | null>(null);
  const hydratedLineIdRef = useRef<string | null>(null);
  const resetScopeRef = useRef<string | null>(null);
  const showToast = useUIStore((state) => state.showToast);
  const selectedIconIds = useMemo(
    () => slotIds.map((slotId) => slots[slotId]?.iconId ?? '').filter(Boolean) as string[],
    [slotIds, slots],
  );

  const loadSavedId = useMemo(() => {
    const value = searchParams.get('load');
    const normalized = value?.trim() || '';
    return normalized || null;
  }, [searchParams]);
  const editLineId = useMemo(() => {
    const value = searchParams.get('lineId');
    const normalized = value?.trim() || '';
    return normalized || null;
  }, [searchParams]);
  const resetScope = useMemo(
    () => `${pathname ?? ''}::${keypad.slug}::${resolvedModelCode}::${loadSavedId ?? ''}::${editLineId ?? ''}`,
    [editLineId, keypad.slug, loadSavedId, pathname, resolvedModelCode],
  );

  const debugMode = searchParams.get('debug') === '1' || searchParams.get('debugSlots') === '1';
  const editMode = searchParams.get('edit') === '1';
  const modelRenderTuning = useMemo(
    () => getRenderTuningForModel(resolvedModelCode),
    [resolvedModelCode],
  );
  const previewIconScaleFromQuery = useMemo(() => {
    const raw = searchParams.get('iconScale');
    if (!raw) return undefined;
    const value = Number.parseFloat(raw);
    if (!Number.isFinite(value) || value <= 0) return undefined;
    return Math.max(0.4, Math.min(1.68, value));
  }, [searchParams]);
  const previewIconScale = useMemo(
    () => previewIconScaleFromQuery ?? modelRenderTuning.iconScale,
    [modelRenderTuning.iconScale, previewIconScaleFromQuery],
  );
  const previewRotationFromQuery = (() => {
    const value = Number.parseFloat(searchParams.get('rotationDeg') || '0');
    if (!Number.isFinite(value)) return 0;
    return Math.max(-180, Math.min(180, value));
  })();
  const showGlowsFromQuery = searchParams.get('showGlows') !== '0';
  // Derived state synchronization (avoid effects during render)
  useEffect(() => {
    updateState({ previewRotationDeg: previewRotationFromQuery });
  }, [previewRotationFromQuery]);

  useEffect(() => {
    updateState({ previewShowGlows: showGlowsFromQuery });
  }, [showGlowsFromQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const updateMobile = () => updateState({ isMobile: mediaQuery.matches });

    updateMobile();
    mediaQuery.addEventListener('change', updateMobile);
    return () => {
      mediaQuery.removeEventListener('change', updateMobile);
    };
  }, []);

  useEffect(() => {
    if (resetScopeRef.current === resetScope) return;

    reset(resolvedModelCode, slotIds);
    updateState({
      loadedSavedConfig: null,
      savedConfigError: null,
      saveStatus: null,
      cartStatus: null,
      editLineQuantity: 1,
      recommendationSeedIconId: null,
    });
  }, [reset, resetScope, resolvedModelCode, slotIds]);


  const {
    data: savedConfigPayload,
    error: savedConfigSwrError,
    isLoading: loadingSavedConfigSwr,
  } = useSWR<SavedConfigurationPayload>(
    !editLineId && loadSavedId && iconCatalog.length > 0 && hydratedLoadIdRef.current !== loadSavedId
      ? `/api/account/saved-configurations/${encodeURIComponent(loadSavedId)}`
      : null,
    jsonFetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (editLineId) {
      hydratedLoadIdRef.current = null;
      return;
    }
    if (!loadSavedId) {
      hydratedLoadIdRef.current = null;
      updateState({ savedConfigError: null });
      return;
    }
    if (iconCatalog.length === 0) return;
    if (hydratedLoadIdRef.current === loadSavedId) return;

    if (loadingSavedConfigSwr) {
      updateState({ loadingSavedConfig: true, savedConfigError: null });
      return;
    }

    if (savedConfigSwrError) {
      updateState({
        savedConfigError:
          savedConfigSwrError instanceof Error ? savedConfigSwrError.message : 'Could not load saved configuration.',
        loadingSavedConfig: false,
      });
      return;
    }

    if (savedConfigPayload) {
      if (savedConfigPayload.error || !savedConfigPayload.item) {
        updateState({
          savedConfigError: savedConfigPayload.error || 'Could not load saved configuration.',
          loadingSavedConfig: false,
        });
        return;
      }
      const item = savedConfigPayload.item;
      if (item.keypadModel !== resolvedModelCode) {
        updateState({
          savedConfigError:
            `Saved configuration belongs to ${item.keypadModel}, not ${resolvedModelCode}.`,
          loadingSavedConfig: false,
        });
        return;
      }

      const parsed = validateAndNormalizeConfigurationInput(item.configuration, {
        requireComplete: false,
        slotIds,
      });
      if (!parsed.ok) {
        updateState({ savedConfigError: parsed.error, loadingSavedConfig: false });
        return;
      }

      hydrateFromSavedConfiguration(parsed.value, iconCatalog, slotIds);
      const lastConfiguredIconId = slotIds
        .map((slotId) => parsed.value[slotId]?.iconId ?? '')
        .filter(Boolean)
        .at(-1) ?? null;
      updateState({
        loadedSavedConfig: item,
        saveName: item.name,
        saveStatus: { type: 'success', message: `Loaded saved design "${item.name}".` },
        loadingSavedConfig: false,
        recommendationSeedIconId: lastConfiguredIconId,
      });
    }
  }, [
    editLineId,
    hydrateFromSavedConfiguration,
    iconCatalog,
    loadSavedId,
    loadingSavedConfigSwr,
    resetScope,
    resolvedModelCode,
    savedConfigPayload,
    savedConfigSwrError,
    slotIds,
  ]);

  const {
    data: cartActivePayload,
    error: cartActiveSwrError,
    isLoading: loadingCartActiveSwr,
  } = useSWR<ActiveCartPayload>(
    editLineId && iconCatalog.length > 0 && hydratedLineIdRef.current !== editLineId
      ? '/api/cart/active'
      : null,
    jsonFetcher,
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!editLineId) {
      hydratedLineIdRef.current = null;
      return;
    }
    if (iconCatalog.length === 0) return;
    if (hydratedLineIdRef.current === editLineId) return;

    if (loadingCartActiveSwr) {
      updateState({ loadingSavedConfig: true, savedConfigError: null });
      return;
    }

    if (cartActiveSwrError) {
      updateState({
        savedConfigError:
          cartActiveSwrError instanceof Error
            ? cartActiveSwrError.message
            : 'Could not load this cart line configuration.',
        loadingSavedConfig: false,
      });
      return;
    }

    if (cartActivePayload) {
      if (cartActivePayload.error) {
        updateState({ savedConfigError: cartActivePayload.error, loadingSavedConfig: false });
        return;
      }

      const line = cartActivePayload.order?.lines?.find((candidate) => candidate.id === editLineId);
      if (!line) {
        updateState({ savedConfigError: `Cart line "${editLineId}" was not found in your active order.`, loadingSavedConfig: false });
        return;
      }

      const resolvedLineModelCode = resolvePkpModelCode(
        line.productVariant?.product?.slug ?? '',
        line.productVariant?.product?.name ?? line.productVariant?.name ?? ''
      );
      if (resolvedLineModelCode && resolvedLineModelCode !== resolvedModelCode) {
        updateState({ savedConfigError: `Cart line belongs to ${resolvedLineModelCode}, not ${resolvedModelCode}.`, loadingSavedConfig: false });
        return;
      }

      const configurationRaw = line.customFields?.configuration ?? null;
      if (typeof configurationRaw !== 'string' || configurationRaw.trim().length === 0) {
        updateState({ savedConfigError: 'Selected cart line has no saved configuration.', loadingSavedConfig: false });
        return;
      }

      const parsed = validateAndNormalizeConfigurationInput(configurationRaw, {
        requireComplete: false,
        slotIds,
      });
      if (!parsed.ok) {
        updateState({ savedConfigError: parsed.error, loadingSavedConfig: false });
        return;
      }

      hydrateFromSavedConfiguration(parsed.value, iconCatalog, slotIds);
      if (parsed.value._meta?.rotation != null) {
        updateState({ previewRotationDeg: parsed.value._meta.rotation });
      }
      updateState({ editLineQuantity: Math.max(1, Math.floor(line.quantity ?? 1)) });
      const lastConfiguredIconId = slotIds
        .map((slotId) => parsed.value[slotId]?.iconId ?? '')
        .filter(Boolean)
        .at(-1) ?? null;
      updateState({ recommendationSeedIconId: lastConfiguredIconId });
      updateState({ saveStatus: { type: 'success', message: 'Loaded cart line configuration for editing.' } });
      hydratedLineIdRef.current = editLineId;
      resetScopeRef.current = resetScope;
      updateState({ loadingSavedConfig: false });
    }
  }, [
    cartActivePayload,
    cartActiveSwrError,
    editLineId,
    hydrateFromSavedConfiguration,
    iconCatalog,
    loadingCartActiveSwr,
    resetScope,
    resolvedModelCode,
    slotIds,
  ]);

  const configurationDraft = useMemo(
    () => buildConfigurationDraftFromSlots(slots, slotIds),
    [slotIds, slots],
  );
  const strictConfiguration = useMemo(
    () => asStrictConfiguration(configurationDraft, slotIds),
    [configurationDraft, slotIds],
  );
  const isComplete = slotIds.every((id) => slots[id]?.iconId);

  const openSlot = (slotId: SlotId) => {
    setActiveSlotId(slotId);
    updateState({ popupSlotId: slotId });
  };

  const closeSlot = () => {
    updateState({ popupSlotId: null });
    setActiveSlotId(null);
  };

  const rotatePreview = () => {
    updateState({ previewRotationDeg: Math.abs(state.previewRotationDeg) === 90 ? 0 : 90 });
  };

  const togglePreviewGlows = () => {
    updateState({ previewShowGlows: !state.previewShowGlows });
  };

  const addToCart = async () => {
    if (!editLineId && !keypad.productVariantId) {
      updateState({ cartStatus: { type: 'error', message: 'This keypad variant is unavailable for checkout.' } });
      return;
    }

    if (!strictConfiguration) {
      updateState({
        cartStatus: {
          type: 'error',
          message: editLineId
            ? `Complete all ${slotCount} slots before updating this configured cart line.`
            : `Complete all ${slotCount} slots before adding this keypad to cart.`,
        },
      });
      return;
    }

    updateState({ addingToCart: true, cartStatus: null });

    try {
      const response = editLineId
        ? await fetch('/api/cart/update-line', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            orderLineId: editLineId,
            quantity: state.editLineQuantity,
            configuration: {
              ...strictConfiguration,
              _meta: { rotation: state.previewRotationDeg },
            },
          }),
        })
        : await fetch('/api/cart/add-item', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            productVariantId: keypad.productVariantId,
            quantity: 1,
            customFields: {
              configuration: {
                ...strictConfiguration,
                _meta: { rotation: state.previewRotationDeg },
              },
            },
          }),
        });

      const payload = (await response.json().catch(() => ({}))) as {
        orderCode?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || (editLineId
          ? 'Could not update this configured cart line.'
          : 'Could not add configured keypad to cart.'));
      }

      notifyCartUpdated();
      updateState({ lastOrderCode: payload.orderCode ?? null });
      updateState({
        cartStatus: {
          type: 'success',
          message: editLineId ? 'Cart line updated successfully.' : 'Configured keypad added to cart.',
        },
      });
      showToast({
        message: editLineId
          ? 'Configuration updated in cart.'
          : payload.orderCode
            ? `Configured keypad added. Order ${payload.orderCode} updated.`
            : 'Configured keypad added to cart.',
        ctaHref: '/cart',
        ctaLabel: 'View Cart',
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : (editLineId
          ? 'Could not update this configured cart line.'
          : 'Could not add configured keypad to cart.');
      updateState({ cartStatus: { type: 'error', message } });
    } finally {
      updateState({ addingToCart: false });
    }
  };

  const openSaveModal = () => {
    if (!strictConfiguration) {
      updateState({ saveStatus: { type: 'error', message: `Complete all ${slotCount} slots before saving to account.` } });
      return;
    }

    if (isAuthenticated === false) {
      // Show inline login via the Saved Designs modal instead of navigating away
      updateState({ isSavedDesignsModalOpen: true });
      return;
    }

    updateState({ saveName: loadedSavedConfig?.name || buildDefaultSavedName(resolvedModelCode) });
    updateState({ saveStatus: null });
    updateState({ isSaveModalOpen: true });
  };

  const submitSave = async () => {
    if (!strictConfiguration) {
      updateState({ saveStatus: { type: 'error', message: `Complete all ${slotCount} slots before saving to account.` } });
      return;
    }

    const trimmedName = saveName.trim();
    if (!trimmedName) {
      updateState({ saveStatus: { type: 'error', message: 'Name your configuration before saving.' } });
      return;
    }

    updateState({ savingToAccount: true, saveStatus: null });

    try {
      const endpoint = loadedSavedConfig
        ? `/api/account/saved-configurations/${encodeURIComponent(loadedSavedConfig.id)}`
        : '/api/account/saved-configurations';

      const method = loadedSavedConfig ? 'PATCH' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          keypadModel: resolvedModelCode,
          configuration: strictConfiguration,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as SavedConfigurationPayload;

      if (!response.ok || !payload.item) {
        throw new Error(payload.error || 'Could not save configuration.');
      }

      updateState({ loadedSavedConfig: payload.item });
      updateState({ saveStatus: null });
      showToast({
        message: loadedSavedConfig
          ? `Updated "${payload.item.name}".`
          : `Saved "${payload.item.name}" to your account.`,
        ctaHref: '/account',
        ctaLabel: 'View Account',
      });
      updateState({ isSaveModalOpen: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save configuration.';
      updateState({ saveStatus: { type: 'error', message } });
    } finally {
      updateState({ savingToAccount: false });
    }
  };

  const downloadPdf = async () => {
    if (!strictConfiguration) {
      updateState({
        saveStatus: {
          type: 'error',
          message: `Complete all ${slotCount} slots before generating the engineering PDF.`,
        },
      });
      return;
    }

    if (isAuthenticated === false) {
      const query = searchParams.toString();
      const redirectTo = `${pathname}${query ? `?${query}` : ''}`;
      window.location.assign(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    updateState({ downloadingPdf: true });
    updateState({ saveStatus: null });

    try {
      const response = await fetch('/api/order/export-pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orderCode: lastOrderCode ?? undefined,
          designName: loadedSavedConfig?.name ?? `${resolvedModelCode} Design`,
          modelCode: resolvedModelCode,
          configuration: strictConfiguration,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Could not generate PDF export.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;

      const headerFilename = response.headers.get('content-disposition') || '';
      const filenameMatch = headerFilename.match(/filename="?([^";]+)"?/i);
      anchor.download = filenameMatch?.[1] || `Keypad-Config-${resolvedModelCode}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      updateState({ saveStatus: { type: 'success', message: 'PDF exported successfully.' } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not generate PDF export.';
      updateState({ saveStatus: { type: 'error', message } });
    } finally {
      updateState({ downloadingPdf: false });
    }
  };

  const descriptionText = toPlainText(keypad.description);
  const canOpenSaveAction = isAuthenticated !== null;
  const canDownloadPdf = Boolean(strictConfiguration);
  const hasVariant = Boolean(keypad.productVariantId) || Boolean(editLineId);

  const contextValue: KeypadConfiguratorContextValue = {
    state: {
      modelCode: resolvedModelCode,
      slotIds,
      slotLabels: slotLabelById,
      slots,
      popupSlotId,
      selectedIconIds,
      recommendationSeedIconId: state.recommendationSeedIconId,
      isMobile,
      isAuthenticated,
      mode: editLineId ? 'edit-line' : 'new',
      isComplete,
      hasVariant,
      hasLoadedSavedConfig: Boolean(loadedSavedConfig),
      canOpenSaveAction,
      canDownloadPdf,
      saveModalOpen: isSaveModalOpen,
      savedDesignsModalOpen: isSavedDesignsModalOpen,
      saveName,
      icons: iconCatalog,
      iconsError,
      savedConfigError,
      savedDesigns,
      savedDesignsLoading,
      savedDesignsError,
      cartStatus,
      saveStatus,
      busy: {
        iconsLoading,
        loadingSavedConfig,
        addingToCart,
        savingToAccount,
        downloadingPdf: state.downloadingPdf,
      },
      preview: {
        rotationDeg: state.previewRotationDeg,
        showGlows: state.previewShowGlows,
        iconScale: previewIconScale,
        iconVisibleComp: modelRenderTuning.iconVisibleComp,
        debugMode,
        editMode,
        descriptionText,
      },
    },
    actions: {
      resetSlots: () => {
        reset(resolvedModelCode, slotIds);
      },
      openSlot,
      closeSlot,
      clearSlot,
      selectIconForSlot: (slotId, icon) => {
        selectIconForSlot(slotId, icon);
        updateState({ recommendationSeedIconId: icon.iconId });
      },
      setSlotGlowForSlot: (slotId, color) => {
        setSlotGlowColor(slotId, color);
      },
      rotatePreview,
      togglePreviewGlows,
      addToCart,
      openSaveModal,
      closeSaveModal: () => {
        updateState({ isSaveModalOpen: false });
      },
      openSavedDesignsModal,
      closeSavedDesignsModal: () => {
        updateState({ isSavedDesignsModalOpen: false });
      },
      submitSave,
      setSaveName: (name: string) => updateState({ saveName: name }),
      downloadPdf,
    },
    meta: {
      keypad: {
        ...keypad,
        modelCode: resolvedModelCode,
      },
      geometry: modelGeometry,
      configurationDraft,
      slotCount,
      editLineId,
      loadSavedId,
    },
  };

  return (
    <KeypadContext value={contextValue}>
      {children}
    </KeypadContext>
  );
}
