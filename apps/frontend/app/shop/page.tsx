import type { Metadata } from 'next';
import { Suspense } from 'react';
import { parseUniqueCsvSlugs, toAllowedPageSize, toPositiveInteger, toStringParam } from '@keypad-store/shared-utils/search-params';
import ShopClient from '../../components/ShopClient';
import BreadcrumbJsonLd from '../../components/seo/BreadcrumbJsonLd';
import ShopCollectionJsonLd from '../../components/seo/ShopCollectionJsonLd';
import { Skeleton } from '../../components/ui/skeleton';
import { buildPageMetadata } from '../../lib/seo/metadata';
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
type ShopSection = 'landing' | 'all' | 'button-inserts' | 'keypads';

function normalizeSection(value: string): ShopSection {
  if (value === 'all') return 'all';
  if (value === 'keypads') return 'keypads';
  if (value === 'button-inserts' || value === 'icons' || value === 'inserts') return 'button-inserts';
  return 'landing';
}

function sectionSeo(section: ShopSection) {
  if (section === 'landing') {
    return {
      title: 'Shop',
      description: 'Browse premium keypads and curated button inserts for high-performance control systems.',
    };
  }
  if (section === 'button-inserts') {
    return {
      title: 'Shop - Button Inserts',
      description: 'Explore category-sorted button inserts and icon sets built for reliable control workflows.',
    };
  }
  if (section === 'keypads') {
    return {
      title: 'Shop - Keypads',
      description: 'Compare high-reliability keypad products and find the right layout for your system.',
    };
  }
  return {
    title: 'Shop - All Products',
    description: 'View all keypads and button inserts in one catalog.',
  };
}

function dedupeKeywords(values: string[], maxKeywords = 18) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const keyword = value.replace(/\s+/g, ' ').trim();
    if (!keyword) continue;

    const normalized = keyword.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(keyword);

    if (output.length >= maxKeywords) break;
  }

  return output;
}

function buildShopKeywords(
  section: ShopSection,
  categorySlugs: string[],
) {
  const categoryKeywords = categorySlugs.flatMap((slug) => {
    const label = formatDisciplineSlug(slug);
    return [
      `${label} button inserts`,
      `${label} keypad icons`,
      `${label} control panel icons`,
      `${label} icon category`,
      `${label} icon class`,
    ];
  });

  const baseKeywords = [
    'keypad store',
    'keypad catalog',
    'button insert catalog',
    'vehicle control components',
  ];

  const landingKeywords = [
    'custom keypad shop',
    'CAN keypad products',
    'J1939 keypad products',
    'industrial control keypads',
  ];

  const keypadKeywords = [
    'shop keypads',
    'programmable keypad catalog',
    'industrial keypad products',
    'vehicle control keypad hardware',
    'CAN keypad',
    'J1939 keypad',
  ];

  const insertKeywords = [
    'button inserts',
    'keypad icons',
    'control panel icons',
    'button insert categories',
    'button insert classes',
    'laser etched button inserts',
    'custom icon inserts',
  ];

  if (section === 'landing') {
    return dedupeKeywords([...baseKeywords, ...landingKeywords], 18);
  }
  if (section === 'keypads') {
    return dedupeKeywords([...baseKeywords, ...keypadKeywords], 18);
  }
  if (section === 'button-inserts') {
    return dedupeKeywords([...baseKeywords, ...insertKeywords, ...categoryKeywords], 20);
  }
  return dedupeKeywords(
    [...baseKeywords, ...keypadKeywords, ...insertKeywords, ...categoryKeywords],
    20,
  );
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

function buildShopCanonicalPath(section: ShopSection, categorySlugs: string[]) {
  const baseShopCanonical = '/shop';
  if (section === 'landing') return baseShopCanonical;
  if (section === 'all') return baseShopCanonical;
  if (section === 'button-inserts') {
    return categorySlugs.length === 1
      ? `${baseShopCanonical}/button-inserts/${encodeURIComponent(categorySlugs[0])}`
      : `${baseShopCanonical}/button-inserts`;
  }
  return `${baseShopCanonical}/keypads`;
}

function buildShopBreadcrumbItems(section: ShopSection, categorySlugs: string[]) {
  const items: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
  ];

  if (section === 'all') {
    items.push({ label: 'All Products', href: '/shop' });
  } else if (section === 'keypads') {
    items.push({ label: 'Keypads', href: '/shop/keypads' });
  } else if (section === 'button-inserts') {
    items.push({ label: 'Button Inserts', href: '/shop/button-inserts' });
    if (categorySlugs.length === 1) {
      items.push({
        label: formatDisciplineSlug(categorySlugs[0]),
        href: buildShopCanonicalPath(section, categorySlugs),
      });
    }
  }

  return items;
}

