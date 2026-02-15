import type { Metadata } from 'next';
import { Suspense } from 'react';
import ShopClient from '../../components/ShopClient';
import type { IconProduct, KeypadProduct, VendureAsset, VendureProductVariant } from '../../lib/vendure';
import { fetchIconProducts, fetchIconProductsPage, fetchKeypadProducts, fetchShopLandingContent } from '../../lib/vendure.server';

type SearchParams = {
  q?: string | string[];
  cat?: string | string[];
  cats?: string | string[];
  section?: string | string[];
  page?: string | string[];
  take?: string | string[];
};

const PAGE_SIZE_OPTIONS = [24, 48, 96] as const;
const DEFAULT_PAGE_SIZE = 24;

function toStringParam(value?: string | string[]) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : '';
  return '';
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

function normalizeSection(value: string): 'landing' | 'all' | 'button-inserts' | 'keypads' {
  if (value === 'all') return 'all';
  if (value === 'keypads') return 'keypads';
  if (value === 'button-inserts' || value === 'icons' || value === 'inserts') return 'button-inserts';
  return 'landing';
}

function sectionSeo(section: 'landing' | 'all' | 'button-inserts' | 'keypads') {
  if (section === 'landing') {
    return {
      title: 'Shop | VCT',
      description: 'Browse premium keypads and curated button inserts for high-performance control systems.',
    };
  }
  if (section === 'button-inserts') {
    return {
      title: 'Shop - Button Inserts | VCT',
      description: 'Explore category-sorted button inserts and icon sets built for reliable control workflows.',
    };
  }
  if (section === 'keypads') {
    return {
      title: 'Shop - Keypads | VCT',
      description: 'Compare high-reliability keypad products and find the right layout for your system.',
    };
  }
  return {
    title: 'Shop - All Products | VCT',
    description: 'View all keypads and button inserts in one catalog.',
  };
}

function parseCanonicalCatsList(
  catsValue?: string | string[],
  catValue?: string | string[],
) {
  const catsParam = toStringParam(catsValue);
  const catsList = catsParam
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean);

  if (catsList.length > 0) {
    return catsList;
  }

  const legacyCat = toStringParam(catValue).trim();
  return legacyCat ? [legacyCat] : [];
}

function formatDisciplineSlug(slug: string) {
  const acronymMap: Record<string, string> = {
    hvac: 'HVAC',
  };

  return slug
    .trim()
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (acronymMap[lower]) return acronymMap[lower];
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const section = normalizeSection(toStringParam(resolvedSearchParams?.section));
  const seo = sectionSeo(section);
  const baseShopCanonical = '/shop';
  const catsList = parseCanonicalCatsList(resolvedSearchParams?.cats, resolvedSearchParams?.cat);

  let canonical = baseShopCanonical;
  if (section !== 'landing') {
    if (section === 'button-inserts') {
      canonical =
        catsList.length === 1
          ? `${baseShopCanonical}?section=button-inserts&cats=${encodeURIComponent(catsList[0])}`
          : `${baseShopCanonical}?section=button-inserts`;
    } else {
      canonical = `${baseShopCanonical}?section=${encodeURIComponent(section)}`;
    }
  }

  let title = seo.title;
  let description = seo.description;
  if (section === 'button-inserts' && catsList.length === 1) {
    const discipline = formatDisciplineSlug(catsList[0]);
    title = `Shop - Button Inserts - ${discipline} | VCT`;
    description = `Explore ${discipline} button inserts and icon sets built for reliable control workflows.`;
  }

  return {
    title,
    description,
    alternates: {
      canonical,
    },
  };
}

function parseCategorySlugs(
  catsValue?: string | string[],
  catValue?: string | string[],
) {
  const catsParam = toStringParam(catsValue);
  if (catsParam) {
    return Array.from(
      new Set(
        catsParam
          .split(',')
          .map((slug) => slug.trim())
          .filter(Boolean),
      ),
    );
  }

  const catParam = toStringParam(catValue).trim();
  return catParam ? [catParam] : [];
}

function pickAssetFields(asset: VendureAsset | null | undefined): VendureAsset | null {
  if (!asset) return null;
  return {
    id: asset.id,
    preview: asset.preview,
    source: asset.source,
    name: asset.name,
  };
}

function pickIconVariantFields(variant: VendureProductVariant | null | undefined): VendureProductVariant[] {
  if (!variant) return [];
  return [
    {
      id: variant.id,
      priceWithTax: variant.priceWithTax ?? null,
      currencyCode: variant.currencyCode ?? null,
    },
  ];
}

