import type { Metadata } from 'next';
import ShopClient from '../../components/ShopClient';
import { fetchBaseShopConfigPublic, fetchIconProducts, fetchIconProductsPage, fetchKeypadProducts } from '../../lib/vendure.server';

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
const DEFAULT_SITE_URL = 'http://localhost:3001';

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

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return DEFAULT_SITE_URL;
  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
}

function sectionSeo(section: 'landing' | 'all' | 'button-inserts' | 'keypads') {
  if (section === 'landing') {
    return {
      title: 'Shop | Keypad Store',
      description: 'Browse premium keypads and curated button inserts for high-performance control systems.',
    };
  }
  if (section === 'button-inserts') {
    return {
      title: 'Shop - Button Inserts | Keypad Store',
      description: 'Explore category-sorted button inserts and icon sets built for reliable control workflows.',
    };
  }
  if (section === 'keypads') {
    return {
      title: 'Shop - Keypads | Keypad Store',
      description: 'Compare high-reliability keypad products and find the right layout for your system.',
    };
  }
  return {
    title: 'Shop - All Products | Keypad Store',
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
  const baseShopCanonical = `${siteUrl()}/shop`;
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
    title = `Shop - Button Inserts - ${discipline} | Keypad Store`;
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

export default async function ShopPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = toStringParam(resolvedSearchParams?.q);
  const sectionRaw = toStringParam(resolvedSearchParams?.section);
  const section = normalizeSection(sectionRaw);
  const selectedCategories =
    section === 'button-inserts'
      ? parseCategorySlugs(resolvedSearchParams?.cats, resolvedSearchParams?.cat)
      : [];
  const requestedPage = toPositiveInteger(toStringParam(resolvedSearchParams?.page), 1);
  const requestedTake = toPageSize(toStringParam(resolvedSearchParams?.take));
  const enableIconsPagination =
    (section === 'button-inserts' && selectedCategories.length === 0) || section === 'all';

  let icons;
  let categorySourceIcons;
  let pagination: { page: number; take: number; totalItems: number } | null = null;
  const keypadsPromise = fetchKeypadProducts();
  const baseShopConfigPromise = fetchBaseShopConfigPublic();

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

    icons = pagedIcons.items;
    categorySourceIcons = await fetchIconProducts();
    pagination = {
      page: safePage,
      take: requestedTake,
      totalItems: pagedIcons.totalItems,
    };
  } else {
    icons = await fetchIconProducts();
    categorySourceIcons = icons;
  }

  const keypads = await keypadsPromise;
  const baseShopConfig = await baseShopConfigPromise;

  return (
    <ShopClient
      icons={icons}
      keypads={keypads}
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
  );
}
