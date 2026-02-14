import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import KeypadConfigurator from '../../../../components/configurator/KeypadConfigurator';
import { resolveKeypadShellAssetPath } from '../../../../lib/keypadShellAsset';
import { modelCodeToPkpSlug, resolvePkpModelCode } from '../../../../lib/keypadUtils';
import { fetchProductBySlug } from '../../../../lib/vendure.server';

async function fetchKeypadForSlug(slug: string) {
  const normalizedInput = slug.trim();
  if (!normalizedInput) return null;

  const candidates = new Set<string>([normalizedInput]);
  const canonical = modelCodeToPkpSlug(normalizedInput);
  if (canonical) {
    candidates.add(canonical);
  }

  for (const candidate of candidates) {
    const product = await fetchProductBySlug(candidate);
    if (product) return product;
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const product = await fetchKeypadForSlug(resolved.slug);

  if (!product) {
    return {
      title: 'Configurator Not Found | Keypad Store',
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
  const canonicalSlug = modelCodeToPkpSlug(product.slug) ?? modelCodeToPkpSlug(modelCode) ?? product.slug;
  return {
    title: `${modelCode} Configurator | Keypad Store`,
    description: `Configure ${modelCode} with per-slot inserts, glow rings, and production-ready layout precision.`,
    alternates: {
      canonical: `/configurator/keypad/${encodeURIComponent(canonicalSlug)}`,
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
  const requestedSlug = resolved.slug.trim();
  const product = await fetchKeypadForSlug(requestedSlug);
  if (!product) return notFound();

  const modelCode = resolvePkpModelCode(product.slug, product.name) || product.name.toUpperCase();
  const canonicalSlug = modelCodeToPkpSlug(product.slug) ?? modelCodeToPkpSlug(modelCode) ?? product.slug;
  if (requestedSlug.toLowerCase() !== canonicalSlug.toLowerCase()) {
    redirect(`/configurator/keypad/${encodeURIComponent(canonicalSlug)}`);
  }

  return (
    <KeypadConfigurator
      keypad={{
        id: product.id,
        slug: canonicalSlug,
        name: product.name,
        modelCode,
        description: product.description ?? null,
        shellAssetPath: resolveKeypadShellAssetPath(product.featuredAsset),
        productVariantId: product.variants?.[0]?.id ?? null,
      }}
    />
  );
}