function shouldNoIndexShopVariant({
  query,
  page,
  take,
  section,
  categorySlugs,
}: {
  query: string;
  page: number;
  take: number;
  section: ShopSection;
  categorySlugs: string[];
}) {
  if (section !== 'landing') return true;
  if (query.trim().length > 0) return true;
  if (page > 1) return true;
  if (take !== DEFAULT_PAGE_SIZE) return true;
  return false;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const query = toStringParam(resolvedSearchParams?.q).trim();
  const sectionRaw = normalizeSection(toStringParam(resolvedSearchParams?.section));
  const section: ShopSection =
    sectionRaw === 'landing' && query.length > 0 ? 'all' : sectionRaw;
  const seo = sectionSeo(section);
  const catsList =
    section === 'button-inserts'
      ? parseCanonicalCatsList(resolvedSearchParams?.cats, resolvedSearchParams?.cat)
      : [];
  const canonical = buildShopCanonicalPath(section, catsList);
  const page = toPositiveInteger(toStringParam(resolvedSearchParams?.page), 1);
  const take = toAllowedPageSize(
    toStringParam(resolvedSearchParams?.take),
    PAGE_SIZE_OPTIONS,
    DEFAULT_PAGE_SIZE,
  );
  const noIndex = shouldNoIndexShopVariant({
    query,
    page,
    take,
    section,
    categorySlugs: catsList,
  });

  let title = seo.title;
  let description = seo.description;
  if (section === 'button-inserts' && catsList.length === 1) {
    const discipline = formatDisciplineSlug(catsList[0]);
    title = `Shop - Button Inserts - ${discipline}`;
    description = `Explore ${discipline} button inserts and icon sets built for reliable control workflows.`;
  }

  return buildPageMetadata({
    title,
    description,
    canonical,
    keywords: buildShopKeywords(section, catsList),
    noIndex,
  });
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

function pickKeypadVariantFields(variant: VendureProductVariant | null | undefined): VendureProductVariant[] {
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
    variants: pickKeypadVariantFields(keypad.variants?.[0]),
    customFields: {
      application: keypad.customFields?.application ?? [],
    },
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
    <div className="mx-auto w-full max-w-[88rem] bg-white px-4 sm:px-6">
      <Skeleton className="mb-3 h-3 w-28 rounded-full bg-gray-200" />
      <Skeleton className="mb-8 h-10 w-72 rounded bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="card-soft h-[360px] rounded-3xl bg-gray-100" />
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
  const canonicalPath = buildShopCanonicalPath(section, selectedCategories);
  const breadcrumbItems = buildShopBreadcrumbItems(section, selectedCategories);
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
        <BreadcrumbJsonLd items={breadcrumbItems} />
        <ShopCollectionJsonLd
          section={section}
          canonicalPath={canonicalPath}
          query={query}
          categorySlugs={selectedCategories}
          icons={icons}
          keypads={matchedKeypads}
        />
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
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ShopCollectionJsonLd
        section={section}
        canonicalPath={canonicalPath}
        query={query}
        categorySlugs={selectedCategories}
        icons={icons}
        keypads={trimmedKeypads}
      />
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
