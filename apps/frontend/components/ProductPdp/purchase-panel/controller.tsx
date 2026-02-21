'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useReducer } from 'react';
import { categorySlug } from '../../../lib/vendure';
import { notifyCartUpdated } from '../../../lib/cartEvents';
import { useUIStore } from '../../../lib/uiStore';
import PurchasePanelView from './PurchasePanelView';
import { initialPurchasePanelState, purchasePanelReducer } from './reducer';
import type { PurchasePanelProps } from './types';

const BUY_NOW_REDIRECT = '/cart';

export default function PurchasePanelController({
  productName,
  productTypeLabel,
  iconId,
  categories,
  compatibilityLinkHref,
  productSlug,
  priceExVatLabel,
  priceWithVatLabel,
  productVariantId,
  stock,
  priceAndStockSlot,
}: PurchasePanelProps) {
  const router = useRouter();
  const showToast = useUIStore((state) => state.showToast);
  const [state, dispatch] = useReducer(purchasePanelReducer, initialPurchasePanelState);
  const authPromptTitleId = useId();
  const authPromptDescriptionId = useId();

  const safeIconId = iconId.trim() || '—';
  const categoryItems = useMemo(
    () => Array.from(
      new Map(
        categories
          .map((category) => category.trim())
          .filter(Boolean)
          .map((category) => [categorySlug(category), category] as const),
      ).entries(),
    ).map(([slug, label]) => ({ slug, label })),
    [categories],
  );

  const numericStockLeft = useMemo(() => {
    if (typeof stock.quantityLeft === 'number' && Number.isFinite(stock.quantityLeft)) {
      return Math.max(0, Math.floor(stock.quantityLeft));
    }
    return null;
  }, [stock.quantityLeft]);

  const maxQuantity = useMemo(() => {
    if (numericStockLeft !== null) return numericStockLeft;
    return 99;
  }, [numericStockLeft]);

  const canPurchase = Boolean(productVariantId)
    && stock.available
    && (numericStockLeft === null || numericStockLeft > 0);

  useEffect(() => {
    const timer = window.setTimeout(() => dispatch({ type: 'set_pulse', pulse: false }), 4500);
    return () => window.clearTimeout(timer);
  }, []);

  const addToCart = async (nextQuantity: number) => {
    if (!productVariantId) throw new Error('This item is unavailable for checkout.');
    const response = await fetch('/api/cart/add-item', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productVariantId, quantity: nextQuantity }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || 'Could not add this item to cart.');
    }
    notifyCartUpdated();
    router.refresh();
  };

  const onAddToCart = async () => {
    if (!canPurchase || state.adding || state.buyingNow) return;
    dispatch({ type: 'add_start' });
    try {
      await addToCart(state.quantity);
      showToast({
        message: state.quantity === 1 ? 'Added to cart' : `Added ${state.quantity} to cart`,
        ctaHref: '/cart',
        ctaLabel: 'View cart',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not add this item to cart.';
      dispatch({ type: 'set_error', message });
    } finally {
      dispatch({ type: 'add_finish' });
    }
  };

  const onBuyNow = async () => {
    if (!canPurchase || state.adding || state.buyingNow) return;
    dispatch({ type: 'buy_start' });
    try {
      await addToCart(state.quantity);
      router.push(BUY_NOW_REDIRECT);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not continue to cart.';
      dispatch({ type: 'set_error', message });
      dispatch({ type: 'buy_finish' });
    }
  };

  const onWishlist = async () => {
    if (state.wishlistSaving) return;
    if (!isAuthenticated()) {
      dispatch({ type: 'set_auth_prompt', open: true });
      return;
    }

    dispatch({ type: 'wishlist_start' });
    try {
      const saved = await toggleWishlist({
        productSlug,
        productVariantId,
      });
      showToast({
        message: saved ? 'Saved to wishlist' : 'Removed from wishlist',
        ctaHref: '/account',
        ctaLabel: 'View account',
      });
    } catch {
      dispatch({ type: 'set_error', message: 'Could not update wishlist right now.' });
    } finally {
      dispatch({ type: 'wishlist_finish' });
    }
  };

  const onQuantityInput = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D+/g, '');
    if (!digitsOnly) {
      dispatch({ type: 'set_quantity', quantity: 1 });
      return;
    }
    const parsed = Number.parseInt(digitsOnly, 10);
    if (!Number.isFinite(parsed)) {
      dispatch({ type: 'set_quantity', quantity: 1 });
      return;
    }
    dispatch({ type: 'set_quantity', quantity: clampQuantity(parsed, maxQuantity) });
  };

  const onDecreaseQuantity = () => {
    dispatch({ type: 'set_quantity', quantity: clampQuantity(state.quantity - 1, maxQuantity) });
  };

  const onIncreaseQuantity = () => {
    dispatch({ type: 'set_quantity', quantity: clampQuantity(state.quantity + 1, maxQuantity) });
  };

  const onQuantityBlur = () => {
    dispatch({ type: 'set_quantity', quantity: clampQuantity(state.quantity, maxQuantity) });
  };

  return (
    <PurchasePanelView
      productName={productName}
      productTypeLabel={productTypeLabel}
      safeIconId={safeIconId}
      categoryItems={categoryItems}
      compatibilityLinkHref={compatibilityLinkHref}
      priceExVatLabel={priceExVatLabel}
      priceWithVatLabel={priceWithVatLabel}
      priceAndStockSlot={priceAndStockSlot}
      numericStockLeft={numericStockLeft}
      stockLabel={humanizeStockLevel(stock.label)}
      canPurchase={canPurchase}
      quantity={state.quantity}
      maxQuantity={maxQuantity}
      adding={state.adding}
      pulse={state.pulse}
      buyingNow={state.buyingNow}
      wishlistSaving={state.wishlistSaving}
      errorMessage={state.errorMessage}
      showAuthPrompt={state.showAuthPrompt}
      authPromptTitleId={authPromptTitleId}
      authPromptDescriptionId={authPromptDescriptionId}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      onWishlist={onWishlist}
      onCloseAuthPrompt={() => dispatch({ type: 'set_auth_prompt', open: false })}
      onDecreaseQuantity={onDecreaseQuantity}
      onIncreaseQuantity={onIncreaseQuantity}
      onQuantityInput={onQuantityInput}
      onQuantityBlur={onQuantityBlur}
    />
  );
}

