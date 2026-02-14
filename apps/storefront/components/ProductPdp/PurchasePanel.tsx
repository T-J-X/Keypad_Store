'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { categorySlug } from '../../lib/vendure';
import { notifyCartUpdated } from '../../lib/cartEvents';
import { useUIStore } from '../../lib/uiStore';
import AccessibleModal from '../ui/AccessibleModal';

type StockSummary = {
  label: string;
  quantityLeft: number | null;
  available: boolean;
};

const BUY_NOW_REDIRECT = '/cart';

export default function PurchasePanel({
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
}: {
  productName: string;
  productTypeLabel: string;
  iconId: string;
  categories: string[];
  compatibilityLinkHref: string;
  productSlug: string;
  priceExVatLabel: string;
  priceWithVatLabel?: string | null;
  productVariantId?: string;
  stock: StockSummary;
  priceAndStockSlot?: ReactNode;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [buyingNow, setBuyingNow] = useState(false);
  const [wishlistSaving, setWishlistSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const authPromptTitleId = useId();
  const authPromptDescriptionId = useId();
  const showToast = useUIStore((state) => state.showToast);
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

  const loading = adding;

  useEffect(() => {
    const timer = window.setTimeout(() => setPulse(false), 4500);
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
  };

  const onAddToCart = async () => {
    if (!canPurchase || adding || buyingNow) return;
    setAdding(true);
    setErrorMessage(null);
    try {
      await addToCart(quantity);
      showToast({
        message: quantity === 1 ? 'Added to cart' : `Added ${quantity} to cart`,
        ctaHref: '/cart',
        ctaLabel: 'View cart',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not add this item to cart.';
      setErrorMessage(message);
    } finally {
      setAdding(false);
    }
  };

  const onBuyNow = async () => {
    if (!canPurchase || adding || buyingNow) return;
    setBuyingNow(true);
    setErrorMessage(null);
    try {
      await addToCart(quantity);
      router.push(BUY_NOW_REDIRECT);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not continue to cart.';
      setErrorMessage(message);
      setBuyingNow(false);
    }
  };

  const onWishlist = async () => {
    if (wishlistSaving) return;
    if (!isAuthenticated()) {
      setShowAuthPrompt(true);
      return;
    }

    setWishlistSaving(true);
    setErrorMessage(null);
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
      setErrorMessage('Could not update wishlist right now.');
    } finally {
      setWishlistSaving(false);
    }
  };

  const onQuantityInput = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D+/g, '');
    if (!digitsOnly) {
      setQuantity(1);
      return;
    }
    const parsed = Number.parseInt(digitsOnly, 10);
    if (!Number.isFinite(parsed)) {
      setQuantity(1);
      return;
    }
    setQuantity(clampQuantity(parsed, maxQuantity));
  };

  return (
    <section className="card-soft space-y-4 p-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">{productName}</h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">{productTypeLabel}</p>
      </div>

      <dl className="space-y-3 text-sm text-ink/75">
        <div className="flex flex-col gap-1">
          <dt className="font-semibold text-ink">Button Insert ID</dt>
          <dd className="text-ink/80">{safeIconId}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="font-semibold text-ink">Categories</dt>
          <dd className="flex flex-wrap gap-2">
            {categoryItems.length > 0 ? (
              categoryItems.map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop?section=button-inserts&cats=${encodeURIComponent(category.slug)}&cat=${encodeURIComponent(category.slug)}&page=1`}
                  className="flex items-center gap-2 rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70 transition hover:border-ink/25"
                >
                  <span>Category: {category.label}</span>
                </Link>
              ))
            ) : (
              <span className="text-ink/50">—</span>
            )}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="font-semibold text-ink">Compatibility</dt>
          <dd>
            <Link href={compatibilityLinkHref} className="text-ink underline underline-offset-4 hover:text-ink/75">
              Compatible with PKP-SI series 15mm Keypads only
            </Link>
          </dd>
        </div>
      </dl>

      {priceAndStockSlot ? (
        priceAndStockSlot
      ) : (
        <>
          <div className="space-y-1">
            <div className="text-sm font-semibold uppercase tracking-wide text-ink/55">Price</div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-semibold tracking-tight text-ink">{priceWithVatLabel ?? priceExVatLabel}</div>
              <div className="pb-1 text-xs font-semibold tracking-wide text-ink/60">(INCL VAT)</div>
            </div>
            <div className="text-xs font-semibold tracking-wide text-ink/55">{priceExVatLabel} (EXCL VAT)</div>
          </div>

          <div className="rounded-xl bg-white/80 px-3 py-2 text-sm text-ink/75">
            {numericStockLeft !== null ? `Stock: ${numericStockLeft} left` : `Stock: ${humanizeStockLevel(stock.label)}`}
          </div>
        </>
      )}

      <div className="space-y-2 text-sm">
        <div className="font-semibold text-ink">Quantity</div>
        <div className="inline-flex h-9 items-stretch overflow-hidden rounded-full bg-white ring-1 ring-inset ring-neutral-200">
          <button
            type="button"
            onClick={() => setQuantity((current) => clampQuantity(current - 1, maxQuantity))}
            className="grid w-9 place-items-center rounded-l-full rounded-r-none text-ink transition-colors hover:bg-black hover:text-white active:bg-neutral-900 active:text-white disabled:opacity-40"
            disabled={quantity <= 1 || adding || buyingNow || !canPurchase}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={String(quantity)}
            onChange={(event) => onQuantityInput(event.target.value)}
            onBlur={() => setQuantity((current) => clampQuantity(current, maxQuantity))}
            className="w-10 bg-transparent text-center text-sm font-semibold tabular-nums text-ink outline-none"
            aria-label="Quantity"
          />
          <button
            type="button"
            onClick={() => setQuantity((current) => clampQuantity(current + 1, maxQuantity))}
            className="grid w-9 place-items-center rounded-l-none rounded-r-full text-ink transition-colors hover:bg-black hover:text-white active:bg-neutral-900 active:text-white disabled:opacity-40"
            disabled={adding || buyingNow || !canPurchase || quantity >= maxQuantity}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-12 grid gap-3">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!canPurchase || adding || buyingNow}
          className={[
            'group relative isolate inline-flex w-full items-center justify-center gap-2 rounded-full border border-transparent px-6 py-4 text-sm font-medium text-white',
            'bg-[linear-gradient(90deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#203f7a_0%,#2f5da8_55%,#4b7fca_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box]',
            'transition-[background,box-shadow,transform] duration-300',
            'hover:-translate-y-[1px] hover:bg-[linear-gradient(270deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#24497d_0%,#39629a_55%,#537bb0_100%)] hover:shadow-[0_0_0_1px_rgba(72,116,194,0.56),0_10px_24px_rgba(4,15,46,0.29)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29457A]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            pulse ? 'animate-soft-pulse' : '',
            'disabled:cursor-not-allowed disabled:opacity-50',
          ].join(' ')}
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(270deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.08)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-45" />
          <span className="pointer-events-none absolute -inset-[1px] -z-10 rounded-full bg-[linear-gradient(90deg,rgba(11,27,58,0.44)_0%,rgba(27,52,95,0.30)_55%,rgba(58,116,198,0.30)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-55" />
          {loading ? (
            <>
              <span className="relative z-10 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />
              <span className="relative z-10">Adding...</span>
            </>
          ) : (
            <span className="relative z-10">Add to cart</span>
          )}
        </button>

        <button
          type="button"
          onClick={onBuyNow}
          disabled={!canPurchase || adding || buyingNow}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-transparent px-5 py-3 text-sm font-medium text-white bg-[linear-gradient(90deg,#0a2518_0%,#123322_52%,#000000_100%),linear-gradient(90deg,#123726_0%,#184531_52%,#10241a_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box] transition-[background,box-shadow,transform] duration-300 hover:-translate-y-[1px] hover:bg-[linear-gradient(270deg,#0d2b1c_0%,#163d2a_52%,#060606_100%),linear-gradient(270deg,#1c543b_0%,#276e4c_52%,#1a4c36_100%)] hover:shadow-[0_0_0_1px_rgba(52,124,88,0.66),0_10px_22px_rgba(7,29,17,0.28)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5136]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buyingNow ? 'Processing...' : 'Buy now'}
        </button>

        <button
          type="button"
          onClick={onWishlist}
          disabled={wishlistSaving}
          className="inline-flex w-full items-center justify-center rounded-full border-2 border-transparent px-5 py-2.5 text-sm font-semibold text-neutral-950 bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#a3a3a3,#a3a3a3)] [background-origin:border-box] [background-clip:padding-box,border-box] transition-[background,transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(90deg,#4e84d8_0%,#6da5f5_55%,#8ab8ff_100%)] hover:shadow-[0_8px_18px_rgba(4,15,46,0.14)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {wishlistSaving ? 'Saving...' : 'Wishlist'}
        </button>
      </div>

      {!canPurchase && (
        <p className="text-xs font-semibold text-rose-700">
          This product is currently unavailable for checkout.
        </p>
      )}

      {errorMessage ? <p className="text-sm font-semibold text-rose-700">{errorMessage}</p> : null}

      <AccessibleModal
        open={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        labelledBy={authPromptTitleId}
        describedBy={authPromptDescriptionId}
        backdropClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
        panelClassName="card w-full max-w-md space-y-4 p-6"
      >
        <h3 id={authPromptTitleId} className="text-xl font-semibold tracking-tight text-ink">Sign in required</h3>
        <p id={authPromptDescriptionId} className="text-sm text-ink/65">
          Sign in to save <span className="font-semibold text-ink">{productName}</span> to your wishlist.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/login"
            className="group relative isolate inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-tight text-white bg-neutral-950 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] ring-1 ring-inset ring-white/10 transition-[transform,box-shadow,background,ring-color] duration-200 hover:ring-sky-400/60 hover:shadow-[0_12px_36px_-18px_rgba(56,189,248,0.35)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-neutral-950 bg-white ring-1 ring-inset ring-neutral-200 transition-[transform,box-shadow,background] duration-200 hover:bg-neutral-50 hover:shadow-sm active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Create account
          </Link>
          <button
            type="button"
            onClick={() => setShowAuthPrompt(false)}
            className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-neutral-950 bg-transparent ring-1 ring-inset ring-neutral-200 transition-[background,transform] duration-200 hover:bg-neutral-50 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            Not now
          </button>
        </div>
      </AccessibleModal>
    </section>
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
