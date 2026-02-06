import Link from 'next/link';
import { notFound } from 'next/navigation';
import { assetUrl, normalizeCategoryPath } from '../../../lib/vendure';
import { fetchProductBySlug } from '../../../lib/vendure.server';

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = await fetchProductBySlug(resolvedParams.slug);
  if (!product) return notFound();

  const image = product.featuredAsset?.preview ?? product.featuredAsset?.source ?? '';
  const iconId = product.customFields?.iconId ?? product.name;
  const category = normalizeCategoryPath(product.customFields?.iconCategoryPath);
  const isKeypad = Boolean(product.customFields?.isKeypadProduct);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-20 pt-12">
      <div className="mb-6 text-xs font-semibold uppercase tracking-wide text-ink/50">
        <Link href="/shop" className="hover:text-ink">Shop</Link> / {product.name}
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
        <div className="card-soft flex items-center justify-center p-8">
          {image ? (
            <img src={assetUrl(image)} alt={product.name} className="h-72 w-full object-contain" />
          ) : (
            <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">Render pending</div>
          )}
        </div>
        <div className="space-y-5">
          <div className="pill">Catalog detail</div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">{product.name}</h1>
            <div className="mt-2 text-sm text-ink/60">{isKeypad ? 'Keypad model' : 'Icon product'}</div>
          </div>
          {!isKeypad && (
            <div className="space-y-1 text-sm text-ink/70">
              <div>Icon ID: <span className="font-semibold text-ink">{iconId}</span></div>
              <div>Category: <span className="font-semibold text-ink">{category}</span></div>
            </div>
          )}
          <p className="text-sm text-ink/60">
            This page is a lightweight shell for future expansion. It will eventually include configurator previews,
            inventory status, and ordering controls.
          </p>
          {isKeypad ? (
            <Link href={`/configurator/${product.slug}`} className="btn-primary inline-flex w-fit">Configure now</Link>
          ) : (
            <Link href="/configurator" className="btn-primary inline-flex w-fit">Add to configuration</Link>
          )}
          <div className="card-soft p-4 text-xs text-ink/60">
            Note: Storefront pages only display the featured render asset. Insert overlays remain configurator-only.
          </div>
        </div>
      </div>
    </div>
  );
}
