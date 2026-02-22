'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Button } from './ui/button';
import ConfiguredKeypadThumbnail from './configurator/ConfiguredKeypadThumbnail';
import { notifyCartUpdated } from '../lib/cartEvents';
import { RING_GLOW_OPTIONS } from '../lib/configuratorCatalog';
import {
    buildConfiguredIconLookupFromPayload,
    countConfiguredSlots,
    emptyPreviewConfiguration,
    parseConfigurationForPreview,
    resolvePreviewSlotIds,
    type ConfiguredIconLookup,
} from '../lib/configuredKeypadPreview';
import { resolvePkpModelCode } from '../lib/keypadUtils';
import { assetUrl } from '../lib/vendure';
import { getGeometryForModel } from '../config/layouts/geometry';
import type { CartOrder } from '../lib/vendure.server';

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

type IconLookupPayloadItem = {
    iconId: string;
    name?: string;
    matteAssetPath: string | null;
    categories: string[];
};

export default function CartClient({ order, iconCatalog }: { order: CartOrder | null; iconCatalog: IconLookupPayloadItem[] }) {
    const router = useRouter();
    const [activeLineId, setActiveLineId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [iconLookup] = useState<ConfiguredIconLookup>(() => buildConfiguredIconLookupFromPayload(iconCatalog));

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

            // refresh the server component to get new data
            router.refresh();

        } catch (nextError) {
            const message = nextError instanceof Error ? nextError.message : 'Could not update this cart line.';
            setError(message);
        } finally {
            setActiveLineId(null);
        }
    }, [router]);

    return (
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 lg:flex lg:min-h-[calc(100dvh-17rem)] lg:flex-col">
            <div className="card-panel p-5 sm:p-6 lg:my-auto">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Cart</h1>
                        <p className="mt-1 text-sm text-panel-muted">Review your selected keypad components before checkout.</p>
                    </div>
                    <Button asChild variant="secondaryDark" className="w-full sm:w-auto">
                        <Link href="/shop">Continue shopping</Link>
                    </Button>
                </div>

                {error ? (
                    <div className="card-soft border border-rose-400/45 bg-rose-950/35 p-6 text-sm font-medium text-rose-100">{error}</div>
                ) : null}

                {!error && !hasLines ? (
                    <div className="card-panel bg-panel-light p-8 text-center">
                        <p className="text-base font-semibold text-white">Your cart is empty.</p>
                        <p className="mt-2 text-sm text-panel-muted">Add products from the shop to see them here.</p>
                        <div className="mt-5">
                            <Button asChild variant="premium" className="w-full sm:w-auto">
                                <Link href="/shop">Browse products</Link>
                            </Button>
                        </div>
                    </div>
                ) : null}

                {!error && hasLines && order ? (
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <section className="card-panel bg-panel-light overflow-hidden">
                            <ul className="divide-y divide-white/5">
                                {order.lines.map((line) => {
                                    const productSlug = line.productVariant?.product?.slug;
                                    const encodedProductSlug = productSlug ? encodeURIComponent(productSlug) : null;
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
                                    const editConfigurationHref = hasConfiguration && encodedProductSlug
                                        ? `/configurator/keypad/${encodedProductSlug}?lineId=${encodeURIComponent(line.id)}`
                                        : null;
                                    const isUpdatingLine = activeLineId === line.id;

                                    return (
                                        <li key={line.id} className="flex gap-4 p-4 sm:p-5">
                                            <div className={`relative shrink-0 overflow-hidden rounded-xl border border-white/15 flex items-center justify-center ${hasConfiguration ? 'h-20 w-24 bg-[#020916] sm:h-24 sm:w-32' : 'h-20 w-20 bg-white'}`}>
                                                {hasConfiguration ? (
                                                    <ConfiguredKeypadThumbnail
                                                        modelCode={modelCode}
                                                        shellAssetPath={imagePath || null}
                                                        configuration={previewConfiguration ?? emptyPreviewConfiguration()}
                                                        iconLookup={iconLookup}
                                                        size="fill"
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
                                                {encodedProductSlug ? (
                                                    <Link href={`/shop/product/${encodedProductSlug}`} className="text-sm font-semibold text-white transition hover:underline">
                                                        {line.productVariant?.name || line.productVariant?.product?.name || 'Product'}
                                                    </Link>
                                                ) : (
                                                    <div className="text-sm font-semibold text-white">
                                                        {line.productVariant?.name || line.productVariant?.product?.name || 'Product'}
                                                    </div>
                                                )}

                                                {!hasConfiguration ? (
                                                    <div className="mt-1 space-y-0.5">
                                                        {line.productVariant?.sku ? (
                                                            <div className="text-[11px] text-panel-muted">
                                                                Insert Code: <span className="font-mono text-white/80">{line.productVariant.sku}</span>
                                                            </div>
                                                        ) : null}
                                                        {line.productVariant?.product?.category ? (
                                                            <div className="text-[11px] text-panel-muted">
                                                                Category: <span className="text-white/80">{line.productVariant.product.category}</span>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : null}

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
                                            </div>

                                            <div className="flex flex-col items-end gap-2 text-right">
                                                <div className="text-sm font-semibold text-white">
                                                    {formatMinor(line.linePriceWithTax, line.productVariant?.currencyCode || order.currencyCode)}
                                                </div>

                                                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.08]">
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
                                                    <div className="mt-1">
                                                        <Link
                                                            href={editConfigurationHref}
                                                            className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#b7e7ff] underline underline-offset-4 transition hover:text-[#6fd0ff] hover:no-underline"
                                                        >
                                                            Edit Config
                                                        </Link>
                                                    </div>
                                                ) : null}

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!window.confirm('Remove this item from your cart?')) return;
                                                        void updateLine(line.id, 0);
                                                    }}
                                                    disabled={isUpdatingLine}
                                                    className="text-xs font-semibold text-blue-100/70 underline-offset-4 transition hover:text-rose-300 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>

                        <aside className="card-panel bg-panel-light h-fit p-5">
                            <h2 className="text-base font-semibold text-white">Order summary</h2>
                            <div className="mt-1 text-xs text-panel-muted">Order code: {order.code}</div>
                            <div className="mt-4 space-y-2 text-sm text-panel-muted">
                                <div className="flex items-center justify-between">
                                    <span>Items ({order.totalQuantity})</span>
                                    <span>{orderTotals.subTotal}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Shipping</span>
                                    <span>{orderTotals.shipping}</span>
                                </div>
                            </div>
                            <div className="my-4 h-px bg-white/5" />
                            <div className="flex items-center justify-between text-base font-semibold text-white">
                                <span>Total</span>
                                <span>{orderTotals.total}</span>
                            </div>
                            <Button asChild variant="premium" className="mt-5 w-full">
                                <Link href="/checkout" prefetch={false}>Proceed to Checkout</Link>
                            </Button>
                        </aside>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
