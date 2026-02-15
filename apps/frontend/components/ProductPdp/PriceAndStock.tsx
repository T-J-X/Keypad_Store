import type { VendureProductVariant } from '../../lib/vendure';
import { fetchProductBySlug } from '../../lib/vendure.server';

function formatMinorPrice(minorUnits: number, currencyCode?: string | null) {
  const currency = currencyCode || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(minorUnits / 100);
  } catch {
    return `${(minorUnits / 100).toFixed(2)} ${currency}`;
  }
}

function formatPrice(priceWithTax?: number | null, currencyCode?: string | null) {
  if (typeof priceWithTax !== 'number') return null;
  return formatMinorPrice(priceWithTax, currencyCode);
}

function formatPriceExVatUk(priceWithTax?: number | null, currencyCode?: string | null) {
  if (typeof priceWithTax !== 'number') return null;
  const exVatMinor = Math.round(priceWithTax / 1.2);
  return formatMinorPrice(exVatMinor, currencyCode);
}

function resolveStockSummary(variant?: VendureProductVariant) {
  if (!variant) {
    return {
      label: 'Out of stock',
      quantityLeft: 0,
      available: false,
    };
  }

  if (typeof variant.stockOnHand === 'number' && Number.isFinite(variant.stockOnHand)) {
    const allocated = (typeof variant.stockAllocated === 'number' && Number.isFinite(variant.stockAllocated))
      ? variant.stockAllocated
      : 0;
    const left = Math.max(0, Math.floor(variant.stockOnHand - allocated));
    return {
      label: left > 0 ? 'In stock' : 'Out of stock',
      quantityLeft: left,
      available: left > 0,
    };
  }

  const rawStock = (variant.stockLevel ?? '').trim();
  if (!rawStock) {
    return {
      label: 'Stock status unavailable',
      quantityLeft: null,
      available: true,
    };
  }

  const normalized = rawStock.toLowerCase();
  if (normalized === 'out_of_stock' || normalized === 'out of stock' || normalized === 'outofstock') {
    return {
      label: 'Out of stock',
      quantityLeft: null,
      available: false,
    };
  }
  if (normalized === 'low_stock' || normalized === 'low stock' || normalized === 'lowstock') {
    return {
      label: 'Low stock',
      quantityLeft: null,
      available: true,
    };
  }
  if (normalized === 'in_stock' || normalized === 'in stock' || normalized === 'instock') {
    return {
      label: 'In stock',
      quantityLeft: null,
      available: true,
    };
  }

  return {
    label: rawStock,
    quantityLeft: null,
    available: true,
  };
}

type PriceAndStockProps = {
  slug: string;
  showStock?: boolean;
};

export default async function PriceAndStock({ slug, showStock = true }: PriceAndStockProps) {
  const product = await fetchProductBySlug(slug);
  const primaryVariant = product?.variants?.[0];
  const stock = resolveStockSummary(primaryVariant);
  const priceWithVatLabel = formatPrice(primaryVariant?.priceWithTax, primaryVariant?.currencyCode);
  const priceExVatLabel = formatPriceExVatUk(primaryVariant?.priceWithTax, primaryVariant?.currencyCode) ?? 'Price unavailable';

  return (
    <>
      <div className="space-y-1">
        <div className="text-sm font-semibold uppercase tracking-wide text-ink/55">Price</div>
        <div className="flex items-end gap-2">
          <div className="text-3xl font-semibold tracking-tight text-ink">{priceWithVatLabel ?? priceExVatLabel}</div>
          <div className="pb-1 text-xs font-semibold tracking-wide text-ink/60">(INCL VAT)</div>
        </div>
        <div className="text-xs font-semibold tracking-wide text-ink/55">{priceExVatLabel} (EXCL VAT)</div>
      </div>

      {showStock ? (
        <div className="rounded-xl bg-white/80 px-3 py-2 text-sm text-ink/75">
          {typeof stock.quantityLeft === 'number'
            ? `Stock: ${stock.quantityLeft} left`
            : `Stock: ${stock.label}`}
        </div>
      ) : null}
    </>
  );
}
