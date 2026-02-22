'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { IconProduct } from '../lib/vendure';
import { assetUrl } from '../lib/vendure';
import { notifyCartUpdated } from '../lib/cartEvents';
import { useUIStore } from '../lib/uiStore';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: IconProduct;
  categoryLabel: string;
  categoryHref?: string;
  productHref?: string;
  replaceProductNavigation?: boolean;
  layout?: 'grid' | 'list';
}

export default function ProductCard({
  product,
  categoryLabel,
  categoryHref,
  productHref,
  replaceProductNavigation = false,
  layout = 'grid',
}: ProductCardProps) {
  const isList = layout === 'list';
  const image = product.featuredAsset?.preview ?? product.featuredAsset?.source ?? '';
  const iconId = product.customFields?.iconId ?? product.name;
  const productImageAlt = `${product.name} ${categoryLabel} button insert ${iconId}`.replace(/\s+/g, ' ').trim();
  const primaryVariant = product.variants?.[0];
  const [adding, setAdding] = useState(false);
  const showToast = useUIStore((state) => state.showToast);

  const priceWithVatLabel = formatPrice(primaryVariant?.priceWithTax, primaryVariant?.currencyCode);
  const priceExVatLabel = formatPriceExVatUk(primaryVariant?.priceWithTax, primaryVariant?.currencyCode);

  const onAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!primaryVariant?.id || adding) return;
    setAdding(true);
    try {
      const response = await fetch('/api/cart/add-item', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productVariantId: primaryVariant.id, quantity: 1 }),
      });

      if (!response.ok) throw new Error('Could not add item');

      notifyCartUpdated();
      showToast({
        message: 'Added to cart',
        ctaHref: '/cart',
        ctaLabel: 'View cart',
      });
    } catch (error) {
      console.error(error);
      showToast({ message: 'Failed to add item', ctaLabel: '', ctaHref: '' });
    } finally {
      setAdding(false);
    }
  };

  const finalProductHref = productHref ?? `/shop/product/${product.slug}`;

  return (
    <div className={`group relative flex ${isList ? 'flex-row items-center gap-4 p-2' : 'flex-col'} rounded-2xl border border-surface-border bg-white transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_18px_38px_-18px_rgba(14,17,26,0.34)] motion-safe:animate-fade-up`}>
      {/* Image Container */}
      <Link
        href={finalProductHref}
        className={`relative overflow-hidden ${isList ? 'h-24 w-24 rounded-xl' : 'aspect-square w-full rounded-t-2xl'} bg-surface-alt flex items-center justify-center ${isList ? 'p-2' : 'p-6'}`}
        replace={replaceProductNavigation}
      >
        {image ? (
          <div className="relative h-[70%] w-[70%]">
            <Image
              src={assetUrl(image)}
              alt={productImageAlt}
              fill
              className="object-contain object-center transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-alt text-ink-subtle">
            No Image
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/[0.02]" />
      </Link>

      {/* Content */}
      <div className={`flex flex-1 flex-col ${isList ? 'justify-center pr-4' : 'p-4 sm:p-5'}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          {categoryHref ? (
            <Link
              href={categoryHref}
              className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle transition-colors hover:text-sky"
              onClick={(e) => e.stopPropagation()}
            >
              {categoryLabel}
            </Link>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              {categoryLabel}
            </span>
          )}
          <span className="font-mono text-[10px] font-medium text-ink-subtle/70">{iconId}</span>
        </div>

        <Link
          href={finalProductHref}
          className="group/title mb-auto block"
          replace={replaceProductNavigation}
        >
          <h3 className="font-medium text-ink transition-colors group-hover/title:text-sky line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Price & Action */}
        <div className={`mt-4 flex items-center justify-between ${isList ? '' : 'border-t border-surface-border pt-3'}`}>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">
              {priceWithVatLabel || 'Unavailable'}
            </span>
            {priceWithVatLabel && (
              <span className="text-[9px] font-medium text-ink-muted">
                Incl VAT
                {priceExVatLabel ? ` · Ex VAT ${priceExVatLabel}` : ''}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onAddToCart}
            disabled={adding || !primaryVariant?.id}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-50 ${adding
              ? 'bg-ink-muted text-white cursor-wait'
              : 'bg-surface-alt text-ink hover:bg-ink hover:text-white hover:scale-105'
              }`}
            aria-label={adding ? 'Adding to cart' : `Add ${product.name} to cart`}
          >
            {adding ? (
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPrice(priceWithTax?: number | null, currencyCode?: string | null) {
  if (typeof priceWithTax !== 'number') return null;
  const currency = (currencyCode || 'GBP').toUpperCase();
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(priceWithTax / 100);
  } catch {
    return `${(priceWithTax / 100).toFixed(2)} ${currency}`;
  }
}

function formatPriceExVatUk(priceWithTax?: number | null, currencyCode?: string | null) {
  if (typeof priceWithTax !== 'number') return null;
  const currency = (currencyCode || 'GBP').toUpperCase();
  if (currency !== 'GBP') return null;
  const exVatMinor = Math.round(priceWithTax / 1.2);
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(exVatMinor / 100);
  } catch {
    return `${(exVatMinor / 100).toFixed(2)} ${currency}`;
  }
}
