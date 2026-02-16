import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, cache } from 'react';
import KeypadConfigurator from '../../../../components/configurator/KeypadConfigurator';
import { resolveKeypadShellAssetPath } from '../../../../lib/keypadShellAsset';
import { resolvePkpModelCode } from '../../../../lib/keypadUtils';
import { fetchKeypadProducts, fetchProductBySlug } from '../../../../lib/vendure.server';

const fetchKeypadForSlug = cache(async (slug: string) => {
  const normalizedInput = slug.trim();
  if (!normalizedInput) return null;

  const requestedModelCode = resolvePkpModelCode(normalizedInput, normalizedInput);
  const keypadsPromise = requestedModelCode ? fetchKeypadProducts() : null;

  const bySlug = await fetchProductBySlug(normalizedInput);
  if (bySlug?.customFields?.isKeypadProduct) {
    return bySlug;
  }

  if (!requestedModelCode || !keypadsPromise) {
    return null;
  }

  const keypads = await keypadsPromise;
  return keypads.find((keypad) => {
    const keypadModelCode = resolvePkpModelCode(keypad.slug, keypad.name);
    return keypadModelCode === requestedModelCode;
  }) ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const product = await fetchKeypadForSlug(resolved.slug);

  if (!product) {
    return {
      title: 'Configurator Not Found | VCT',
      description: 'The requested keypad configurator page could not be found.',
      alternates: {
        canonical: `/configurator/keypad/${encodeURIComponent(resolved.slug)}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const modelCode = resolvePkpModelCode(product.slug, product.name) || product.name.toUpperCase();
  return {
    title: `${modelCode} Configurator | VCT`,
    description: `Configure ${modelCode} with per-slot inserts, glow rings, and production-ready layout precision.`,
    alternates: {
      canonical: `/configurator/keypad/${encodeURIComponent(product.slug)}`,
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
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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
  const product = await fetchKeypadForSlug(resolved.slug);
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
