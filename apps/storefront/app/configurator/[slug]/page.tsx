import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import KeypadConfigurator from '../../../components/configurator/KeypadConfigurator';
import { resolveKeypadShellAssetPath } from '../../../lib/keypadShellAsset';
import { resolvePkpModelCode } from '../../../lib/keypadUtils';
import { fetchProductBySlug } from '../../../lib/vendure.server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const product = await fetchProductBySlug(resolved.slug);

  if (!product) {
    return {
      title: 'Configurator Not Found | Keypad Store',
      description: 'The requested keypad configurator page could not be found.',
      alternates: {
        canonical: `/configurator/${encodeURIComponent(resolved.slug)}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const modelCode = resolvePkpModelCode(product.slug, product.name) || product.name.toUpperCase();
  return {
    title: `${modelCode} Configurator | Keypad Store`,
    description: `Configure ${modelCode} with per-slot inserts, glow rings, and production-ready layout precision.`,
    alternates: {
      canonical: `/configurator/${encodeURIComponent(product.slug)}`,
    },
  };
}

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
    <KeypadConfigurator
      keypad={{
        id: product.id,
        slug: product.slug,
        name: product.name,
        modelCode,
        description: product.description ?? null,
        shellAssetPath: resolveKeypadShellAssetPath(product.featuredAsset),
        productVariantId: product.variants?.[0]?.id ?? null,
      }}
    />
  );
}
