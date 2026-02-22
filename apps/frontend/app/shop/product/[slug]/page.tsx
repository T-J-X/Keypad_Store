import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, cache } from 'react';
import { parseUniqueCsvSlugs, toAllowedPageSize, toPositiveInteger, toStringParam } from '@keypad-store/shared-utils/search-params';
import ButtonInsertPdp from '../../../../components/ProductPdp/ButtonInsertPdp';
import KeypadPdp from '../../../../components/ProductPdp/KeypadPdp';
import ProductJsonLd from '../../../../components/ProductPdp/ProductJsonLd';
import BreadcrumbJsonLd from '../../../../components/seo/BreadcrumbJsonLd';
import PriceAndStock from '../../../../components/ProductPdp/PriceAndStock';
import ShopHubBackAnchor from '../../../../components/ShopHubBackAnchor';
import { Skeleton } from '../../../../components/ui/skeleton';
import { resolvePkpModelCode } from '../../../../lib/keypadUtils';
import { resolveSeoDescription, resolveSeoKeywords } from '../../../../lib/productSeo';
import { buildPageMetadata } from '../../../../lib/seo/metadata';
import { assetUrl, categorySlug, type CatalogProduct, type IconProduct } from '../../../../lib/vendure';
import { fetchIconProducts, fetchKeypadProducts, fetchProductBySlug } from '../../../../lib/vendure.server';

type ProductSearchParams = {
  from?: string | string[];
  hub?: string | string[];
  section?: string | string[];
  protocol?: string | string[];
  cat?: string | string[];
  cats?: string | string[];
  q?: string | string[];
  page?: string | string[];
  take?: string | string[];
};

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type ShopSection = 'button-inserts' | 'keypads';

const PAGE_SIZE_OPTIONS = [24, 48, 96] as const;
const DEFAULT_PAGE_SIZE = 24;

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTitleForTemplate(value: string) {
  return value.replace(/\s*\|\s*VCT$/i, '').trim();
}

function parseCategorySlugs(value: string) {
  return parseUniqueCsvSlugs(value);
}

function normalizeSection(value: string): ShopSection | undefined {
  if (value === 'keypads') return 'keypads';
  if (value === 'button-inserts' || value === 'icons' || value === 'inserts') return 'button-inserts';
  return undefined;
}

