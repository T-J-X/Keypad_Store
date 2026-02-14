'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ConfiguredKeypadThumbnail from '../../components/configurator/ConfiguredKeypadThumbnail';
import { notifyCartUpdated } from '../../lib/cartEvents';
import { RING_GLOW_OPTIONS } from '../../lib/configuratorCatalog';
import {
  buildConfiguredIconLookupFromPayload,
  countConfiguredSlots,
  emptyPreviewConfiguration,
  parseConfigurationForPreview,
  resolvePreviewSlotIds,
  type ConfiguredIconLookup,
} from '../../lib/configuredKeypadPreview';
import { resolvePkpModelCode } from '../../lib/keypadUtils';
import { assetUrl } from '../../lib/vendure';
import { getGeometryForModel } from '../../config/layouts/geometry';

type CartOrderLine = {
  id: string;
  quantity: number;
  linePriceWithTax: number;
  customFields?: {
    configuration?: string | null;
  } | null;
  productVariant: {
    id: string;
    name: string;
    currencyCode: string;
    product: {
      id: string;
      slug: string | null;
      name: string | null;
      featuredAsset: {
        preview: string | null;
        source: string | null;
      } | null;
    } | null;
  } | null;
};

type CartOrder = {
  id: string;
  code: string;
  currencyCode: string;
  totalQuantity: number;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  lines: CartOrderLine[];
};

type CartPayload = {
  order?: CartOrder | null;
  error?: string;
};

type IconCatalogPayload = {
  icons?: Array<{
    iconId: string;
    name?: string;
    matteAssetPath: string | null;
    categories: string[];
  }>;
  error?: string;
};

const SWATCH_LABEL_BY_HEX = new Map(
  RING_GLOW_OPTIONS
    .filter((option): option is { label: string; value: string } => typeof option.value === 'string')
    .map((option) => [option.value.toUpperCase(), option.label]),
);

function slotLabel(slotId: string, modelCode: string | null) {
  if (modelCode) {
    const geometry = getGeometryForModel(modelCode);
    const label = geometry.slots[slotId]?.label;
    if (label) return label;
  }
  return slotId.replace('_', ' ');
}

