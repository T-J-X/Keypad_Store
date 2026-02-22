import Link from 'next/link';
import Image from 'next/image';
import { assetUrl, iconCategoriesFromProduct, type IconProduct } from '../lib/vendure';

export default function RelatedProducts({
  products,
}: {
  products: IconProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-14 space-y-5">
      <h2 className="text-2xl font-semibold tracking-tight text-ink">Products You May Also Like</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const image = product.featuredAsset?.preview ?? product.featuredAsset?.source ?? '';
          const iconId = product.customFields?.iconId ?? '—';
          const categories = iconCategoriesFromProduct(product);
          const imageAlt = `${product.name} button insert ${iconId} ${categories.slice(0, 2).join(' ')}`.replace(/\s+/g, ' ').trim();

          return (
            <Link
              key={product.id}
              href={`/shop/product/${product.slug}`}
              className="card-soft flex h-full flex-col gap-3 p-4 transition hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="overflow-hidden rounded-2xl bg-[linear-gradient(to_bottom,#f4f4f5_0%,#e4e4e7_50%,#ffffff_100%)]">
                {image ? (
                  <Image
                    src={assetUrl(image)}
                    alt={imageAlt}
                    width={288}
                    height={144}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="h-36 w-full object-contain p-4"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center text-xs font-semibold uppercase tracking-wide text-ink/40">
                    Render pending
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-ink">{product.name}</h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">{iconId}</p>
                <p className="text-sm text-ink/55">{categories.join(', ')}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
