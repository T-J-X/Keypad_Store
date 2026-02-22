import Link from 'next/link';
import type { StitchFeaturedProduct } from '../../data/stitchMockData';

export interface StitchFeaturedGridProps {
  readonly products: readonly StitchFeaturedProduct[];
}

export default function StitchFeaturedGrid({ products }: Readonly<StitchFeaturedGridProps>) {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-7 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold uppercase italic tracking-tight text-white">
            Featured <span className="text-[var(--stitch-primary)]">Keypads</span>
          </h2>
          <Link
            href="/shop"
            className="border-b pb-1 text-xs font-bold uppercase tracking-[0.2em] text-[var(--stitch-primary)]"
            style={{ borderColor: 'rgba(77,77,255,0.4)' }}
          >
            View All
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className={[
                'group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:bg-white/[0.06]',
                product.emphasis === 'featured' ? 'sm:col-span-2' : '',
              ].join(' ')}
            >
              <div className={product.emphasis === 'featured' ? 'relative h-56 overflow-hidden' : 'relative h-44 overflow-hidden'}>
                <img
                  src={product.imageUrl}
                  alt={product.imageAlt}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                {product.badge ? (
                  <span className="absolute left-3 top-3 rounded bg-[var(--stitch-primary)] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                    {product.badge}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-white">{product.name}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">{product.subtitle}</p>
                </div>
                <span className="text-base font-bold text-[var(--stitch-primary)]">{product.priceLabel}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