function isAuthenticated() {
  if (typeof document === 'undefined') return false;
  const cookie = document.cookie.toLowerCase();
  return (
    cookie.includes('vendure-auth=') ||
    cookie.includes('vendure-auth-token=') ||
    cookie.includes('auth_token=') ||
    cookie.includes('customer_token=') ||
    cookie.includes('logged_in=')
  );
}

function clampQuantity(value: number, max: number) {
  if (!Number.isFinite(value)) return 1;
  const safeMax = Number.isFinite(max) ? Math.max(0, Math.floor(max)) : 99;
  if (safeMax === 0) return 1;
  return Math.max(1, Math.min(safeMax, Math.floor(value)));
}

function humanizeStockLevel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 'Status unavailable';
  if (normalized === 'in_stock' || normalized === 'instock' || normalized === 'in stock') return 'In stock';
  if (normalized === 'low_stock' || normalized === 'lowstock' || normalized === 'low stock') return 'Low stock';
  if (normalized === 'out_of_stock' || normalized === 'outofstock' || normalized === 'out of stock') return 'Out of stock';
  return value;
}

async function toggleWishlist({
  productSlug,
  productVariantId,
}: {
  productSlug: string;
  productVariantId?: string;
}) {
  try {
    const response = await fetch('/api/wishlist/toggle', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productSlug, productVariantId }),
    });
    if (response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { saved?: boolean };
      return payload.saved !== false;
    }
    if (response.status !== 404) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || 'Wishlist request failed.');
    }
  } catch {
    // Fallback keeps wishlist functional until backend endpoint exists.
  }

  const key = 'kp_store_wishlist';
  const currentRaw = window.localStorage.getItem(key);
  const parsed = JSON.parse(currentRaw || '[]') as unknown;
  const current = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  const exists = current.includes(productSlug);
  const next = exists ? current.filter((item) => item !== productSlug) : [...current, productSlug];
  window.localStorage.setItem(key, JSON.stringify(next));
  return !exists;
}
