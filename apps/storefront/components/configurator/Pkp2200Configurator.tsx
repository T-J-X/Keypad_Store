'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { notifyCartUpdated } from '../../lib/cartEvents';
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
import { resolvePkpModelCode } from '../../lib/keypadUtils';
import {
  getGeometryForModel,
  getSlotIdsForGeometry,
} from '../../config/layouts/geometry';
import ConfiguratorActions from './ConfiguratorActions';
import ConfigurationSidebar from './ConfigurationSidebar';
import KeypadPreview from './KeypadPreview';
import IconSelectionPopup from './IconSelectionPopup';
import SaveDesignModal from './SaveDesignModal';
import type { PilotKeypadProduct, SavedConfigurationItem, StatusMessage } from './types';
import { useUIStore } from '../../lib/uiStore';

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

const DEFAULT_PREVIEW_ICON_SCALE_BY_MODEL: Record<string, number> = {
  'PKP-2300-SI': 1.02,
  'PKP-2500-SI': 1.28,
  'PKP-2600-SI': 1.28,
};

export default function Pkp2200Configurator({
  keypad,
}: {
  keypad: PilotKeypadProduct;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const modelGeometry = useMemo(() => getGeometryForModel(keypad.modelCode), [keypad.modelCode]);
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
  const [icons, setIcons] = useState<IconCatalogItem[]>([]);
  const [iconsLoading, setIconsLoading] = useState(true);
  const [iconsError, setIconsError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [cartStatus, setCartStatus] = useState<StatusMessage | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [lastOrderCode, setLastOrderCode] = useState<string | null>(null);

  const [loadedSavedConfig, setLoadedSavedConfig] = useState<SavedConfigurationItem | null>(null);
  const [loadingSavedConfig, setLoadingSavedConfig] = useState(false);
  const [savedConfigError, setSavedConfigError] = useState<string | null>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveStatus, setSaveStatus] = useState<StatusMessage | null>(null);
  const [savingToAccount, setSavingToAccount] = useState(false);

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
    () => `${pathname ?? ''}::${keypad.slug}::${keypad.modelCode}::${loadSavedId ?? ''}::${editLineId ?? ''}`,
    [editLineId, keypad.modelCode, keypad.slug, loadSavedId, pathname],
  );

  const debugSlots = useMemo(() => searchParams.get('debugSlots') === '1', [searchParams]);
  const previewIconScaleFromQuery = useMemo(() => {
    const raw = searchParams.get('iconScale');
    if (!raw) return undefined;
    const value = Number.parseFloat(raw);
    if (!Number.isFinite(value) || value <= 0) return undefined;
    return Math.max(0.4, Math.min(1.26, value));
  }, [searchParams]);
  const previewIconScale = useMemo(
    () => previewIconScaleFromQuery ?? DEFAULT_PREVIEW_ICON_SCALE_BY_MODEL[keypad.modelCode] ?? undefined,
    [keypad.modelCode, previewIconScaleFromQuery],
  );
  const previewRotationFromQuery = useMemo(() => {
    const value = Number.parseFloat(searchParams.get('rotationDeg') || '0');
    if (!Number.isFinite(value)) return 0;
    return Math.max(-180, Math.min(180, value));
  }, [searchParams]);
  const showGlowsFromQuery = useMemo(() => searchParams.get('showGlows') !== '0', [searchParams]);
  const [previewRotationDeg, setPreviewRotationDeg] = useState(previewRotationFromQuery);
  const [previewShowGlows, setPreviewShowGlows] = useState(showGlowsFromQuery);

  useEffect(() => {
    setPreviewRotationDeg(previewRotationFromQuery);
  }, [previewRotationFromQuery]);

  useEffect(() => {
    setPreviewShowGlows(showGlowsFromQuery);
  }, [showGlowsFromQuery]);

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

    reset(keypad.modelCode, slotIds);
    setLoadedSavedConfig(null);
    setSavedConfigError(null);
    setSaveStatus(null);
    setCartStatus(null);
    setEditLineQuantity(1);
    setRecommendationSeedIconId(null);
    hydratedLoadIdRef.current = null;
    hydratedLineIdRef.current = null;
    resetScopeRef.current = resetScope;
  }, [keypad.modelCode, reset, resetScope, slotIds]);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/session/summary', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          if (!cancelled) setIsAuthenticated(false);
          return;
        }

        const payload = (await response.json().catch(() => ({}))) as SessionSummaryPayload;
        if (!cancelled) {
          setIsAuthenticated(payload.authenticated === true);
        }
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadIconCatalog = async () => {
      setIconsLoading(true);
      setIconsError(null);

      try {
        const response = await fetch('/api/configurator/icon-catalog', {
          method: 'GET',
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => ({}))) as IconCatalogPayload;

        if (!response.ok) {
          throw new Error(payload.error || 'Could not load icon catalog.');
        }

        if (!cancelled) {
          setIcons(payload.icons ?? []);
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Could not load icon catalog.';
        setIconsError(message);
      } finally {
        if (!cancelled) {
          setIconsLoading(false);
        }
      }
    };

    void loadIconCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

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

    let cancelled = false;

    const loadSavedConfiguration = async () => {
      setLoadingSavedConfig(true);
      setSavedConfigError(null);

      try {
        const response = await fetch(`/api/account/saved-configurations/${encodeURIComponent(loadSavedId)}`, {
          method: 'GET',
          cache: 'no-store',
        });

        const payload = (await response.json().catch(() => ({}))) as SavedConfigurationPayload;

        if (!response.ok || !payload.item) {
          throw new Error(payload.error || 'Could not load saved configuration.');
        }

        if (payload.item.keypadModel !== keypad.modelCode) {
          throw new Error(
            `Saved configuration belongs to ${payload.item.keypadModel}, not ${keypad.modelCode}.`,
          );
        }

        const parsed = validateAndNormalizeConfigurationInput(payload.item.configuration, {
          requireComplete: false,
          slotIds,
        });
        if (!parsed.ok) {
          throw new Error(parsed.error);
        }

        if (!cancelled) {
          hydrateFromSavedConfiguration(parsed.value, icons, slotIds);
          setLoadedSavedConfig(payload.item);
          setSaveName(payload.item.name);
          const lastConfiguredIconId = slotIds
            .map((slotId) => parsed.value[slotId]?.iconId ?? '')
            .filter(Boolean)
            .at(-1) ?? null;
          setRecommendationSeedIconId(lastConfiguredIconId);
          hydratedLoadIdRef.current = loadSavedId;
          resetScopeRef.current = resetScope;
          setSaveStatus({ type: 'success', message: `Loaded saved design "${payload.item.name}".` });
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Could not load saved configuration.';
        setSavedConfigError(message);
      } finally {
        if (!cancelled) {
          setLoadingSavedConfig(false);
        }
      }
    };

    void loadSavedConfiguration();

    return () => {
      cancelled = true;
    };
  }, [editLineId, hydrateFromSavedConfiguration, icons, keypad.modelCode, loadSavedId, resetScope, slotIds]);

  useEffect(() => {
    if (!editLineId) {
      hydratedLineIdRef.current = null;
      return;
    }

    if (icons.length === 0) return;
    if (hydratedLineIdRef.current === editLineId) return;

    let cancelled = false;

    const loadConfigurationFromCartLine = async () => {
      setLoadingSavedConfig(true);
      setSavedConfigError(null);

      try {
        const response = await fetch('/api/cart/active', {
          method: 'GET',
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => ({}))) as ActiveCartPayload;
        if (!response.ok) {
          throw new Error(payload.error || 'Could not load your active cart.');
        }

        const line = payload.order?.lines?.find((candidate) => candidate.id === editLineId);
        if (!line) {
          throw new Error(`Cart line "${editLineId}" was not found in your active order.`);
        }

        const resolvedLineModelCode = resolvePkpModelCode(
          line.productVariant?.product?.slug ?? '',
          line.productVariant?.product?.name ?? line.productVariant?.name ?? '',
        );
        if (resolvedLineModelCode && resolvedLineModelCode !== keypad.modelCode) {
          throw new Error(
            `Cart line belongs to ${resolvedLineModelCode}, not ${keypad.modelCode}.`,
          );
        }

        const configurationRaw = line.customFields?.configuration ?? null;
        if (typeof configurationRaw !== 'string' || configurationRaw.trim().length === 0) {
          throw new Error('Selected cart line has no saved configuration.');
        }

        const parsed = validateAndNormalizeConfigurationInput(configurationRaw, {
          requireComplete: false,
          slotIds,
        });
        if (!parsed.ok) {
          throw new Error(parsed.error);
        }

        if (!cancelled) {
          hydrateFromSavedConfiguration(parsed.value, icons, slotIds);
          setEditLineQuantity(Math.max(1, Math.floor(line.quantity ?? 1)));
          const lastConfiguredIconId = slotIds
            .map((slotId) => parsed.value[slotId]?.iconId ?? '')
            .filter(Boolean)
            .at(-1) ?? null;
          setRecommendationSeedIconId(lastConfiguredIconId);
          setSaveStatus({ type: 'success', message: 'Loaded cart line configuration for editing.' });
          hydratedLineIdRef.current = editLineId;
          resetScopeRef.current = resetScope;
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Could not load this cart line configuration.';
        setSavedConfigError(message);
      } finally {
        if (!cancelled) {
          setLoadingSavedConfig(false);
        }
      }
    };

    void loadConfigurationFromCartLine();

    return () => {
      cancelled = true;
    };
  }, [editLineId, hydrateFromSavedConfiguration, icons, keypad.modelCode, loadSavedId, resetScope, slotIds]);

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

  const openSlotPopup = (slotId: SlotId) => {
    setActiveSlotId(slotId);
    setPopupSlotId(slotId);
  };

  const closePopup = () => {
    setPopupSlotId(null);
    setActiveSlotId(null);
  };

  const rotatePreview = () => {
    setPreviewRotationDeg((current) => (Math.abs(current) === 90 ? 0 : 90));
  };

  const togglePreviewGlows = () => {
    setPreviewShowGlows((current) => !current);
  };

  const onAddConfiguredKeypad = async () => {
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
              configuration: strictConfiguration,
            }),
          })
        : await fetch('/api/cart/add-item', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              productVariantId: keypad.productVariantId,
              quantity: 1,
              customFields: {
                configuration: strictConfiguration,
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

  const onOpenSaveModal = () => {
    if (!strictConfiguration) {
      setSaveStatus({ type: 'error', message: `Complete all ${slotCount} slots before saving to account.` });
      return;
    }

    if (isAuthenticated === false) {
      const query = searchParams.toString();
      const redirectTo = `${pathname}${query ? `?${query}` : ''}`;
      window.location.assign(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    setSaveName(loadedSavedConfig?.name || buildDefaultSavedName(keypad.modelCode));
    setSaveStatus(null);
    setIsSaveModalOpen(true);
  };

  const onSubmitSave = async () => {
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
          keypadModel: keypad.modelCode,
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

  const onDownloadPdf = async () => {
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
          designName: loadedSavedConfig?.name ?? `${keypad.modelCode} Design`,
          modelCode: keypad.modelCode,
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
      anchor.download = filenameMatch?.[1] || `Keypad-Config-${keypad.modelCode}.pdf`;
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

  const keypadDescription = useMemo(() => toPlainText(keypad.description), [keypad.description]);
  const canOpenSaveAction = isAuthenticated !== null;
  const canDownloadPdf = Boolean(strictConfiguration);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-10 sm:px-6 lg:px-8 lg:pb-20">
      <div className="overflow-hidden rounded-3xl border border-[#0f2c5a] bg-[radial-gradient(130%_120%_at_50%_0%,#1e63bc_0%,#102d5a_36%,#060f24_100%)] p-6 shadow-[0_34px_100px_rgba(2,10,28,0.45)] sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="pill bg-[#1052ab]">{editLineId ? 'Edit Configuration' : 'Pilot Configurator'}</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{keypad.modelCode}</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100/80">
              {editLineId
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
              onClick={() => reset(keypad.modelCode, slotIds)}
              className="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/16"
            >
              Reset slots
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <KeypadPreview
            modelCode={keypad.modelCode}
            shellAssetPath={keypad.shellAssetPath}
            slots={slots}
            activeSlotId={popupSlotId}
            onSlotClick={openSlotPopup}
            rotationDeg={previewRotationDeg}
            iconScale={previewIconScale}
            debugSlots={debugSlots}
            descriptionText={keypadDescription}
            showGlows={previewShowGlows}
            onRotate={rotatePreview}
            onToggleGlows={togglePreviewGlows}
          />

          <ConfigurationSidebar
            slotIds={slotIds}
            slotLabels={slotLabelById}
            slots={slots}
            isComplete={isComplete}
            loadingSavedConfig={loadingSavedConfig}
            iconsLoading={iconsLoading}
            iconsError={iconsError}
            savedConfigError={savedConfigError}
            cartStatus={cartStatus}
            saveStatus={saveStatus}
            onOpenSlotPopup={openSlotPopup}
            onClearSlot={clearSlot}
          >
            {!isMobile ? (
              <ConfiguratorActions
                variant="inline"
                isComplete={isComplete}
                hasVariant={Boolean(keypad.productVariantId) || Boolean(editLineId)}
                isEditingLine={Boolean(editLineId)}
                addingToCart={addingToCart}
                savingToAccount={savingToAccount}
                downloadingPdf={downloadingPdf}
                canOpenSave={canOpenSaveAction}
                canDownloadPdf={canDownloadPdf}
                hasLoadedSavedConfig={Boolean(loadedSavedConfig)}
                onAddToCart={onAddConfiguredKeypad}
                onOpenSaveModal={onOpenSaveModal}
                onDownloadPdf={onDownloadPdf}
              />
            ) : (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onDownloadPdf}
                  disabled={!canDownloadPdf || downloadingPdf}
                  className="btn-ghost-strong inline-flex min-h-11 items-center justify-center px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#0d2f63] transition hover:border-[#6d88b6] hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloadingPdf ? 'Generating...' : 'Download PDF'}
                </button>
                <Link
                  href="/account"
                  className="btn-ghost-strong inline-flex min-h-11 items-center justify-center px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#5c6f90] transition hover:border-[#8ea4c8] hover:bg-white/80 hover:text-[#1e3355]"
                >
                  Open My Saved Designs
                </Link>
              </div>
            )}
          </ConfigurationSidebar>
        </div>
      </div>

      {isMobile ? (
        <ConfiguratorActions
          variant="sticky"
          isComplete={isComplete}
          hasVariant={Boolean(keypad.productVariantId) || Boolean(editLineId)}
          isEditingLine={Boolean(editLineId)}
          addingToCart={addingToCart}
          savingToAccount={savingToAccount}
          downloadingPdf={downloadingPdf}
          canOpenSave={canOpenSaveAction}
          canDownloadPdf={canDownloadPdf}
          hasLoadedSavedConfig={Boolean(loadedSavedConfig)}
          onAddToCart={onAddConfiguredKeypad}
          onOpenSaveModal={onOpenSaveModal}
          onDownloadPdf={onDownloadPdf}
        />
      ) : null}

      <IconSelectionPopup
        isOpen={popupSlotId != null}
        isMobile={isMobile}
        slotSizeMm={modelGeometry.slotSizeMm}
        slotLabel={popupSlotId ? slotLabelById[popupSlotId] ?? 'Slot' : 'Slot'}
        icons={icons}
        selectedIconId={popupSlotId ? slots[popupSlotId]?.iconId ?? null : null}
        selectedColor={popupSlotId ? slots[popupSlotId]?.color ?? null : null}
        selectedIconIds={selectedIconIds}
        recommendationSeedIconId={recommendationSeedIconId}
        onSelectIcon={(icon) => {
          if (!popupSlotId) return;
          selectIconForSlot(popupSlotId, icon);
          setRecommendationSeedIconId(icon.iconId);
        }}
        onSelectColor={(color) => {
          if (!popupSlotId) return;
          setSlotGlowColor(popupSlotId, color);
        }}
        onClose={closePopup}
      />

      <SaveDesignModal
        isOpen={isSaveModalOpen}
        saveName={saveName}
        onSaveNameChange={setSaveName}
        savingToAccount={savingToAccount}
        hasLoadedSavedConfig={Boolean(loadedSavedConfig)}
        onClose={() => setIsSaveModalOpen(false)}
        onSubmit={() => void onSubmitSave()}
      />
    </div>
  );
}