function toCategoryLabelFromSlug(slug: string) {
  const acronymMap: Record<string, string> = {
    can: 'CAN',
    j1939: 'J1939',
    nmea: 'NMEA',
    hvac: 'HVAC',
  };

  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => acronymMap[part.toLowerCase()] ?? (part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

function normalizeTaxonomySlug(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    return categorySlug(decodeURIComponent(trimmed));
  } catch {
    return categorySlug(trimmed);
  }
}

function resolveCanonicalUrl(product: CatalogProduct, fallbackSlug: string) {
  const canonicalOverride = toTrimmedString(product.customFields?.seoCanonicalUrl);
  if (canonicalOverride.startsWith('/')) return canonicalOverride;
  if (canonicalOverride) {
    try {
      const parsed = new URL(canonicalOverride);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch {
      // Invalid canonical override falls back to the product path.
    }
  }
  const slug = product.slug || fallbackSlug;
  return `/shop/product/${encodeURIComponent(slug)}`;
}

const fetchCatalogProductForSlug = cache(async (slug: string) => {
  const normalized = slug.trim();
  if (!normalized) return null;

  const product = await fetchProductBySlug(normalized);
  if (product) return product;

  const modelCode = resolvePkpModelCode(normalized, normalized);
  if (!modelCode) return null;

  const keypads = await fetchKeypadProducts();
  return keypads.find((keypad) => {
    const keypadModelCode = resolvePkpModelCode(keypad.slug, keypad.name);
    return keypadModelCode === modelCode;
  }) ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await fetchCatalogProductForSlug(resolvedParams.slug);

  if (!product) {
    return buildPageMetadata({
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
      canonical: `/shop/product/${encodeURIComponent(resolvedParams.slug)}`,
      noIndex: true,
    });
  }

  const seoTitle = normalizeTitleForTemplate(
    toTrimmedString(product.customFields?.seoTitle) || product.name,
  );
  const canonical = resolveCanonicalUrl(product, resolvedParams.slug);
  const noIndex = product.customFields?.seoNoIndex === true;
  const imageSource = product.featuredAsset?.source ?? product.featuredAsset?.preview;

  return buildPageMetadata({
    title: seoTitle,
    description: resolveSeoDescription(product),
    canonical,
    noIndex,
    image: imageSource ? assetUrl(imageSource) : undefined,
    keywords: resolveSeoKeywords(product),
  });
}

function buildShopHref({
  section,
  q,
  cats = [],
  cat,
  page,
  take,
}: {
  section?: ShopSection;
  q?: string;
  cats?: string[];
  cat?: string;
  page?: number;
  take?: number;
}) {
  const params = new URLSearchParams();
  if (section) params.set('section', section);
  const trimmedQuery = q?.trim();
  if (trimmedQuery) params.set('q', trimmedQuery);
  if (section === 'button-inserts' && cats.length > 0) params.set('cats', cats.join(','));
  if (section === 'button-inserts' && cat) params.set('cat', cat);
  if (section && page && page > 0) params.set('page', String(page));
  if (section && take && take > 0) params.set('take', String(take));
  const query = params.toString();
  return `/shop${query ? `?${query}` : ''}`;
}

function isButtonInsertProduct(product: CatalogProduct) {
  if (product.customFields?.isIconProduct) return true;
  return (product.customFields?.iconCategories?.length ?? 0) > 0;
}

function resolveProductTypeLabel(product: CatalogProduct) {
  if (isButtonInsertProduct(product)) return 'Button Insert Product';
  if (product.customFields?.isKeypadProduct) return 'Keypad Product';
  return 'Product';
}

function resolveRelatedProducts(currentProduct: CatalogProduct, icons: IconProduct[]) {
  const currentCategories = new Set(
    (currentProduct.customFields?.iconCategories ?? [])
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );

  const candidates = icons.filter((icon) => icon.id !== currentProduct.id && icon.slug !== currentProduct.slug);

  const ranked = candidates
    .map((candidate) => {
      const candidateCategories = (candidate.customFields?.iconCategories ?? [])
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
      const overlap = candidateCategories.filter((category) => currentCategories.has(category)).length;
      return {
        product: candidate,
        overlap,
      };
    })
    .filter((entry) => (currentCategories.size > 0 ? entry.overlap > 0 : true))
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return a.product.name.localeCompare(b.product.name);
    })
    .slice(0, 3)
    .map((entry) => entry.product);

  if (ranked.length === 3) return ranked;
  const rankedIds = new Set(ranked.map((item) => item.id));

  const fallback = candidates
    .filter((item) => !rankedIds.has(item.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 3 - ranked.length);

  return [...ranked, ...fallback].slice(0, 3);
}

function PriceAndStockFallback({ showStock = false }: { showStock?: boolean }) {
  return (
    <>
      <div className="space-y-1">
        <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-44 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
      </div>
      {showStock ? <div className="h-10 animate-pulse rounded-xl bg-gray-200" /> : null}
    </>
  );
}

export default function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<ProductSearchParams>;
}) {
  return (
    <Suspense fallback={<ProductPageFallback />}>
      <ProductDetailContent paramsPromise={params} searchParamsPromise={searchParams} />
    </Suspense>
  );
}

function ProductPageFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      <Skeleton className="mb-3 h-3 w-28 rounded-full bg-gray-200" />
      <Skeleton className="mb-6 h-4 w-48 rounded bg-gray-200" />
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="card-soft h-[560px] rounded-3xl bg-gray-200" />
        <Skeleton className="card-soft h-[520px] rounded-3xl bg-gray-200" />
      </div>
    </div>
  );
}

