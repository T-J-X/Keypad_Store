import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Pkp2200Configurator from '../../../components/configurator/Pkp2200Configurator';
import { resolvePkpModelCode } from '../../../lib/keypadUtils';
import { fetchProductBySlug } from '../../../lib/vendure.server';

export default function ConfiguratorModelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<ConfiguratorModelFallback />}>
      <ConfiguratorModelContent paramsPromise={params} />
    </Suspense>
  );
}

function ConfiguratorModelFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="h-[640px] animate-pulse rounded-3xl bg-[linear-gradient(180deg,#dbe8f9_0%,#f4f7fc_100%)]" />
    </div>
  );
}

async function ConfiguratorModelContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const resolved = await paramsPromise;
  const product = await fetchProductBySlug(resolved.slug);
  if (!product) return notFound();

  const modelCode = resolvePkpModelCode(product.slug, product.name) || product.name.toUpperCase();

  return (
    <Pkp2200Configurator
      keypad={{
        id: product.id,
        slug: product.slug,
        name: product.name,
        modelCode,
        description: product.description ?? null,
        shellAssetPath: product.featuredAsset?.source ?? product.featuredAsset?.preview ?? null,
        productVariantId: product.variants?.[0]?.id ?? null,
      }}
    />
  );
}
