'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
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

export const KeypadContext = createContext<KeypadConfiguratorContextValue | null>(null);

export default function KeypadProvider({
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
  const resolvedModelCode = useMemo(() => resolveConfiguratorModelCode(keypad), [keypad]);
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

  const [popupSlotId, setPopupSlotId] = useState<SlotId | null>(null);
  const [icons, setIcons] = useState<IconCatalogItem[]>(iconCatalog);
  const [iconsLoading, setIconsLoading] = useState(false);
  const [iconsError, setIconsError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize from session summary
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(sessionSummary.authenticated);

  const [cartStatus, setCartStatus] = useState<StatusMessage | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  // We can't easily get the last order code from summary without more data, but that's for "View Cart" toast mainly.
  const [lastOrderCode, setLastOrderCode] = useState<string | null>(null);

  const [loadedSavedConfig, setLoadedSavedConfig] = useState<SavedConfigurationItem | null>(null);
  const [loadingSavedConfig, setLoadingSavedConfig] = useState(false);
  const [savedConfigError, setSavedConfigError] = useState<string | null>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveStatus, setSaveStatus] = useState<StatusMessage | null>(null);
  const [savingToAccount, setSavingToAccount] = useState(false);

  // NEW: Saved Designs Modal State
  const [isSavedDesignsModalOpen, setIsSavedDesignsModalOpen] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<SavedConfigurationItem[]>([]);
  const [savedDesignsLoading, setSavedDesignsLoading] = useState(false);
  const [savedDesignsError, setSavedDesignsError] = useState<string | null>(null);

  const fetchSavedDesigns = async () => {
    setSavedDesignsLoading(true);
    setSavedDesignsError(null);
    try {
      const response = await fetch('/api/account/saved-configurations', {
        method: 'GET',
        cache: 'no-store',
      });
      const payload = (await response.json().catch(() => ({}))) as { items?: SavedConfigurationItem[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Could not load saved designs.');
      }
      setSavedDesigns(payload.items || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load saved designs.';
      setSavedDesignsError(message);
    } finally {
      setSavedDesignsLoading(false);
    }
  };

  const openSavedDesignsModal = () => {
    if (isAuthenticated === false) {
      const query = searchParams.toString();
      const redirectTo = `${pathname}${query ? `?${query}` : ''}`;
      window.location.assign(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }
    setIsSavedDesignsModalOpen(true);
    void fetchSavedDesigns();
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const hydratedLoadIdRef = useRef<string | null>(null);
  const hydratedLineIdRef = useRef<string | null>(null);
  const resetScopeRef = useRef<string | null>(null);
  const showToast = useUIStore((state) => state.showToast);
  const [editLineQuantity, setEditLineQuantity] = useState(1);
  const [recommendationSeedIconId, setRecommendationSeedIconId] = useState<string | null>(null);
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

  const debugMode = useMemo(
    () => searchParams.get('debug') === '1' || searchParams.get('debugSlots') === '1',
    [searchParams],
  );
  const editMode = useMemo(() => searchParams.get('edit') === '1', [searchParams]);
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
  const previewRotationFromQuery = useMemo(() => {
    const value = Number.parseFloat(searchParams.get('rotationDeg') || '0');
    if (!Number.isFinite(value)) return 0;
    return Math.max(-180, Math.min(180, value));
  }, [searchParams]);
  const showGlowsFromQuery = useMemo(() => searchParams.get('showGlows') !== '0', [searchParams]);
  const [previewRotationDeg, setPreviewRotationDeg] = useState(previewRotationFromQuery);
  const [previewShowGlows, setPreviewShowGlows] = useState(showGlowsFromQuery);

  // Derived state synchronization (avoid effects)
  const [prevRotationFromQuery, setPrevRotationFromQuery] = useState(previewRotationFromQuery);
  if (previewRotationFromQuery !== prevRotationFromQuery) {
    setPrevRotationFromQuery(previewRotationFromQuery);
    setPreviewRotationDeg(previewRotationFromQuery);
  }

  const [prevShowGlowsFromQuery, setPrevShowGlowsFromQuery] = useState(showGlowsFromQuery);
  if (showGlowsFromQuery !== prevShowGlowsFromQuery) {
    setPrevShowGlowsFromQuery(showGlowsFromQuery);
    setPreviewShowGlows(showGlowsFromQuery);
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const updateMobile = () => setIsMobile(mediaQuery.matches);

    updateMobile();
    mediaQuery.addEventListener('change', updateMobile);
    return () => {
      mediaQuery.removeEventListener('change', updateMobile);
    };
  }, []);

  useEffect(() => {
    if (resetScopeRef.current === resetScope) return;

    reset(resolvedModelCode, slotIds);
    setLoadedSavedConfig(null);
    setSavedConfigError(null);
    setSaveStatus(null);
    setCartStatus(null);
    setEditLineQuantity(1);
    setRecommendationSeedIconId(null);
    hydratedLoadIdRef.current = null;
    hydratedLineIdRef.current = null;
    resetScopeRef.current = resetScope;
  }, [reset, resetScope, resolvedModelCode, slotIds]);





  const {
    data: savedConfigPayload,
    error: savedConfigSwrError,
    isLoading: loadingSavedConfigSwr,
  } = useSWR<SavedConfigurationPayload>(
    !editLineId && loadSavedId && icons.length > 0 && hydratedLoadIdRef.current !== loadSavedId
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
      setSavedConfigError(null);
      return;
    }
    if (icons.length === 0) return;
    if (hydratedLoadIdRef.current === loadSavedId) return;

    if (loadingSavedConfigSwr) {
      setLoadingSavedConfig(true);
      setSavedConfigError(null);
      return;
    }

    if (savedConfigSwrError) {
      setSavedConfigError(
        savedConfigSwrError instanceof Error ? savedConfigSwrError.message : 'Could not load saved configuration.'
      );
      setLoadingSavedConfig(false);
      return;
    }

    if (savedConfigPayload) {
      if (savedConfigPayload.error || !savedConfigPayload.item) {
        setSavedConfigError(savedConfigPayload.error || 'Could not load saved configuration.');
        setLoadingSavedConfig(false);
        return;
      }
      const item = savedConfigPayload.item;
      if (item.keypadModel !== resolvedModelCode) {
        setSavedConfigError(
          `Saved configuration belongs to ${item.keypadModel}, not ${resolvedModelCode}.`
        );
        setLoadingSavedConfig(false);
        return;
      }

      const parsed = validateAndNormalizeConfigurationInput(item.configuration, {
        requireComplete: false,
        slotIds,
      });
      if (!parsed.ok) {
        setSavedConfigError(parsed.error);
        setLoadingSavedConfig(false);
        return;
      }

      hydrateFromSavedConfiguration(parsed.value, icons, slotIds);
      setLoadedSavedConfig(item);
      setSaveName(item.name);
      const lastConfiguredIconId = slotIds
        .map((slotId) => parsed.value[slotId]?.iconId ?? '')
        .filter(Boolean)
        .at(-1) ?? null;
      setRecommendationSeedIconId(lastConfiguredIconId);
      hydratedLoadIdRef.current = loadSavedId;
      resetScopeRef.current = resetScope;
      setSaveStatus({ type: 'success', message: `Loaded saved design "${item.name}".` });
      setLoadingSavedConfig(false);
    }
  }, [
    editLineId,
    hydrateFromSavedConfiguration,
    icons,
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
    editLineId && icons.length > 0 && hydratedLineIdRef.current !== editLineId
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
    if (icons.length === 0) return;
    if (hydratedLineIdRef.current === editLineId) return;

    if (loadingCartActiveSwr) {
      setLoadingSavedConfig(true);
      setSavedConfigError(null);
      return;
    }

    if (cartActiveSwrError) {
      setSavedConfigError(
        cartActiveSwrError instanceof Error
          ? cartActiveSwrError.message
          : 'Could not load this cart line configuration.'
      );
      setLoadingSavedConfig(false);
      return;
    }

    if (cartActivePayload) {
      if (cartActivePayload.error) {
        setSavedConfigError(cartActivePayload.error);
        setLoadingSavedConfig(false);
        return;
      }

      const line = cartActivePayload.order?.lines?.find((candidate) => candidate.id === editLineId);
      if (!line) {
        setSavedConfigError(`Cart line "${editLineId}" was not found in your active order.`);
        setLoadingSavedConfig(false);
        return;
      }

      const resolvedLineModelCode = resolvePkpModelCode(
        line.productVariant?.product?.slug ?? '',
        line.productVariant?.product?.name ?? line.productVariant?.name ?? ''
      );
      if (resolvedLineModelCode && resolvedLineModelCode !== resolvedModelCode) {
        setSavedConfigError(`Cart line belongs to ${resolvedLineModelCode}, not ${resolvedModelCode}.`);
        setLoadingSavedConfig(false);
        return;
      }

      const configurationRaw = line.customFields?.configuration ?? null;
      if (typeof configurationRaw !== 'string' || configurationRaw.trim().length === 0) {
        setSavedConfigError('Selected cart line has no saved configuration.');
        setLoadingSavedConfig(false);
        return;
      }

      const parsed = validateAndNormalizeConfigurationInput(configurationRaw, {
        requireComplete: false,
        slotIds,
      });
      if (!parsed.ok) {
        setSavedConfigError(parsed.error);
        setLoadingSavedConfig(false);
        return;
      }

      hydrateFromSavedConfiguration(parsed.value, icons, slotIds);
      if (parsed.value._meta?.rotation != null) {
        setPreviewRotationDeg(parsed.value._meta.rotation);
      }
      setEditLineQuantity(Math.max(1, Math.floor(line.quantity ?? 1)));
      const lastConfiguredIconId = slotIds
        .map((slotId) => parsed.value[slotId]?.iconId ?? '')
        .filter(Boolean)
        .at(-1) ?? null;
      setRecommendationSeedIconId(lastConfiguredIconId);
      setSaveStatus({ type: 'success', message: 'Loaded cart line configuration for editing.' });
      hydratedLineIdRef.current = editLineId;
      resetScopeRef.current = resetScope;
      setLoadingSavedConfig(false);
    }
  }, [
    cartActivePayload,
    cartActiveSwrError,
    editLineId,
    hydrateFromSavedConfiguration,
    icons,
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
  const isComplete = useMemo(
    () => isConfigurationComplete(configurationDraft, slotIds),
    [configurationDraft, slotIds],
  );

  const openSlot = (slotId: SlotId) => {
    setActiveSlotId(slotId);
    setPopupSlotId(slotId);
  };

  const closeSlot = () => {
    setPopupSlotId(null);
    setActiveSlotId(null);
  };

  const rotatePreview = () => {
    setPreviewRotationDeg((current) => (Math.abs(current) === 90 ? 0 : 90));
  };

  const togglePreviewGlows = () => {
    setPreviewShowGlows((current) => !current);
  };

  const addToCart = async () => {
    if (!editLineId && !keypad.productVariantId) {
      setCartStatus({ type: 'error', message: 'This keypad variant is unavailable for checkout.' });
      return;
    }

    if (!strictConfiguration) {
      setCartStatus({
        type: 'error',
        message: editLineId
          ? `Complete all ${slotCount} slots before updating this configured cart line.`
          : `Complete all ${slotCount} slots before adding this keypad to cart.`,
      });
      return;
    }

    setAddingToCart(true);
    setCartStatus(null);

    try {
      const response = editLineId
        ? await fetch('/api/cart/update-line', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            orderLineId: editLineId,
            quantity: editLineQuantity,
            configuration: {
              ...strictConfiguration,
              _meta: { rotation: previewRotationDeg },
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
                _meta: { rotation: previewRotationDeg },
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
      setLastOrderCode(payload.orderCode ?? null);
      setCartStatus({
        type: 'success',
        message: editLineId ? 'Cart line updated successfully.' : 'Configured keypad added to cart.',
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
      setCartStatus({ type: 'error', message });
    } finally {
      setAddingToCart(false);
    }
  };

  const openSaveModal = () => {
    if (!strictConfiguration) {
      setSaveStatus({ type: 'error', message: `Complete all ${slotCount} slots before saving to account.` });
      return;
    }

    if (isAuthenticated === false) {
      // Show inline login via the Saved Designs modal instead of navigating away
      setIsSavedDesignsModalOpen(true);
      return;
    }

    setSaveName(loadedSavedConfig?.name || buildDefaultSavedName(resolvedModelCode));
    setSaveStatus(null);
    setIsSaveModalOpen(true);
  };

  const submitSave = async () => {
    if (!strictConfiguration) {
      setSaveStatus({ type: 'error', message: `Complete all ${slotCount} slots before saving to account.` });
      return;
    }

    const trimmedName = saveName.trim();
    if (!trimmedName) {
      setSaveStatus({ type: 'error', message: 'Name your configuration before saving.' });
      return;
    }

    setSavingToAccount(true);
    setSaveStatus(null);

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

      setLoadedSavedConfig(payload.item);
      setSaveStatus(null);
      showToast({
        message: loadedSavedConfig
          ? `Updated "${payload.item.name}".`
          : `Saved "${payload.item.name}" to your account.`,
        ctaHref: '/account',
        ctaLabel: 'View Account',
      });
      setIsSaveModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save configuration.';
      setSaveStatus({ type: 'error', message });
    } finally {
      setSavingToAccount(false);
    }
  };

  const downloadPdf = async () => {
    if (!strictConfiguration) {
      setSaveStatus({
        type: 'error',
        message: `Complete all ${slotCount} slots before generating the engineering PDF.`,
      });
      return;
    }

    if (isAuthenticated === false) {
      const query = searchParams.toString();
      const redirectTo = `${pathname}${query ? `?${query}` : ''}`;
      window.location.assign(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    setDownloadingPdf(true);
    setSaveStatus(null);

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

      setSaveStatus({ type: 'success', message: 'PDF exported successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not generate PDF export.';
      setSaveStatus({ type: 'error', message });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const descriptionText = useMemo(() => toPlainText(keypad.description), [keypad.description]);
  const canOpenSaveAction = isAuthenticated !== null;
  const canDownloadPdf = Boolean(strictConfiguration);
  const hasVariant = Boolean(keypad.productVariantId) || Boolean(editLineId);

  const contextValue: KeypadConfiguratorContextValue = useMemo(() => ({
    state: {
      modelCode: resolvedModelCode,
      slotIds,
      slotLabels: slotLabelById,
      slots,
      popupSlotId,
      selectedIconIds,
      recommendationSeedIconId,
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
      icons,
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
        downloadingPdf,
      },
      preview: {
        rotationDeg: previewRotationDeg,
        showGlows: previewShowGlows,
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
        setRecommendationSeedIconId(icon.iconId);
      },
      setSlotGlowForSlot: (slotId, color) => {
        setSlotGlowColor(slotId, color);
      },
      rotatePreview,
      togglePreviewGlows,
      addToCart,
      openSaveModal,
      closeSaveModal: () => {
        setIsSaveModalOpen(false);
      },
      openSavedDesignsModal,
      closeSavedDesignsModal: () => {
        setIsSavedDesignsModalOpen(false);
      },
      submitSave,
      setSaveName,
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
  }), [
    resolvedModelCode, slotIds, slotLabelById, slots, popupSlotId, selectedIconIds, recommendationSeedIconId, isMobile,
    isAuthenticated, editLineId, isComplete, hasVariant, loadedSavedConfig, canOpenSaveAction, canDownloadPdf,
    isSaveModalOpen, isSavedDesignsModalOpen, saveName, icons, iconsError, savedConfigError, savedDesigns,
    savedDesignsLoading, savedDesignsError, cartStatus, saveStatus, iconsLoading, loadingSavedConfig, addingToCart,
    savingToAccount, downloadingPdf, previewRotationDeg, previewShowGlows, previewIconScale, modelRenderTuning,
    debugMode, editMode, descriptionText, reset, openSlot, closeSlot, clearSlot, selectIconForSlot, setSlotGlowColor,
    rotatePreview, togglePreviewGlows, addToCart, openSaveModal, openSavedDesignsModal, submitSave, setSaveName,
    downloadPdf, keypad, modelGeometry, configurationDraft, slotCount, loadSavedId
  ]);

  return (
    <KeypadContext value={contextValue}>
      {children}
    </KeypadContext>
  );
}