async function ProductDetailContent({
  paramsPromise,
  searchParamsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
  searchParamsPromise?: Promise<ProductSearchParams>;
}) {
  const [resolvedParams, searchParams] = await Promise.all([
    paramsPromise,
    searchParamsPromise ?? Promise.resolve(undefined),
  ]);
  const product = await fetchCatalogProductForSlug(resolvedParams.slug);
  if (!product) return notFound();

  const origin = toStringParam(searchParams?.from);
  const hubReady = toStringParam(searchParams?.hub) === '1';
  const section = normalizeSection(toStringParam(searchParams?.section));
  const categoryParam = normalizeTaxonomySlug(toStringParam(searchParams?.cat));
  const protocolParam = normalizeTaxonomySlug(toStringParam(searchParams?.protocol));
  const categoryParamList = parseCategorySlugs(toStringParam(searchParams?.cats));
  const categorySlugs = categoryParamList.length > 0
    ? categoryParamList
    : (categoryParam ? [categoryParam] : []);
  const query = toStringParam(searchParams?.q);
  const rawPage = toStringParam(searchParams?.page);
  const rawTake = toStringParam(searchParams?.take);
  const page = toPositiveInteger(rawPage, 1);
  const take = toAllowedPageSize(rawTake, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE);
  const hasPageParam = rawPage.trim().length > 0;
  const hasTakeParam = rawTake.trim().length > 0;

  const sectionHref = section
    ? buildShopHref({
      section,
      q: query,
      cats: section === 'button-inserts' ? categorySlugs : [],
      cat: section === 'button-inserts' ? categoryParam : undefined,
      page: hasPageParam ? page : undefined,
      take: hasTakeParam ? take : undefined,
    })
    : buildShopHref({});

  const categoryBreadcrumbSlug = categoryParam || categorySlugs[0] || '';
  const categoryHref = section === 'button-inserts' && categoryBreadcrumbSlug
    ? `/shop/button-inserts/${encodeURIComponent(categoryBreadcrumbSlug)}`
    : undefined;

  const sectionLabel = section === 'keypads' ? 'Keypads' : 'Button Inserts';
  const protocolHref = protocolParam
    ? `/shop/keypads/${encodeURIComponent(protocolParam)}`
    : undefined;

  const breadcrumbs: BreadcrumbItem[] = origin === 'shop'
    ? [
      { label: 'Shop', href: buildShopHref({}) },
      ...(section ? [{ label: sectionLabel, href: sectionHref }] : []),
      ...(section === 'keypads' && protocolParam && protocolHref
        ? [{ label: toCategoryLabelFromSlug(protocolParam), href: protocolHref }]
        : []),
      ...(section === 'button-inserts' && categoryBreadcrumbSlug && categoryHref
        ? [{ label: toCategoryLabelFromSlug(categoryBreadcrumbSlug), href: categoryHref }]
        : []),
      { label: product.name },
    ]
    : [
      { label: 'Home', href: '/' },
      { label: product.name },
    ];

  if (isButtonInsertProduct(product)) {
    const icons = await fetchIconProducts();
    const relatedProducts = resolveRelatedProducts(product, icons);

    return (
      <>
        <BreadcrumbJsonLd items={breadcrumbs} />
        <ProductJsonLd product={product} />
        <ShopHubBackAnchor enabled={!hubReady} />
        <ButtonInsertPdp
          product={product}
          breadcrumbs={breadcrumbs}
          productTypeLabel={resolveProductTypeLabel(product)}
          relatedProducts={relatedProducts}
          priceAndStockSlot={(
            <Suspense fallback={<PriceAndStockFallback showStock />}>
              <PriceAndStock slug={product.slug} showStock />
            </Suspense>
          )}
        />
      </>
    );
  }
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <ProductJsonLd product={product} />
      <ShopHubBackAnchor enabled={!hubReady} />
      <KeypadPdp
        product={product}
        breadcrumbs={breadcrumbs}
        modelCode={resolvePkpModelCode(product.slug, product.name) || product.name}
        priceAndStockSlot={(
          <Suspense fallback={<PriceAndStockFallback />}>
            <PriceAndStock slug={product.slug} showStock={false} />
          </Suspense>
        )}
      />
    </>
  );
}
