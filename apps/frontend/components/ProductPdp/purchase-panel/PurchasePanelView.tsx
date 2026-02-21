import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '../../ui/Button';
import type { CategoryItem } from './types';
import QuantityStepper from './subcomponents/QuantityStepper';
import AuthPromptModal from './subcomponents/AuthPromptModal';

type PurchasePanelViewProps = {
  productName: string;
  productTypeLabel: string;
  safeIconId: string;
  categoryItems: CategoryItem[];
  compatibilityLinkHref: string;
  priceExVatLabel: string;
  priceWithVatLabel?: string | null;
  priceAndStockSlot?: ReactNode;
  numericStockLeft: number | null;
  stockLabel: string;
  canPurchase: boolean;
  quantity: number;
  maxQuantity: number;
  adding: boolean;
  pulse: boolean;
  buyingNow: boolean;
  wishlistSaving: boolean;
  errorMessage: string | null;
  showAuthPrompt: boolean;
  authPromptTitleId: string;
  authPromptDescriptionId: string;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onWishlist: () => void;
  onCloseAuthPrompt: () => void;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
  onQuantityInput: (value: string) => void;
  onQuantityBlur: () => void;
};

export default function PurchasePanelView({
  productName,
  productTypeLabel,
  safeIconId,
  categoryItems,
  compatibilityLinkHref,
  priceExVatLabel,
  priceWithVatLabel,
  priceAndStockSlot,
  numericStockLeft,
  stockLabel,
  canPurchase,
  quantity,
  maxQuantity,
  adding,
  pulse,
  buyingNow,
  wishlistSaving,
  errorMessage,
  showAuthPrompt,
  authPromptTitleId,
  authPromptDescriptionId,
  onAddToCart,
  onBuyNow,
  onWishlist,
  onCloseAuthPrompt,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onQuantityInput,
  onQuantityBlur,
}: PurchasePanelViewProps) {
  const loading = adding;

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
            {numericStockLeft !== null ? `Stock: ${numericStockLeft} left` : `Stock: ${stockLabel}`}
          </div>
        </>
      )}

      <QuantityStepper
        quantity={quantity}
        maxQuantity={maxQuantity}
        canPurchase={canPurchase}
        adding={adding}
        buyingNow={buyingNow}
        onDecrease={onDecreaseQuantity}
        onIncrease={onIncreaseQuantity}
        onInput={onQuantityInput}
        onBlur={onQuantityBlur}
      />

      <div className="mt-12 grid gap-3">
        <Button
          type="button"
          onClick={onAddToCart}
          disabled={!canPurchase || adding || buyingNow}
          variant="premium"
          className={`w-full ${pulse ? 'animate-soft-pulse' : ''} min-h-[44px]`}
        >
          {loading ? (
            <>
              <span className="relative z-10 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none mr-2" />
              <span className="relative z-10">Adding…</span>
            </>
          ) : (
            <span className="relative z-10">Add to Cart</span>
          )}
        </Button>

        <button
          type="button"
          onClick={onBuyNow}
          disabled={!canPurchase || adding || buyingNow}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-transparent px-5 py-3 text-sm font-medium text-white whitespace-nowrap bg-[linear-gradient(90deg,#0a2518_0%,#123322_52%,#000000_100%),linear-gradient(90deg,#123726_0%,#184531_52%,#10241a_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box] transition-[background,box-shadow,transform] duration-300 hover:-translate-y-[1px] hover:bg-[linear-gradient(270deg,#0d2b1c_0%,#163d2a_52%,#060606_100%),linear-gradient(270deg,#1c543b_0%,#276e4c_52%,#1a4c36_100%)] hover:shadow-[0_0_0_1px_rgba(52,124,88,0.66),0_10px_22px_rgba(7,29,17,0.28)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5136]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buyingNow ? 'Processing…' : 'Buy Now'}
        </button>

        <button
          type="button"
          onClick={onWishlist}
          disabled={wishlistSaving}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border-2 border-transparent px-5 py-2.5 text-sm font-semibold text-neutral-950 whitespace-nowrap bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#a3a3a3,#a3a3a3)] [background-origin:border-box] [background-clip:padding-box,border-box] transition-[background,transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(90deg,#4e84d8_0%,#6da5f5_55%,#8ab8ff_100%)] hover:shadow-[0_8px_18px_rgba(4,15,46,0.14)] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {wishlistSaving ? 'Saving…' : 'Wishlist'}
        </button>
      </div>

      {!canPurchase && (
        <p className="text-xs font-semibold text-rose-700">
          This product is currently unavailable for checkout.
        </p>
      )}

      {errorMessage ? <p className="text-sm font-semibold text-rose-700">{errorMessage}</p> : null}

      <AuthPromptModal
        open={showAuthPrompt}
        onClose={onCloseAuthPrompt}
        labelledBy={authPromptTitleId}
        describedBy={authPromptDescriptionId}
        productName={productName}
      />
    </section>
  );
}
