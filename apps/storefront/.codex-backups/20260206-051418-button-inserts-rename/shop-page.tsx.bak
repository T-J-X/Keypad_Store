import ShopClient from '../../components/ShopClient';
import { fetchIconProducts, fetchIconProductsPage, fetchKeypadProducts } from '../../lib/vendure.server';

type SearchParams = {
  q?: string | string[];
  cat?: string | string[];
  section?: string | string[];
  page?: string | string[];
  take?: string | string[];
};

const PAGE_SIZE_OPTIONS = [24, 48, 96] as const;
const DEFAULT_PAGE_SIZE = 24;

function toStringParam(value?: string | string[]) {
  return typeof value === 'string' ? value : '';
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

export default async function ShopPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = toStringParam(resolvedSearchParams?.q);
  const category = toStringParam(resolvedSearchParams?.cat);
  const sectionRaw = toStringParam(resolvedSearchParams?.section);
  const section = sectionRaw === 'keypads' ? 'keypads' : 'icons';
  const requestedPage = toPositiveInteger(toStringParam(resolvedSearchParams?.page), 1);
  const requestedTake = toPageSize(toStringParam(resolvedSearchParams?.take));
  const enableIconsPagination = section === 'icons' && !category;

  let icons;
  let categorySourceIcons;
  let pagination: { page: number; take: number; totalItems: number } | null = null;
  const keypadsPromise = fetchKeypadProducts();

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

  return (
    <ShopClient
      icons={icons}
      keypads={keypads}
      categorySourceIcons={categorySourceIcons}
      initialQuery={query}
      initialCategory={category}
      initialSection={section}
      initialPage={pagination?.page ?? 1}
      initialTake={pagination?.take ?? DEFAULT_PAGE_SIZE}
      pagedTotalItems={pagination?.totalItems ?? 0}
      isIconsPaginationActive={Boolean(pagination)}
    />
  );
}
