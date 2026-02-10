import Image from 'next/image';
import type { ReactNode } from 'react';
import { assetUrl, type CatalogProduct } from '../../lib/vendure';
import PurchasePanel from './PurchasePanel';

export default function ProductHero({
  product,
  productTypeLabel,
  iconId,
  categories,
  compatibilityLinkHref,
  priceExVatLabel,
  priceWithVatLabel,
  productVariantId,
  stock,
  priceAndStockSlot,
}: {
  product: CatalogProduct;
  productTypeLabel: string;
  iconId: string;
  categories: string[];
  compatibilityLinkHref: string;
  priceExVatLabel: string;
  priceWithVatLabel?: string | null;
  productVariantId?: string;
  stock: {
    label: string;
    quantityLeft: number | null;
    available: boolean;
  };
  priceAndStockSlot?: ReactNode;
}) {
  const renderAsset = product.featuredAsset ?? product.assets?.[0] ?? null;
  const renderImage = renderAsset?.preview ?? renderAsset?.source ?? '';

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="card-soft rounded-3xl p-8">
          <div className="flex h-[460px] w-full items-center justify-center overflow-hidden rounded-3xl bg-white">
            <div className="flex h-[200px] w-[200px] items-center justify-center">
              {renderImage ? (
                <Image
                  src={assetUrl(renderImage)}
                  alt={product.name}
                  width={200}
                  height={200}
                  sizes="200px"
                  className="h-full w-full object-contain drop-shadow-[0_5px_12px_rgba(41,69,122,0.30)]"
                  draggable={false}
                />
              ) : (
                <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">Render pending</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <PurchasePanel
          productName={product.name}
          productTypeLabel={productTypeLabel}
          iconId={iconId}
          categories={categories}
          compatibilityLinkHref={compatibilityLinkHref}
          productSlug={product.slug}
          priceExVatLabel={priceExVatLabel}
          priceWithVatLabel={priceWithVatLabel}
          productVariantId={productVariantId}
          stock={stock}
          priceAndStockSlot={priceAndStockSlot}
        />
      </div>
    </div>
  );
}