function pickIconCardFields(icon: IconProduct): IconProduct {
  return {
    id: icon.id,
    name: icon.name,
    slug: icon.slug,
    featuredAsset: pickAssetFields(icon.featuredAsset),
    variants: pickIconVariantFields(icon.variants?.[0]),
    customFields: {
      iconId: icon.customFields?.iconId,
      iconCategories: icon.customFields?.iconCategories ?? [],
    },
  };
}

function pickCategorySourceIconFields(icon: IconProduct): IconProduct {
  return {
    id: icon.id,
    name: icon.name,
    slug: icon.slug,
    customFields: {
      iconCategories: icon.customFields?.iconCategories ?? [],
    },
  };
}

function pickKeypadCardFields(keypad: KeypadProduct): KeypadProduct {
  return {
    id: keypad.id,
    name: keypad.name,
    slug: keypad.slug,
    featuredAsset: pickAssetFields(keypad.featuredAsset),
  };
}

export default function ShopPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<ShopPageFallback />}>
      <ShopPageContent searchParamsPromise={searchParams} />
    </Suspense>
  );
}

function ShopPageFallback() {
  return (
    <div className="mx-auto w-full max-w-[88rem] bg-white px-6 py-12">
      <div className="mb-3 h-3 w-28 animate-pulse rounded-full bg-gray-200" />
      <div className="mb-8 h-10 w-72 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="card-soft h-[360px] animate-pulse rounded-3xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

async function ShopPageContent({
  searchParamsPromise,
}: {
  searchParamsPromise?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParamsPromise;
  const query = toStringParam(resolvedSearchParams?.q);
  const sectionRaw = toStringParam(resolvedSearchParams?.section);
  let section = normalizeSection(sectionRaw);
  // If we have a search query but are on the landing page, switch to 'all' to show results
  if (section === 'landing' && query.trim().length > 0) {
    section = 'all';
  }
  const selectedCategories =
    section === 'button-inserts'
      ? parseCategorySlugs(resolvedSearchParams?.cats, resolvedSearchParams?.cat)
      : [];
  const requestedPage = toPositiveInteger(toStringParam(resolvedSearchParams?.page), 1);
  const requestedTake = toPageSize(toStringParam(resolvedSearchParams?.take));
  const enableIconsPagination =
    (section === 'button-inserts' && selectedCategories.length === 0) || section === 'all';

  let icons: IconProduct[] = [];
  let categorySourceIcons: IconProduct[] = [];
  let pagination: { page: number; take: number; totalItems: number } | null = null;
  const allIconsPromise = fetchIconProducts();
  const keypadsPromise = fetchKeypadProducts();
  const shopLandingContentPromise = fetchShopLandingContent();

  if (enableIconsPagination) {
    let pagedIcons = await fetchIconProductsPage({
      page: requestedPage,
      take: requestedTake,
      query,
    });

    const totalPages = Math.max(1, Math.ceil(pagedIcons.totalItems / requestedTake));
    const safePage = Math.min(requestedPage, totalPages);

    if (safePage !== requestedPage) {
      pagedIcons = await fetchIconProductsPage({
        page: safePage,
        take: requestedTake,
        query,
      });
    }

    const allIcons = await allIconsPromise;
    icons = pagedIcons.items.map(pickIconCardFields);
    categorySourceIcons = allIcons.map(pickCategorySourceIconFields);
    pagination = {
      page: safePage,
      take: requestedTake,
      totalItems: pagedIcons.totalItems,
    };
  } else {
    const allIcons = await allIconsPromise;
    icons = allIcons.map(pickIconCardFields);
    categorySourceIcons = allIcons.map(pickCategorySourceIconFields);
  }

  const [keypads, baseShopConfig] = await Promise.all([keypadsPromise, shopLandingContentPromise]);
  const trimmedKeypads = keypads.map(pickKeypadCardFields);

  return (
    <div className="mx-auto w-full max-w-[88rem] bg-white px-4 pb-12 pt-8 sm:px-6">
      <ShopClient
        icons={icons}
        keypads={trimmedKeypads}
        baseShopConfig={baseShopConfig}
        categorySourceIcons={categorySourceIcons}
        initialQuery={query}
        initialCategories={selectedCategories}
        initialSection={section}
        initialPage={pagination?.page ?? 1}
        initialTake={pagination?.take ?? DEFAULT_PAGE_SIZE}
        pagedTotalItems={pagination?.totalItems ?? 0}
        isIconsPaginationActive={Boolean(pagination)}
      />
    </div>
  );
}
