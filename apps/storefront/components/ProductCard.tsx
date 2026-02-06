'use client';

import Link from 'next/link';
import type { IconProduct } from '../lib/vendure';
import { assetUrl, normalizeCategoryPath } from '../lib/vendure';

const placeholder = (
  <div className="flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 via-white to-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-400">
    Render pending
  </div>
);

export default function ProductCard({ product }: { product: IconProduct }) {
  const image = product.featuredAsset?.preview ?? product.featuredAsset?.source ?? '';
  const iconId = product.customFields?.iconId ?? product.name;
  const category = normalizeCategoryPath(product.customFields?.iconCategoryPath);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="card-soft flex h-full flex-col gap-4 p-4 transition hover:-translate-y-1 hover:shadow-soft"
    >
      {image ? (
        <div className="overflow-hidden rounded-2xl bg-slate-100">
          <img
            src={assetUrl(image)}
            alt={product.name}
            className="h-40 w-full object-contain p-4"
            loading="lazy"
          />
        </div>
      ) : (
        placeholder
      )}
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">{category}</div>
        <div className="text-sm font-semibold text-ink">{iconId}</div>
        <div className="text-xs text-ink/60">{product.name}</div>
      </div>
    </Link>
  );
}
