import type { Metadata } from 'next';
import { Suspense } from 'react';
import { parseUniqueCsvSlugs, toAllowedPageSize, toPositiveInteger, toStringParam } from '@keypad-store/shared-utils/search-params';
import ShopClient from '../../components/ShopClient';
import type { IconCategory, IconProduct, KeypadProduct, VendureAsset, VendureProductVariant } from '../../lib/vendure';
import { categorySlug, normalizeCategoryName } from '../../lib/vendure';
import { fetchIconProducts, fetchIconProductsPage, fetchKeypadProducts, fetchShopLandingContent, searchGlobalProducts } from '../../lib/vendure.server';

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
  const catsList = parseUniqueCsvSlugs(catsParam);

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
    return parseUniqueCsvSlugs(catsParam);
  }

  const catParam = toStringParam(catValue).trim();
  return catParam ? [catParam] : [];
}

function buildCategoryCounts(icons: IconProduct[]): IconCategory[] {
  const bySlug = new Map<string, IconCategory>();

  for (const icon of icons) {
    const categories = icon.customFields?.iconCategories ?? [];
    const categoryNames = categories.length > 0 ? categories : ['Uncategorised'];

    for (const rawName of categoryNames) {
      const name = normalizeCategoryName(rawName);
      const slug = categorySlug(name);
      const existing = bySlug.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        bySlug.set(slug, { name, slug, count: 1 });
      }
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name));
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
    <div className="mx-auto w-full max-w-[88rem] bg-white px-6">
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
  const requestedTake = toAllowedPageSize(
    toStringParam(resolvedSearchParams?.take),
    PAGE_SIZE_OPTIONS,
    DEFAULT_PAGE_SIZE,
  );

  // --- Search Logic ---
  if (query.trim().length > 0) {
    const allResultsPromise = searchGlobalProducts(query);
    const allIconsPromise = fetchIconProducts();
    const baseShopConfigPromise = fetchShopLandingContent();
    const allResults = await allResultsPromise;
    const matchedIconResults = allResults.filter((product) => !product.customFields?.isKeypadProduct);

    const totalItems = matchedIconResults.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / requestedTake));
    const safePage = Math.min(requestedPage, totalPages);
    const start = (safePage - 1) * requestedTake;
    const paginatedResults = matchedIconResults.slice(start, start + requestedTake);

    const icons = paginatedResults
      .filter(p => !p.customFields?.isKeypadProduct) // Treat anything not strictly keypad as icon/other for now
      .map(p => p as IconProduct)
      .map(pickIconCardFields);

    // For Keypads, we might want to show them ALL or consistent with pagination?
    // The current ShopClient expects `keypads` to be a separate list.
    // If we are searching, we probably want to pass the matching keypads.
    // However, ShopClient logic for "all" section displays icons grid AND keypads grid.
    // Let's filter keypads from the FULL results to show them all (or maybe top N?), 
    // and let the icons pagination handle the mixed list if we want a unified view?
    // 
    // Current ShopClient behavior:
    // - `icons`: displayed in grid, paginated.
    // - `keypads`: displayed in separate grid.

    const matchedKeypads = allResults
      .filter(p => p.customFields?.isKeypadProduct)
      .map(p => p as KeypadProduct)
      .map(pickKeypadCardFields);

    // If we are in "all" section, we show keypads + icons.
    // Let's populate `icons` with the paginated non-keypad results.

    const [allIcons, baseShopConfig] = await Promise.all([
      allIconsPromise,
      baseShopConfigPromise,
    ]);
    const categoryCounts = buildCategoryCounts(allIcons);

    return (
      <div className="mx-auto w-full max-w-[88rem] bg-white px-4 sm:px-6">
        <ShopClient
          icons={icons}
          keypads={matchedKeypads}
          baseShopConfig={baseShopConfig}
          categoryCounts={categoryCounts}
          catalogIconTotal={allIcons.length}
          initialQuery={query}
          initialCategories={selectedCategories}
          initialSection={section}
          initialPage={safePage}
          initialTake={requestedTake}
          pagedTotalItems={totalItems}
          isIconsPaginationActive={true}
        />
      </div>
    );
  }

  // --- Normal Navigation Logic (No Search) ---

  const enableIconsPagination =
    section === 'button-inserts' || section === 'all';

  let icons: IconProduct[] = [];
  let categoryCounts: IconCategory[] = [];
  let catalogIconTotal = 0;
  let pagination: { page: number; take: number; totalItems: number } | null = null;
  const allIconsPromise = fetchIconProducts();
  const keypadsPromise = fetchKeypadProducts();
  const shopLandingContentPromise = fetchShopLandingContent();

  if (enableIconsPagination) {
    let pagedIcons = await fetchIconProductsPage({
      page: requestedPage,
      take: requestedTake,
      query,
      categorySlugs: selectedCategories,
    });

    const totalPages = Math.max(1, Math.ceil(pagedIcons.totalItems / requestedTake));
    const safePage = Math.min(requestedPage, totalPages);

    if (safePage !== requestedPage) {
      pagedIcons = await fetchIconProductsPage({
        page: safePage,
        take: requestedTake,
        query,
        categorySlugs: selectedCategories,
      });
    }

    const allIcons = await allIconsPromise;
    icons = pagedIcons.items.map(pickIconCardFields);
    categoryCounts = buildCategoryCounts(allIcons);
    catalogIconTotal = allIcons.length;

    pagination = {
      page: safePage,
      take: requestedTake,
      totalItems: pagedIcons.totalItems,
    };
  } else {
    const allIcons = await allIconsPromise;
    icons = allIcons.map(pickIconCardFields);
    categoryCounts = buildCategoryCounts(allIcons);
    catalogIconTotal = allIcons.length;
  }

  const [keypads, baseShopConfig] = await Promise.all([keypadsPromise, shopLandingContentPromise]);
  const trimmedKeypads = keypads.map(pickKeypadCardFields);

  return (
    <div className="mx-auto w-full max-w-[88rem] bg-white px-4 sm:px-6">
      <ShopClient
        icons={icons}
        keypads={trimmedKeypads}
        baseShopConfig={baseShopConfig}
        categoryCounts={categoryCounts}
        catalogIconTotal={catalogIconTotal}
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
