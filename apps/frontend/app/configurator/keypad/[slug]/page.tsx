import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, cache } from 'react';
import KeypadConfigurator from '../../../../components/configurator/KeypadConfigurator';
import { Skeleton } from '../../../../components/ui/skeleton';
import { resolveKeypadShellAssetPath } from '../../../../lib/keypadShellAsset';
import { resolvePkpModelCode } from '../../../../lib/keypadUtils';
import { buildPageMetadata } from '../../../../lib/seo/metadata';
import { fetchKeypadProducts, fetchProductBySlug, fetchSessionSummary } from '../../../../lib/vendure.server';
import { fetchIconCatalog } from '../../../../lib/configurator.server';

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
    return buildPageMetadata({
      title: 'Configurator Not Found',
      description: 'The requested keypad configurator page could not be found.',
      canonical: `/configurator/keypad/${encodeURIComponent(resolved.slug)}`,
      noIndex: true,
    });
  }

  const modelCode = resolvePkpModelCode(product.slug, product.name) || product.name.toUpperCase();
  return buildPageMetadata({
    title: `${modelCode} Configurator`,
    description: `Configure ${modelCode} with per-slot inserts, glow rings, and production-ready layout precision.`,
    canonical: `/configurator/keypad/${encodeURIComponent(product.slug)}`,
    keywords: [
      `${modelCode} keypad`,
      `${modelCode} keypad configurator`,
      `${modelCode} custom keypad layout`,
      `${modelCode} CAN keypad`,
      `${modelCode} J1939 keypad`,
      'vehicle control keypad builder',
      'programmable keypad configurator',
    ],
  });
}

export default function ConfiguratorModelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<ConfiguratorModelFallback />}>
      <ConfiguratorModelContent paramsPromise={params} searchParamsPromise={searchParams} />
    </Suspense>
  );
}

function ConfiguratorModelFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <Skeleton className="h-[640px] rounded-3xl bg-[linear-gradient(180deg,#dbe8f9_0%,#f4f7fc_100%)]" />
    </div>
  );
}

async function ConfiguratorModelContent({
  paramsPromise,
  searchParamsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [resolved, resolvedSearchParams] = await Promise.all([paramsPromise, searchParamsPromise]);
  const product = await fetchKeypadForSlug(resolved.slug);
  if (!product) return notFound();

  const [iconCatalog, sessionSummary] = await Promise.all([
    fetchIconCatalog(),
    fetchSessionSummary(),
  ]);

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
      iconCatalog={iconCatalog}
      sessionSummary={sessionSummary}
      initialSearchParams={resolvedSearchParams}
    />
  );
}
