'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  categorySlug,
  iconCategoriesFromProduct,
  type IconCategory,
  type IconProduct,
  type KeypadProduct,
} from '../lib/vendure';
import BaseShopHero from './BaseShopHero';
import KeypadCard from './KeypadCard';
import ProductCard from './ProductCard';

const PAGE_SIZE_OPTIONS = [24, 48, 96] as const;

function toCardCategoryLabel(categoryNames: string[]) {
  if (categoryNames.length === 0) return 'Uncategorised';
  return categoryNames[0];
}

function normalizeSection(value: string): 'landing' | 'all' | 'button-inserts' | 'keypads' {
  if (value === 'landing') return 'landing';
  if (value === 'all') return 'all';
  if (value === 'keypads') return 'keypads';
  if (value === 'button-inserts' || value === 'icons' || value === 'inserts') return 'button-inserts';
  return 'landing';
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenizeSearchText(value: string) {
  const normalized = normalizeSearchText(value);
  return normalized ? normalized.split(/\s+/g).filter(Boolean) : [];
}

function isSubsequence(term: string, token: string) {
  let termIndex = 0;
  for (let i = 0; i < token.length && termIndex < term.length; i += 1) {
    if (token[i] === term[termIndex]) termIndex += 1;
  }
  return termIndex === term.length;
}

function boundedLevenshtein(a: string, b: string, maxDistance: number) {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    const swap = prev;
    prev = curr;
    curr = swap;
  }
  return prev[b.length];
}

function tokenFuzzyMatch(term: string, token: string) {
  if (token.includes(term) || token.startsWith(term)) return true;
  if (term.length >= 3 && isSubsequence(term, token)) return true;
  if (term.length < 3) return false;
  const maxDistance = term.length >= 6 ? 2 : 1;
  return boundedLevenshtein(term, token, maxDistance) <= maxDistance;
}

function matchesSearchTerms(tokens: string[], queryTerms: string[]) {
  if (queryTerms.length === 0) return true;
  return queryTerms.every((term) => tokens.some((token) => tokenFuzzyMatch(term, token)));
}

