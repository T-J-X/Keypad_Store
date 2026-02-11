'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { IconProduct } from '../lib/vendure';
import { assetUrl } from '../lib/vendure';
import { notifyCartUpdated } from '../lib/cartEvents';
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
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const priceWithVatLabel = formatPrice(primaryVariant?.priceWithTax, primaryVariant?.currencyCode);
  const priceExVatLabel = formatPriceExVatUk(primaryVariant?.priceWithTax, primaryVariant?.currencyCode);

  const onAddToCart = async () => {
    if (!primaryVariant?.id || adding) return;
    setAdding(true);
    setFeedback(null);
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
      setFeedback({ message: 'Added to cart', type: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not add this button insert to cart.';
      setFeedback({ message, type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    if (feedback?.type !== 'success') return;
    const timer = window.setTimeout(() => {
      setFeedback((current) => (current?.type === 'success' ? null : current));
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const addToCartClass = [
    'group relative isolate inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-medium text-white md:text-base',
    'bg-[linear-gradient(90deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#203f7a_0%,#2f5da8_55%,#4b7fca_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box]',
    'transition-[background,box-shadow,transform] duration-300',
    'hover:-translate-y-[1px] hover:bg-[linear-gradient(270deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#24497d_0%,#39629a_55%,#537bb0_100%)] hover:shadow-[0_0_0_1px_rgba(72,116,194,0.56),0_10px_24px_rgba(4,15,46,0.29)]',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29457A]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' ');

  return (
    <div className="card-soft group relative flex h-full flex-col gap-5 border border-surface-border/80 p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-ink/15 hover:shadow-premium">
      <Link
        href={productHref ?? `/product/${product.slug}`}
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
              className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]"
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
        <div className="flex items-center justify-between gap-3">
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
            <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(270deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.08)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-45" />
            <span className="pointer-events-none absolute -inset-[1px] -z-10 rounded-full bg-[linear-gradient(90deg,rgba(11,27,58,0.44)_0%,rgba(27,52,95,0.30)_55%,rgba(58,116,198,0.30)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-55" />
            <span className="relative z-10">{adding ? 'Adding...' : 'Add to cart'}</span>
          </button>
        </div>
        {feedback && (
          <div
            className={
              feedback.type === 'success'
                ? 'text-sm font-bold text-ink'
                : 'text-xs font-medium text-rose-700'
            }
          >
            {feedback.message}
          </div>
        )}
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
