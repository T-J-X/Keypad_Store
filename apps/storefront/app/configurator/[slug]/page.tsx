import Link from 'next/link';
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

  if (modelCode !== 'PKP-2200-SI') {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center">
        <div className="pill">Configurator Pilot</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          {modelCode} coming next
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-ink/60">
          The interactive pilot currently targets PKP-2200-SI. This model will be enabled in the next rollout phase.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link href="/configurator" className="btn-ghost">Back to models</Link>
          <Link href="/configurator" className="btn-primary">Open PKP-2200-SI pilot</Link>
        </div>
      </div>
    );
  }

  return (
    <Pkp2200Configurator
      keypad={{
        id: product.id,
        slug: product.slug,
        name: product.name,
        modelCode,
        shellAssetPath: product.featuredAsset?.source ?? product.featuredAsset?.preview ?? null,
        productVariantId: product.variants?.[0]?.id ?? null,
      }}
    />
  );
}