function normalizeHex(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

function swatchDescription(value: string | null | undefined) {
  const hex = normalizeHex(value);
  if (!hex) return 'No glow';
  const label = SWATCH_LABEL_BY_HEX.get(hex);
  return label ? `${label} (${hex})` : `Custom (${hex})`;
}

export default function CartPage() {
  const [order, setOrder] = useState<CartOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [iconLookup, setIconLookup] = useState<ConfiguredIconLookup>(new Map());

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cart/active', {
        method: 'GET',
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => ({}))) as CartPayload;
      if (!response.ok) {
        throw new Error(payload.error || 'Could not load your cart right now.');
      }

      setOrder(payload.order ?? null);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Could not load your cart right now.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    let cancelled = false;

    const loadIconCatalog = async () => {
      try {
        const response = await fetch('/api/configurator/icon-catalog', {
          method: 'GET',
          cache: 'no-store',
        });

        const payload = (await response.json().catch(() => ({}))) as IconCatalogPayload;
        if (!response.ok) return;

        if (!cancelled) {
          const icons = payload.icons ?? [];
          setIconLookup(buildConfiguredIconLookupFromPayload(icons));
        }
      } catch {
        // Keep empty map and fallback preview placeholders.
      }
    };

    void loadIconCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasLines = (order?.lines?.length ?? 0) > 0;

  const orderTotals = useMemo(() => {
    if (!order) {
      return {
        subTotal: formatMinor(0, 'USD'),
        shipping: formatMinor(0, 'USD'),
        total: formatMinor(0, 'USD'),
      };
    }

    return {
      subTotal: formatMinor(order.subTotalWithTax, order.currencyCode),
      shipping: formatMinor(order.shippingWithTax, order.currencyCode),
      total: formatMinor(order.totalWithTax, order.currencyCode),
    };
  }, [order]);

  const updateLine = useCallback(async (orderLineId: string, quantity: number) => {
    setActiveLineId(orderLineId);
    setError(null);

    try {
      const response = await fetch('/api/cart/update-line', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ orderLineId, quantity }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Could not update this cart line.');
      }

      notifyCartUpdated();
      await loadCart();
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Could not update this cart line.';
      setError(message);
    } finally {
      setActiveLineId(null);
    }
  }, [loadCart]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#0f2c5a] bg-[radial-gradient(130%_130%_at_50%_0%,#1b5dae_0%,#0e2a55_36%,#050f23_100%)] p-5 shadow-[0_34px_100px_rgba(2,10,28,0.45)] sm:p-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Cart</h1>
            <p className="mt-1 text-sm text-blue-100/80">Review your selected keypad components before checkout.</p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-blue-50 transition hover:border-white hover:bg-white/10"
          >
            Continue shopping
          </Link>
        </div>

        {isLoading ? (
          <div className="card-soft border-white/12 bg-[#081a35]/72 p-6 text-sm text-blue-100/80">Loading your cart…</div>
        ) : null}

        {!isLoading && error ? (
          <div className="card-soft border border-rose-400/45 bg-rose-950/35 p-6 text-sm font-medium text-rose-100">{error}</div>
        ) : null}

        {!isLoading && !error && !hasLines ? (
          <div className="card-soft border-white/12 bg-[#081a35]/72 p-8 text-center">
            <p className="text-base font-semibold text-white">Your cart is empty.</p>
            <p className="mt-2 text-sm text-blue-100/75">Add products from the shop to see them here.</p>
            <div className="mt-5">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-full border border-[#1EA7FF]/45 bg-[#1EA7FF]/12 px-5 py-2.5 text-sm font-semibold text-blue-50 transition hover:bg-[#1EA7FF]/24"
              >
                Browse products
              </Link>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && hasLines && order ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="card-soft overflow-hidden border-white/12 bg-[#081a35]/72">
            <ul className="divide-y divide-white/10">
              {order.lines.map((line) => {
                const productSlug = line.productVariant?.product?.slug;
                const modelCode = resolvePkpModelCode(
                  productSlug ?? '',
                  line.productVariant?.product?.name ?? line.productVariant?.name ?? '',
                ) || null;
                const imagePath = line.productVariant?.product?.featuredAsset?.preview
                  || line.productVariant?.product?.featuredAsset?.source
                  || '';
                const imageSrc = imagePath ? assetUrl(imagePath) : '';
                const configurationRaw = line.customFields?.configuration ?? null;
                const hasConfiguration = typeof configurationRaw === 'string' && configurationRaw.trim().length > 0;
                const previewConfiguration = hasConfiguration
                  ? parseConfigurationForPreview(configurationRaw)
                  : null;
                const slotIds = resolvePreviewSlotIds({
                  modelCode,
                  configuration: previewConfiguration,
                });
                const configuredSlots = countConfiguredSlots(previewConfiguration);
                const configurationRows = previewConfiguration
                  ? slotIds.reduce<Array<{
                      slotId: string;
                      label: string;
                      iconId: string;
                      iconName: string;
                      glow: string;
                    }>>((rows, slotId) => {
                      const row = previewConfiguration[slotId];
                      const iconId = row?.iconId?.trim() || null;
                      if (!iconId) return rows;
                      const iconEntry = iconLookup.get(iconId);
                      const iconName = iconEntry?.iconName?.trim() || iconId;
                      rows.push({
                        slotId,
                        label: slotLabel(slotId, modelCode),
                        iconId,
                        iconName,
                        glow: swatchDescription(row?.color ?? null),
                      });
                      return rows;
                    }, [])
                  : [];
                const editConfigurationHref = hasConfiguration && productSlug
                  ? `/configurator/${productSlug}?lineId=${encodeURIComponent(line.id)}`
                  : null;
                const isUpdatingLine = activeLineId === line.id;

                return (
                  <li key={line.id} className="flex gap-4 p-4 sm:p-5">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#020916]">
                      {hasConfiguration ? (
                        <ConfiguredKeypadThumbnail
                          modelCode={modelCode}
                          shellAssetPath={imagePath || null}
                          configuration={previewConfiguration ?? emptyPreviewConfiguration()}
                          iconLookup={iconLookup}
                          size="sm"
                        />
                      ) : imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={line.productVariant?.name || 'Product image'}
                          fill
                          className="object-contain p-2"
                          sizes="80px"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      {productSlug ? (
                        <Link href={`/product/${productSlug}`} className="text-sm font-semibold text-white transition hover:underline">
                          {line.productVariant?.name || line.productVariant?.product?.name || 'Product'}
                        </Link>
                      ) : (
                        <div className="text-sm font-semibold text-white">
                          {line.productVariant?.name || line.productVariant?.product?.name || 'Product'}
                        </div>
                      )}
                      {hasConfiguration ? (
                        <div className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#9dcfff]">
                          Custom configuration: {configuredSlots}/{slotIds.length} slots defined
                        </div>
                      ) : null}

                      {configurationRows.length > 0 ? (
                        <div className="mt-2 rounded-xl border border-white/14 bg-[#081831]/65 p-2.5">
                          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-100/70">
                            Engineering spec
                          </div>
                          <ul className="space-y-1.5">
                            {configurationRows.map((row) => (
                              <li key={`${line.id}-${row.slotId}`} className="text-[11px] text-blue-50/90">
                                <span className="font-semibold text-white">{row.label}:</span>{' '}
                                {row.iconName} [{row.iconId}] · {row.glow}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="mt-3 inline-flex items-center rounded-full border border-white/20 bg-white/[0.08]">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateLine(line.id, Math.max(1, line.quantity - 1))}
                          disabled={isUpdatingLine || line.quantity <= 1}
                          className="h-8 w-8 rounded-l-full text-sm text-blue-50 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="min-w-[2.2rem] px-2 text-center text-sm font-semibold text-white">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateLine(line.id, line.quantity + 1)}
                          disabled={isUpdatingLine}
                          className="h-8 w-8 rounded-r-full text-sm text-blue-50 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      {editConfigurationHref ? (
                        <Link
                          href={editConfigurationHref}
                          className="ml-3 inline-flex items-center rounded-full border border-[#1EA7FF]/45 bg-[#1EA7FF]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.11em] text-[#b7e7ff] transition hover:border-[#6fd0ff] hover:bg-[#1EA7FF]/20"
                        >
                          Edit Configuration
                        </Link>
                      ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm('Remove this item from your cart?')) return;
                            void updateLine(line.id, 0);
                          }}
                          disabled={isUpdatingLine}
                          className="ml-3 text-xs font-semibold text-blue-100/70 underline-offset-4 transition hover:text-rose-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                        >
                        Remove
                      </button>
                    </div>

                    <div className="text-right text-sm font-semibold text-white">
                      {formatMinor(line.linePriceWithTax, line.productVariant?.currencyCode || order.currencyCode)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="card-soft h-fit border-white/12 bg-[#081a35]/72 p-5">
            <h2 className="text-base font-semibold text-white">Order summary</h2>
            <div className="mt-1 text-xs text-blue-100/70">Order code: {order.code}</div>
            <div className="mt-4 space-y-2 text-sm text-blue-100/85">
              <div className="flex items-center justify-between">
                <span>Items ({order.totalQuantity})</span>
                <span>{orderTotals.subTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>{orderTotals.shipping}</span>
              </div>
            </div>
            <div className="my-4 h-px bg-white/12" />
            <div className="flex items-center justify-between text-base font-semibold text-white">
              <span>Total</span>
              <span>{orderTotals.total}</span>
            </div>
            <Link
              href="/checkout"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#1EA7FF]/45 bg-[#1EA7FF]/12 px-5 py-3 text-sm font-semibold text-blue-50 transition hover:bg-[#1EA7FF]/24"
            >
              Proceed to Checkout
            </Link>
          </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatMinor(minor: number | null | undefined, currencyCode: string) {
  const value = typeof minor === 'number' && Number.isFinite(minor) ? minor : 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 2,
    }).format(value / 100);
  } catch {
    return `${(value / 100).toFixed(2)} ${currencyCode || 'USD'}`;
  }
}