export default function ShopClient({
  icons,
  keypads,
  categorySourceIcons,
  initialQuery = '',
  initialCategories = [],
  initialSection = 'landing',
  initialPage = 1,
  initialTake = 24,
  pagedTotalItems = 0,
  isIconsPaginationActive = false,
}: {
  icons: IconProduct[];
  keypads: KeypadProduct[];
  categorySourceIcons?: IconProduct[];
  initialQuery?: string;
  initialCategories?: string[];
  initialSection?: 'landing' | 'all' | 'button-inserts' | 'keypads' | 'icons' | 'inserts';
  initialPage?: number;
  initialTake?: number;
  pagedTotalItems?: number;
  isIconsPaginationActive?: boolean;
}) {
  const normalizedInitialSection = normalizeSection(initialSection);
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<'landing' | 'all' | 'button-inserts' | 'keypads'>(
    normalizedInitialSection,
  );
  const [query, setQuery] = useState(initialQuery);
  const [activeCategorySlugs, setActiveCategorySlugs] = useState<string[]>(
    normalizedInitialSection === 'button-inserts' ? initialCategories : [],
  );
  const [iconsGroupOpen, setIconsGroupOpen] = useState(Boolean(initialCategories.length));
  const [page, setPage] = useState(Math.max(1, initialPage));
  const [take, setTake] = useState(initialTake);
  const lastParams = useRef('');

  useEffect(() => {
    setQuery(initialQuery ?? '');
  }, [initialQuery]);

  useEffect(() => {
    if (normalizedInitialSection !== 'button-inserts') {
      setActiveCategorySlugs([]);
      return;
    }
    setActiveCategorySlugs(initialCategories ?? []);
  }, [initialCategories, normalizedInitialSection]);

  useEffect(() => {
    setActiveSection(normalizedInitialSection);
  }, [normalizedInitialSection]);

  useEffect(() => {
    setPage(Math.max(1, initialPage));
  }, [initialPage]);

  useEffect(() => {
    setTake(initialTake);
  }, [initialTake]);

  useEffect(() => {
    if (activeCategorySlugs.length > 0) setIconsGroupOpen(true);
  }, [activeCategorySlugs]);

  useEffect(() => {
    if (activeSection !== 'button-inserts' && activeCategorySlugs.length > 0) {
      setActiveCategorySlugs([]);
    }
  }, [activeSection, activeCategorySlugs]);

  const categorySeedIcons = categorySourceIcons ?? icons;
  const totalIconCount = categorySeedIcons.length;

  const categories = useMemo<IconCategory[]>(() => {
    const bySlug = new Map<string, IconCategory>();
    for (const icon of categorySeedIcons) {
      for (const categoryName of iconCategoriesFromProduct(icon)) {
        const slug = categorySlug(categoryName);
        const existing = bySlug.get(slug);
        if (existing) {
          existing.count += 1;
        } else {
          bySlug.set(slug, { name: categoryName, slug, count: 1 });
        }
      }
    }
    return Array.from(bySlug.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  }, [categorySeedIcons]);

  const categoriesBySlug = useMemo(() => {
    return new Map(categories.map((category) => [category.slug, category]));
  }, [categories]);

  const categoryNamesByIconId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const icon of icons) {
      map.set(icon.id, iconCategoriesFromProduct(icon));
    }
    return map;
  }, [icons]);

  const isLandingSection = activeSection === 'landing';
  const isAllSection = activeSection === 'all';
  const isCatalogWideSection = isLandingSection || isAllSection;
  const isIconsSection = activeSection === 'button-inserts';
  const isKeypadsSection = activeSection === 'keypads';
  const isAllIconsView = isIconsSection && activeCategorySlugs.length === 0;

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeSection !== 'landing') params.set('section', activeSection);
    const trimmed = query.trim();
    if (trimmed) params.set('q', trimmed);
    if (activeSection === 'button-inserts' && activeCategorySlugs.length > 0) {
      params.set('cats', activeCategorySlugs.join(','));
    }
    const shouldIncludePaginationParams = activeSection === 'button-inserts' || activeSection === 'all';
    if (shouldIncludePaginationParams) {
      params.set('page', String(Math.max(1, page)));
      params.set('take', String(take));
    }
    const next = params.toString();
    if (next === lastParams.current) return;
    lastParams.current = next;
    router.replace(`${pathname}${next ? `?${next}` : ''}`, { scroll: false });
  }, [query, activeCategorySlugs, activeSection, page, take, pathname, router]);

  const queryTerms = useMemo(() => tokenizeSearchText(query), [query]);

  const iconSearchIndex = useMemo(() => {
    return icons.map((icon) => ({
      icon,
      tokens: tokenizeSearchText(
        `${icon.customFields?.iconId ?? ''} ${icon.name ?? ''} ${icon.slug ?? ''} ${iconCategoriesFromProduct(icon).join(' ')}`,
      ),
    }));
  }, [icons]);

  const keypadSearchIndex = useMemo(() => {
    return keypads.map((keypad) => ({
      keypad,
      tokens: tokenizeSearchText(`${keypad.name ?? ''} ${keypad.slug ?? ''} keypad keypads`),
    }));
  }, [keypads]);

  const filteredIcons = useMemo(() => {
    const targetCategories = new Set(activeCategorySlugs);
    const shouldApplyCategoryFilter = isIconsSection;

    return iconSearchIndex
      .filter(({ icon, tokens }) => {
        if (shouldApplyCategoryFilter) {
          const iconCategorySlugs = iconCategoriesFromProduct(icon).map((name) => categorySlug(name));
          const matchesCategory =
            targetCategories.size === 0 || iconCategorySlugs.some((slug) => targetCategories.has(slug));
          if (!matchesCategory) return false;
        }
        return matchesSearchTerms(tokens, queryTerms);
      })
      .map(({ icon }) => icon);
  }, [iconSearchIndex, queryTerms, activeCategorySlugs, isIconsSection]);

  const filteredKeypads = useMemo(() => {
    return keypadSearchIndex
      .filter(({ tokens }) => matchesSearchTerms(tokens, queryTerms))
      .map(({ keypad }) => keypad);
  }, [keypadSearchIndex, queryTerms]);

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(query.trim());
    setPage(1);
  };

  const scrollToPageTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onShopHome = () => {
    setActiveSection('landing');
    setQuery('');
    setActiveCategorySlugs([]);
    setPage(1);
    setIconsGroupOpen(false);
    scrollToPageTop();
  };

  const onSectionChange = (
    section: 'landing' | 'all' | 'button-inserts' | 'keypads',
    options?: { scrollToTop?: boolean },
  ) => {
    if (section === activeSection) return;
    setActiveSection(section);
    setPage(1);
    if (section !== 'button-inserts') {
      setActiveCategorySlugs([]);
    }
    if (options?.scrollToTop) {
      scrollToPageTop();
    }
  };

  const clearFilters = () => {
    setQuery('');
    setActiveCategorySlugs([]);
    setPage(1);
  };

  const onTakeChange = (nextTake: number) => {
    if (nextTake === take) return;
    setTake(nextTake);
    setPage(1);
  };

  const toProductHref = (
    slug: string,
    section: 'button-inserts' | 'keypads',
    categorySlugValues: string[] = [],
    preferredCategorySlug = '',
  ) => {
    const params = new URLSearchParams();
    params.set('from', 'shop');
    params.set('section', section);
    if (section === 'button-inserts' && categorySlugValues.length > 0) {
      params.set('cats', categorySlugValues.join(','));
      const categoryForBreadcrumb =
        preferredCategorySlug && categorySlugValues.includes(preferredCategorySlug)
          ? preferredCategorySlug
          : categorySlugValues[0];
      params.set('cat', categoryForBreadcrumb);
    }
    return `/product/${slug}?${params.toString()}`;
  };

  const toCategoryHref = (categorySlugValue: string) => {
    const params = new URLSearchParams();
    params.set('section', 'button-inserts');
    params.set('cats', categorySlugValue);
    params.set('cat', categorySlugValue);
    params.set('page', '1');
    params.set('take', String(take));
    return `/shop?${params.toString()}`;
  };

  const resolveProductCategoryForBreadcrumb = (icon: IconProduct) => {
    if (activeCategorySlugs.length === 0) return '';
    const productCategorySlugs = iconCategoriesFromProduct(icon).map((name) => categorySlug(name));
    return activeCategorySlugs.find((slug) => productCategorySlugs.includes(slug)) ?? activeCategorySlugs[0];
  };

  const isIconsPaginationMode =
    ((isIconsSection && activeCategorySlugs.length === 0) || isAllSection) && isIconsPaginationActive;
  const isCategoryPaginationMode =
    isIconsSection &&
    !isIconsPaginationMode &&
    activeCategorySlugs.length > 0 &&
    filteredIcons.length > PAGE_SIZE_OPTIONS[0];
  const isAnyIconsPaginationMode = isIconsPaginationMode || isCategoryPaginationMode;
  const paginationTotalItems = isIconsPaginationMode ? pagedTotalItems : filteredIcons.length;
  const totalPages = Math.max(1, Math.ceil(paginationTotalItems / Math.max(1, take)));
  const displayedIcons = useMemo(() => {
    if (isKeypadsSection) return [];
    if (!isCategoryPaginationMode) return filteredIcons;
    const start = (Math.max(1, page) - 1) * take;
    return filteredIcons.slice(start, start + take);
  }, [isKeypadsSection, isCategoryPaginationMode, filteredIcons, page, take]);
  const activeCategoryLabels = activeCategorySlugs.map(
    (slug) => categoriesBySlug.get(slug)?.name ?? slug,
  );
  const searchPlaceholder = isIconsSection
    ? 'Search by button insert ID or name'
    : isKeypadsSection
      ? 'Search by product name or ID'
      : 'Search by name, category or ID...';
  const showCatalogWideKeypads = isCatalogWideSection && query.trim().length > 0;
  const catalogWideKeypads = showCatalogWideKeypads ? filteredKeypads : [];

  const visibleResultCount = isIconsSection
    ? displayedIcons.length
    : isKeypadsSection
      ? filteredKeypads.length
      : displayedIcons.length + catalogWideKeypads.length;
  const visibleResultLabel = isIconsSection ? 'button inserts' : isKeypadsSection ? 'keypads' : 'products';
  const availableResultCount = isIconsSection
    ? (isAnyIconsPaginationMode ? paginationTotalItems : filteredIcons.length)
    : isKeypadsSection
      ? filteredKeypads.length
      : (isIconsPaginationMode ? paginationTotalItems : filteredIcons.length) + catalogWideKeypads.length;
  const activeChips = [
    ...(query.trim() ? [{ label: `Search: ${query.trim()}`, onClear: () => setQuery('') }] : []),
    ...activeCategorySlugs.map((slug, index) => ({
      label: `Category: ${activeCategoryLabels[index]}`,
      onClear: () => {
        setActiveCategorySlugs((current) => current.filter((value) => value !== slug));
        setPage(1);
      },
    })),
  ];
  const hasActiveFilters = query.trim().length > 0 || activeCategorySlugs.length > 0;
  const sidebarButtonBase =
    'flex w-full min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-[background,box-shadow,color,transform] duration-200';
  const sidebarButtonLabel = 'min-w-0 flex-1 whitespace-normal break-words text-left leading-snug';
  const sidebarButtonCount = 'ml-2 shrink-0 whitespace-nowrap text-[11px]';
  const sidebarActive = 'border-2 border-ink bg-ink text-white';
  const sidebarInactive =
    'border-2 border-transparent text-ink/60 bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#d7dde7,#d7dde7)] [background-origin:border-box] [background-clip:padding-box,border-box] hover:text-ink hover:bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(90deg,#4e84d8_0%,#6da5f5_55%,#8ab8ff_100%)] hover:shadow-[0_8px_18px_rgba(4,15,46,0.14)]';

  useEffect(() => {
    if (!(isIconsSection || isAllSection)) return;
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [isIconsSection, isAllSection, page, totalPages]);

  const renderIconPaginationControls = (location: 'top' | 'bottom') => {
    if (!(isIconsSection || isAllSection) || !isAnyIconsPaginationMode) return null;

    const selectId = `shop-page-size-${location}`;
    const paginationSummaryTotal = isAllSection ? availableResultCount : paginationTotalItems;
    const paginationSummaryLabel = isAllSection ? 'products' : 'button inserts';
    const wrapperClass =
      location === 'top'
        ? 'mt-6 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 px-4 py-3 text-xs text-ink/60'
        : 'mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 px-4 py-3 text-xs text-ink/60';

    return (
      <div className={wrapperClass}>
        <span>
          Page <span className="font-semibold text-ink">{page}</span> of{' '}
          <span className="font-semibold text-ink">{totalPages}</span> ({paginationSummaryTotal} total {paginationSummaryLabel})
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={selectId} className="text-ink/60">Per page</label>
          <select
            id={selectId}
            value={take}
            onChange={(event) => onTakeChange(Number(event.target.value))}
            className="rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-semibold text-ink"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="rounded-full border border-ink/15 px-3 py-1 font-semibold text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
            className="rounded-full border border-ink/15 px-3 py-1 font-semibold text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderIconsGrid = (iconItems: IconProduct[]) => (
    <div className="staggered grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {iconItems.map((icon) => {
        const iconCategoryNames = categoryNamesByIconId.get(icon.id) ?? [];
        const primaryCategoryName = iconCategoryNames[0] ?? '';
        const primaryCategorySlug = primaryCategoryName ? categorySlug(primaryCategoryName) : '';
        const breadcrumbCategorySlug = resolveProductCategoryForBreadcrumb(icon);

        return (
          <ProductCard
            key={icon.id}
            product={icon}
            categoryLabel={toCardCategoryLabel(iconCategoryNames)}
            categoryHref={primaryCategorySlug ? toCategoryHref(primaryCategorySlug) : undefined}
            productHref={toProductHref(
              icon.slug,
              'button-inserts',
              activeCategorySlugs,
              breadcrumbCategorySlug,
            )}
          />
        );
      })}
    </div>
  );

  const renderKeypadsGrid = (keypadItems: KeypadProduct[]) => (
    <div className="staggered grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
      {keypadItems.map((keypad) => (
        <KeypadCard
          key={keypad.id}
          product={keypad}
          mode="shop"
          learnMoreHref={toProductHref(keypad.slug, 'keypads')}
        />
      ))}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[88rem] px-6 pb-20 pt-10">
      <BaseShopHero showTiles={isLandingSection} />

      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {(isIconsSection || isKeypadsSection || isAllSection) && (
            <div>
              <div className="pill">
                {isIconsSection ? 'Button Insert Catalog' : isKeypadsSection ? 'Keypad models' : 'All products'}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                {isIconsSection
                  ? 'Explore Inserts: Curated by Discipline.'
                  : isKeypadsSection
                    ? 'Spec Your KeyPad: Precision Defined'
                    : 'Explore Technical Hardware & Components'}
              </h1>
              {isKeypadsSection && (
                <p className="mt-2 text-sm text-ink/60">Compare keypad models, then continue to configuration.</p>
              )}
            </div>
          )}
          <div className={`text-sm text-ink/60 ${isCatalogWideSection ? 'ml-auto' : ''}`}>
            {availableResultCount} {visibleResultLabel} available
          </div>
        </div>
        <form onSubmit={onSearch} className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="input flex-1"
            aria-label={
              isIconsSection
                ? 'Search button inserts'
                : isKeypadsSection
                  ? 'Search keypads'
                  : 'Search products'
            }
          />
          <button type="submit" className="btn-primary shrink-0">Search</button>
        </form>
      </div>

      <div className="grid gap-8 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
        <aside className="space-y-6 md:sticky md:top-24 md:self-start">
          <div className="card md:max-h-[calc(100vh-7rem)] md:overflow-y-auto md:pr-1">
            <div className="px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                Categories
              </div>
              <div className="mt-4 space-y-2">
              {!isLandingSection && (
                <button
                  type="button"
                  onClick={onShopHome}
                  className={`${sidebarButtonBase} ${sidebarInactive}`}
                >
                  <span className={sidebarButtonLabel}>Shop Home</span>
                </button>
              )}

              <button
                type="button"
                aria-pressed={isAllSection}
                onClick={() => onSectionChange('all', { scrollToTop: true })}
                className={`${sidebarButtonBase} ${
                  isAllSection ? sidebarActive : sidebarInactive
                }`}
              >
                <span className={sidebarButtonLabel}>All products</span>
                <span className={`${sidebarButtonCount} ${isAllSection ? 'text-white/75' : 'text-ink/45'}`}>
                  {totalIconCount + keypads.length}
                </span>
              </button>

              <button
                type="button"
                aria-pressed={isIconsSection}
                aria-expanded={iconsGroupOpen}
                aria-controls="icons-subcategories"
                onClick={() => {
                  if (!isIconsSection) {
                    setActiveSection('button-inserts');
                    setPage(1);
                    scrollToPageTop();
                  }
                  setIconsGroupOpen((prev) => !prev);
                }}
                className={`${sidebarButtonBase} ${
                  isIconsSection ? sidebarActive : sidebarInactive
                }`}
              >
                <span className={sidebarButtonLabel}>Button Inserts</span>
                <span
                  className={`ml-2 flex shrink-0 items-center gap-2 whitespace-nowrap ${
                    isIconsSection ? 'text-white/75' : 'text-ink/45'
                  }`}
                >
                  <span className={sidebarButtonCount}>{totalIconCount}</span>
                  <span className={`text-base transition ${iconsGroupOpen ? 'rotate-90' : ''}`}>&gt;</span>
                </span>
              </button>

              {isIconsSection && iconsGroupOpen && (
                <div id="icons-subcategories" className="w-full space-y-2 pl-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategorySlugs([]);
                      setPage(1);
                      scrollToPageTop();
                    }}
                    className={`${sidebarButtonBase} ${
                      activeCategorySlugs.length === 0 ? sidebarActive : sidebarInactive
                    }`}
                  >
                    <span className={sidebarButtonLabel}>All button inserts</span>
                    <span
                      className={`${sidebarButtonCount} ${
                        activeCategorySlugs.length === 0 ? 'text-white/75' : 'text-ink/45'
                      }`}
                    >
                      {totalIconCount}
                    </span>
                  </button>

                  {categories.map((category) => (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => {
                        setActiveCategorySlugs((current) => {
                          if (current.includes(category.slug)) {
                            return current.filter((slug) => slug !== category.slug);
                          }
                          return [...current, category.slug];
                        });
                        setPage(1);
                      }}
                      className={`${sidebarButtonBase} ${
                        activeCategorySlugs.includes(category.slug) ? sidebarActive : sidebarInactive
                      }`}
                    >
                      <span className={sidebarButtonLabel}>{category.name}</span>
                      <span
                        className={`${sidebarButtonCount} ${
                          activeCategorySlugs.includes(category.slug) ? 'text-white/75' : 'text-ink/45'
                        }`}
                      >
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div aria-hidden className="my-2 border-t border-ink/10" />

              <button
                type="button"
                aria-pressed={isKeypadsSection}
                onClick={() => onSectionChange('keypads', { scrollToTop: true })}
                className={`${sidebarButtonBase} ${
                  isKeypadsSection ? sidebarActive : sidebarInactive
                }`}
              >
                <span className={sidebarButtonLabel}>Keypads</span>
                <span className={`${sidebarButtonCount} ${isKeypadsSection ? 'text-white/75' : 'text-ink/45'}`}>
                  {keypads.length}
                </span>
              </button>
              </div>
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/60">
            <span>
              Showing <span className="font-semibold text-ink">{visibleResultCount}</span> {visibleResultLabel}
            </span>
            {activeChips.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={chip.onClear}
                    className="flex items-center gap-2 rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70 transition hover:border-ink/25"
                  >
                    <span>{chip.label}</span>
                    <span className="text-ink/40">x</span>
                  </button>
                ))}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-ghost px-3 py-1 text-xs"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {isIconsSection ? 'All categories' : isKeypadsSection ? 'All keypads' : 'All products'}
              </span>
            )}
          </div>
          {renderIconPaginationControls('top')}

          {visibleResultCount === 0 ? (
            <div className="card-soft p-8 text-sm text-ink/60">
              {isIconsSection
                ? 'No button inserts match that search. Try a different query or category.'
                : isKeypadsSection
                  ? 'No keypads match that search. Try a different query.'
                  : 'No products match that search. Try a different query.'}
            </div>
          ) : isIconsSection ? (
            renderIconsGrid(displayedIcons)
          ) : isKeypadsSection ? (
            renderKeypadsGrid(filteredKeypads)
          ) : (
            <div className="space-y-6">
              {displayedIcons.length > 0 && renderIconsGrid(displayedIcons)}
              {catalogWideKeypads.length > 0 && renderKeypadsGrid(catalogWideKeypads)}
            </div>
          )}

          {renderIconPaginationControls('bottom')}
        </section>
      </div>
    </div>
  );
}
