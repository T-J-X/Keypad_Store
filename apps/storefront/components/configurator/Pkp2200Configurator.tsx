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
  serializeConfiguration,
  validateAndNormalizeConfigurationInput,
  SLOT_IDS,
  type SlotId,
} from '../../lib/keypadConfiguration';
import KeypadPreview from './KeypadPreview';
import IconSelectionPopup from './IconSelectionPopup';
import { PKP_2200_SI_LAYOUT } from './pkp2200Layout';

type IconCatalogPayload = {
  icons?: IconCatalogItem[];
  error?: string;
};

type SessionSummaryPayload = {
  authenticated?: boolean;
  error?: string;
};

type SavedConfigurationItem = {
  id: string;
  name: string;
  keypadModel: string;
  configuration: string;
  createdAt: string;
  updatedAt: string;
};

type SavedConfigurationPayload = {
  item?: SavedConfigurationItem;
  error?: string;
};

export type PilotKeypadProduct = {
  id: string;
  slug: string;
  name: string;
  modelCode: string;
  shellAssetPath: string | null;
  productVariantId: string | null;
};

function buildDefaultSavedName(modelCode: string) {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `${modelCode} ${stamp}`;
}

export default function Pkp2200Configurator({
  keypad,
}: {
  keypad: PilotKeypadProduct;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [cartStatus, setCartStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [lastOrderCode, setLastOrderCode] = useState<string | null>(null);

  const [loadedSavedConfig, setLoadedSavedConfig] = useState<SavedConfigurationItem | null>(null);
  const [loadingSavedConfig, setLoadingSavedConfig] = useState(false);
  const [savedConfigError, setSavedConfigError] = useState<string | null>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [savingToAccount, setSavingToAccount] = useState(false);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const hydratedLoadIdRef = useRef<string | null>(null);

  const loadSavedId = useMemo(() => {
    const value = searchParams.get('load');
    const normalized = value?.trim() || '';
    return normalized || null;
  }, [searchParams]);

  useEffect(() => {
    reset(keypad.modelCode);
    setLoadedSavedConfig(null);
    hydratedLoadIdRef.current = null;
  }, [keypad.modelCode, reset]);

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

        const parsed = validateAndNormalizeConfigurationInput(payload.item.configuration, { requireComplete: false });
        if (!parsed.ok) {
          throw new Error(parsed.error);
        }

        if (!cancelled) {
          hydrateFromSavedConfiguration(parsed.value, icons);
          setLoadedSavedConfig(payload.item);
          setSaveName(payload.item.name);
          hydratedLoadIdRef.current = loadSavedId;
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
  }, [hydrateFromSavedConfiguration, icons, keypad.modelCode, loadSavedId]);

  const configurationDraft = useMemo(() => buildConfigurationDraftFromSlots(slots), [slots]);
  const strictConfiguration = useMemo(() => asStrictConfiguration(configurationDraft), [configurationDraft]);
  const isComplete = useMemo(() => isConfigurationComplete(configurationDraft), [configurationDraft]);

  const openSlotPopup = (slotId: SlotId) => {
    setActiveSlotId(slotId);
    setPopupSlotId(slotId);
  };

  const closePopup = () => {
    setPopupSlotId(null);
    setActiveSlotId(null);
  };

  const onAddConfiguredKeypad = async () => {
    if (!keypad.productVariantId) {
      setCartStatus({ type: 'error', message: 'This keypad variant is unavailable for checkout.' });
      return;
    }

    if (!strictConfiguration) {
      setCartStatus({ type: 'error', message: 'Complete all 4 slots before adding this keypad to cart.' });
      return;
    }

    setAddingToCart(true);
    setCartStatus(null);

    try {
      const response = await fetch('/api/cart/add-item', {
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
        throw new Error(payload.error || 'Could not add configured keypad to cart.');
      }

      notifyCartUpdated();
      setLastOrderCode(payload.orderCode ?? null);
      setCartStatus({
        type: 'success',
        message: payload.orderCode
          ? `Configured keypad added. Order ${payload.orderCode} updated.`
          : 'Configured keypad added to cart.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not add configured keypad to cart.';
      setCartStatus({ type: 'error', message });
    } finally {
      setAddingToCart(false);
    }
  };

  const onOpenSaveModal = () => {
    if (!strictConfiguration) {
      setSaveStatus({ type: 'error', message: 'Complete all 4 slots before saving to account.' });
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
      setSaveStatus({ type: 'error', message: 'Complete all 4 slots before saving to account.' });
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
      setSaveStatus({
        type: 'success',
        message: loadedSavedConfig
          ? `Updated "${payload.item.name}".`
          : `Saved "${payload.item.name}" to your account.`,
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
    if (!lastOrderCode || !strictConfiguration) {
      setSaveStatus({ type: 'error', message: 'Add this configured keypad to cart first to generate the order PDF.' });
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
          orderCode: lastOrderCode,
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
      anchor.download = filenameMatch?.[1] || `Keypad-Config-${lastOrderCode}.pdf`;
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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-[#0f2c5a] bg-[radial-gradient(130%_120%_at_50%_0%,#1e63bc_0%,#102d5a_36%,#060f24_100%)] p-6 shadow-[0_34px_100px_rgba(2,10,28,0.45)] sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="pill bg-[#1052ab]">Pilot Configurator</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{keypad.modelCode}</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100/80">
              Select matte inserts for each slot, tune ring glow colors, save to account, and bridge directly to order PDF export.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/shop" className="inline-flex min-h-11 items-center rounded-full border border-white/35 px-4 text-sm font-semibold text-blue-50 transition hover:border-white hover:bg-white/10">
              Browse icon catalog
            </Link>
            <button
              type="button"
              onClick={() => reset(keypad.modelCode)}
              className="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:border-white/45 hover:bg-white/16"
            >
              Reset slots
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <KeypadPreview
            shellAssetPath={keypad.shellAssetPath}
            slots={slots}
            activeSlotId={popupSlotId}
            onSlotClick={openSlotPopup}
          />

          <section className="card relative border border-white/20 bg-[linear-gradient(180deg,#f7fbff_0%,#ebf2ff_100%)] p-5 shadow-[0_18px_36px_rgba(6,22,47,0.24)] sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-[#10223f]">Slot Configuration</h2>
            <p className="mt-1 text-sm text-[#3a4e72]">
              Each slot requires a valid alphanumeric icon ID before checkout and account save.
            </p>

            <div className="mt-4 space-y-2">
              {SLOT_IDS.map((slotId) => {
                const slot = slots[slotId];
                const label = PKP_2200_SI_LAYOUT[slotId].label;
                const isAssigned = Boolean(slot.iconId);

                return (
                  <div
                    key={slotId}
                    className="flex items-center justify-between rounded-2xl border border-[#d5e2f5] bg-white px-3 py-3"
                  >
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4c648a]">{label}</div>
                      <div className="mt-1 text-sm font-semibold text-[#0f2241]">
                        {slot.iconId || 'Empty'}
                      </div>
                      <div className="mt-0.5 text-xs text-[#4d5f7f]">
                        {slot.color ? `Ring ${slot.color}` : 'No glow'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openSlotPopup(slotId)}
                        className="inline-flex min-h-10 min-w-[86px] items-center justify-center rounded-full border border-[#0f3d7a] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#0f3d7a] transition hover:bg-[#0f3d7a] hover:text-white"
                      >
                        {isAssigned ? 'Edit' : 'Assign'}
                      </button>
                      {isAssigned ? (
                        <button
                          type="button"
                          onClick={() => clearSlot(slotId)}
                          className="inline-flex min-h-10 min-w-[78px] items-center justify-center rounded-full border border-[#cdd9ec] px-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#5c6f90] transition hover:border-[#8ea4c8] hover:text-[#1e3355]"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-[#b8cce8] bg-[#f4f8ff] p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f6387]">Configuration JSON</div>
              <pre className="mt-2 overflow-auto text-[11px] leading-5 text-[#1f3357]">
                {serializeConfiguration(configurationDraft)}
              </pre>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={onAddConfiguredKeypad}
                disabled={!isComplete || !keypad.productVariantId || addingToCart}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-transparent bg-[linear-gradient(90deg,#031331_0%,#0d2f63_58%,#1f59a6_100%)] px-5 text-sm font-semibold uppercase tracking-[0.13em] text-white transition hover:-translate-y-[1px] hover:shadow-[0_12px_28px_rgba(8,31,64,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingToCart ? 'Adding...' : 'Add Configured Keypad'}
              </button>

              <button
                type="button"
                onClick={onOpenSaveModal}
                disabled={!isComplete || savingToAccount || isAuthenticated === null}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#0f3d7a] bg-white px-5 text-sm font-semibold uppercase tracking-[0.13em] text-[#0f3d7a] transition hover:bg-[#0f3d7a] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadedSavedConfig ? 'Update Saved Design' : 'Save To Account'}
              </button>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={!lastOrderCode || !strictConfiguration || downloadingPdf}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#0d2f63] bg-[#e8f1ff] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#0d2f63] transition hover:bg-[#d9e9ff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloadingPdf ? 'Generating...' : 'Download PDF'}
              </button>
              <Link
                href="/account"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#cdd9ec] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#5c6f90] transition hover:border-[#8ea4c8] hover:text-[#1e3355]"
              >
                Open My Saved Designs
              </Link>
            </div>

            {!isComplete ? (
              <p className="mt-2 text-xs font-semibold text-[#8a2f2f]">
                All 4 slots must be filled before Add to cart and Save to account.
              </p>
            ) : null}

            {loadingSavedConfig ? <p className="mt-3 text-xs text-[#445f89]">Loading saved design...</p> : null}
            {iconsLoading ? <p className="mt-3 text-xs text-[#445f89]">Loading icon catalog...</p> : null}
            {iconsError ? <p className="mt-3 text-xs font-semibold text-rose-700">{iconsError}</p> : null}
            {savedConfigError ? <p className="mt-3 text-xs font-semibold text-rose-700">{savedConfigError}</p> : null}
            {cartStatus ? (
              <p className={cartStatus.type === 'success' ? 'mt-3 text-sm font-semibold text-[#123f2f]' : 'mt-3 text-sm font-semibold text-rose-700'}>
                {cartStatus.message}
              </p>
            ) : null}
            {saveStatus ? (
              <p className={saveStatus.type === 'success' ? 'mt-3 text-sm font-semibold text-[#123f2f]' : 'mt-3 text-sm font-semibold text-rose-700'}>
                {saveStatus.message}
              </p>
            ) : null}
            <div className="mt-4">
              <Link href="/cart" className="text-sm font-semibold text-[#0f3d7a] underline underline-offset-4">
                Review cart
              </Link>
            </div>
          </section>
        </div>
      </div>

      <IconSelectionPopup
        isOpen={popupSlotId != null}
        slotLabel={popupSlotId ? PKP_2200_SI_LAYOUT[popupSlotId].label : 'Slot'}
        icons={icons}
        selectedIconId={popupSlotId ? slots[popupSlotId].iconId : null}
        selectedColor={popupSlotId ? slots[popupSlotId].color : null}
        onSelectIcon={(icon) => {
          if (!popupSlotId) return;
          selectIconForSlot(popupSlotId, icon);
        }}
        onSelectColor={(color) => {
          if (!popupSlotId) return;
          setSlotGlowColor(popupSlotId, color);
        }}
        onClose={closePopup}
      />

      {isSaveModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <h3 className="text-lg font-semibold text-ink">Name your configuration</h3>
            <p className="mt-1 text-sm text-ink/60">This name appears in your account under My Saved Designs.</p>

            <input
              type="text"
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              maxLength={160}
              className="mt-4 w-full rounded-full border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-ink/30"
              placeholder="My Racing Setup"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink"
                disabled={savingToAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onSubmitSave()}
                disabled={savingToAccount}
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingToAccount ? 'Saving...' : loadedSavedConfig ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
