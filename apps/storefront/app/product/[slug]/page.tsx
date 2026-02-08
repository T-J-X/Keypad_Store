import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ButtonInsertPdp from '../../../components/ProductPdp/ButtonInsertPdp';
import KeypadPdp from '../../../components/ProductPdp/KeypadPdp';
import ShopHubBackAnchor from '../../../components/ShopHubBackAnchor';
import { type CatalogProduct, type IconProduct } from '../../../lib/vendure';
import { fetchIconProducts, fetchProductBySlug } from '../../../lib/vendure.server';

type ProductSearchParams = {
  from?: string | string[];
  hub?: string | string[];
  section?: string | string[];
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
const DEFAULT_SITE_URL = 'http://localhost:3001';

function toStringParam(value?: string | string[]) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return '';
}

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toPositiveInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function toPageSize(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE;
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number]) ? parsed : DEFAULT_PAGE_SIZE;
}

function parseCategorySlugs(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeSection(value: string): ShopSection | undefined {
  if (value === 'keypads') return 'keypads';
  if (value === 'button-inserts' || value === 'icons' || value === 'inserts') return 'button-inserts';
  return undefined;
}

function toCategoryLabelFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return DEFAULT_SITE_URL;
  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(input: string, maxLength: number) {
  if (input.length <= maxLength) return input;
  return `${input.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function resolveSeoDescription(product: CatalogProduct) {
  const seoDescription = toTrimmedString(product.customFields?.seoDescription);
  if (seoDescription) return seoDescription;
  const productDescription = stripHtml(product.description ?? '');
  if (productDescription) return truncate(productDescription, 160);
  return `Explore ${product.name} at Keypad Store.`;
}

function resolveCanonicalUrl(product: CatalogProduct, fallbackSlug: string) {
  const canonicalOverride = toTrimmedString(product.customFields?.seoCanonicalUrl);
  if (canonicalOverride) return canonicalOverride;
  const slug = product.slug || fallbackSlug;
  return `${siteUrl()}/product/${encodeURIComponent(slug)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await fetchProductBySlug(resolvedParams.slug);

  if (!product) {
    return {
      title: 'Product Not Found | Keypad Store',
      description: 'The requested product could not be found.',
      alternates: {
        canonical: `${siteUrl()}/product/${encodeURIComponent(resolvedParams.slug)}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const seoTitle = toTrimmedString(product.customFields?.seoTitle) || `${product.name} | Keypad Store`;
  const canonical = resolveCanonicalUrl(product, resolvedParams.slug);
  const noIndex = product.customFields?.seoNoIndex === true;

  return {
    title: seoTitle,
    description: resolveSeoDescription(product),
    alternates: {
      canonical,
    },
    robots: noIndex
      ? {
        index: false,
        follow: false,
      }
      : undefined,
  };
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

function resolveModelCode(product: CatalogProduct) {
  const slugMatch = product.slug.match(/pkp-\d{4}-si/i);
  if (slugMatch) return slugMatch[0].toUpperCase();

  const nameMatch = product.name.match(/pkp[\s-]?(\d{4})[\s-]?si/i);
  if (nameMatch) return `PKP-${nameMatch[1]}-SI`;

  return product.name;
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
  const byId = new Map(candidates.map((icon) => [icon.id, icon]));

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

  const fallback = candidates
    .filter((item) => !ranked.some((rankedItem) => rankedItem.id === item.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 3 - ranked.length);

  return [...ranked, ...fallback].filter((item) => byId.has(item.id)).slice(0, 3);
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<ProductSearchParams>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const product = await fetchProductBySlug(resolvedParams.slug);
  if (!product) return notFound();

  const origin = toStringParam(resolvedSearchParams?.from);
  const hubReady = toStringParam(resolvedSearchParams?.hub) === '1';
  const section = normalizeSection(toStringParam(resolvedSearchParams?.section));
  const categoryParam = toStringParam(resolvedSearchParams?.cat).trim();
  const categoryParamList = parseCategorySlugs(toStringParam(resolvedSearchParams?.cats));
  const categorySlugs = categoryParamList.length > 0
    ? categoryParamList
    : (categoryParam ? [categoryParam] : []);
  const query = toStringParam(resolvedSearchParams?.q);
  const page = toPositiveInteger(toStringParam(resolvedSearchParams?.page), 1);
  const take = toPageSize(toStringParam(resolvedSearchParams?.take));

  const sectionHref = section
    ? buildShopHref({
      section,
      q: query,
      cats: section === 'button-inserts' ? categorySlugs : [],
      cat: section === 'button-inserts' ? categoryParam : undefined,
      page,
      take,
    })
    : buildShopHref({});

  const categoryHref = section === 'button-inserts' && categoryParam
    ? buildShopHref({
      section: 'button-inserts',
      q: query,
      cats: categorySlugs.length > 0 ? categorySlugs : [categoryParam],
      cat: categoryParam,
      page: 1,
      take,
    })
    : undefined;

  const sectionLabel = section === 'keypads' ? 'Keypads' : 'Button Inserts';

  const breadcrumbs: BreadcrumbItem[] = origin === 'shop'
    ? [
      { label: 'Shop', href: buildShopHref({}) },
      ...(section ? [{ label: sectionLabel, href: sectionHref }] : []),
      ...(section === 'button-inserts' && categoryParam && categoryHref
        ? [{ label: toCategoryLabelFromSlug(categoryParam), href: categoryHref }]
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
        <ShopHubBackAnchor enabled={!hubReady} />
        <ButtonInsertPdp
          product={product}
          breadcrumbs={breadcrumbs}
          productTypeLabel={resolveProductTypeLabel(product)}
          relatedProducts={relatedProducts}
        />
      </>
    );
  }
  return (
    <>
      <ShopHubBackAnchor enabled={!hubReady} />
      <KeypadPdp
        product={product}
        breadcrumbs={breadcrumbs}
        modelCode={resolveModelCode(product)}
      />
    </>
  );
}
