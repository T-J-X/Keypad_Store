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
    <div className="grid gap-10 motion-safe:animate-fade-up lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
      <div>
        <div className="card-soft rounded-[28px] p-6 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_28px_58px_-28px_rgba(14,17,26,0.3)] sm:p-8 md:p-10 lg:p-12">
          <div className="flex h-[340px] w-full items-center justify-center overflow-hidden rounded-3xl bg-white sm:h-[420px] lg:h-[520px]">
            <div className="flex h-[220px] w-[220px] items-center justify-center sm:h-[260px] sm:w-[260px]">
              {renderImage ? (
                <Image
                  src={assetUrl(renderImage)}
                  alt={product.name}
                  width={260}
                  height={260}
                  sizes="260px"
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

      <div className="lg:sticky lg:top-32">
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
