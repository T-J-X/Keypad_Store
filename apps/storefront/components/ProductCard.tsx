'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { IconProduct } from '../lib/vendure';
import { assetUrl } from '../lib/vendure';
import { notifyCartUpdated } from '../lib/cartEvents';
import { useUIStore } from '../lib/uiStore';
import {
  cardIdentifierTextClass,
  cardPlaceholderTextClass,
  cardSupportingTextClass,
  cardTitleTextClass,
} from './cardTypography';

const placeholder = (
  <div
    className={`flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 via-white to-slate-200 ${cardPlaceholderTextClass}`}
  >
    Render pending
  </div>
);

export default function ProductCard({
  product,
  categoryLabel,
  categoryHref,
  productHref,
  replaceProductNavigation = false,
}: {
  product: IconProduct;
  categoryLabel: string;
  categoryHref?: string;
  productHref?: string;
  replaceProductNavigation?: boolean;
}) {
  const image = product.featuredAsset?.preview ?? product.featuredAsset?.source ?? '';
  const iconId = product.customFields?.iconId ?? product.name;
  const primaryVariant = product.variants?.[0];
  const [adding, setAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const showToast = useUIStore((state) => state.showToast);

  const priceWithVatLabel = formatPrice(primaryVariant?.priceWithTax, primaryVariant?.currencyCode);
  const priceExVatLabel = formatPriceExVatUk(primaryVariant?.priceWithTax, primaryVariant?.currencyCode);

  const onAddToCart = async () => {
    if (!primaryVariant?.id || adding) return;
    setAdding(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/cart/add-item', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productVariantId: primaryVariant.id, quantity: 1 }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Could not add this button insert to cart.');
      }
      notifyCartUpdated();
      showToast({
        message: 'Added to cart',
        ctaHref: '/cart',
        ctaLabel: 'View cart',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not add this button insert to cart.';
      setErrorMessage(message);
    } finally {
      setAdding(false);
    }
  };

  const addToCartClass = 'btn-primary w-full gap-2 text-xs sm:text-sm md:text-base';

  return (
    <div className="card group relative flex h-full flex-col gap-3 p-3.5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-premium sm:gap-5 sm:p-5">
      <Link
        href={productHref ?? `/shop/product/${product.slug}`}
        replace={replaceProductNavigation}
        aria-label={`View ${product.name}`}
        className="absolute inset-0 z-0 rounded-2xl"
      />
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-4">
        {image ? (
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[linear-gradient(to_bottom,#f4f4f5_0%,#e4e4e7_50%,#ffffff_100%)]">
            <Image
              src={assetUrl(image)}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03] sm:p-6"
              loading="lazy"
            />
          </div>
        ) : (
          placeholder
        )}
        <div className="space-y-1.5">
          <div className={cardTitleTextClass}>{product.name}</div>
          <div className={cardIdentifierTextClass}>{iconId}</div>
          {categoryHref ? (
            <Link
              href={categoryHref}
              onClick={(event) => event.stopPropagation()}
              className={`${cardSupportingTextClass} pointer-events-auto relative z-20 inline-flex text-[11px] uppercase tracking-widest text-ink-subtle transition hover:text-ink hover:underline`}
            >
              {categoryLabel}
            </Link>
          ) : (
            <div className={`${cardSupportingTextClass} text-[11px] uppercase tracking-widest text-ink-subtle`}>{categoryLabel}</div>
          )}
        </div>
      </div>
      <div className="relative z-20 mt-auto space-y-2">
        <div className="space-y-3">
          <div className="space-y-0.5">
            <div className="flex items-end gap-1.5">
              <div className="text-sm font-bold tracking-tight text-ink md:text-base">
                {priceWithVatLabel || 'Price unavailable'}
              </div>
              {priceWithVatLabel && (
                <div className="pb-0.5 text-[10px] font-semibold tracking-wide text-ink/55">(INCL)</div>
              )}
            </div>
            {priceExVatLabel && (
              <div className="text-[10px] font-semibold tracking-wide text-ink/55">{priceExVatLabel} (EXCL)</div>
            )}
          </div>
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!primaryVariant?.id || adding}
            className={addToCartClass}
          >
            <span className="relative z-10">{adding ? 'Adding…' : 'Add to Cart'}</span>
          </button>
        </div>
        {errorMessage ? <div className="text-xs font-medium text-rose-700">{errorMessage}</div> : null}
      </div>
    </div>
  );
}

function formatPrice(priceWithTax?: number | null, currencyCode?: string | null) {
  if (typeof priceWithTax !== 'number') return null;
  const currency = currencyCode || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(priceWithTax / 100);
  } catch {
    return `${(priceWithTax / 100).toFixed(2)} ${currency}`;
  }
}

function formatPriceExVatUk(priceWithTax?: number | null, currencyCode?: string | null) {
  if (typeof priceWithTax !== 'number') return null;
  const exVatMinor = Math.round(priceWithTax / 1.2);
  return formatPrice(exVatMinor, currencyCode);
}
