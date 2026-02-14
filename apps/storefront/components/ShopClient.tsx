'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  assetUrl,
  categorySlug,
  iconCategoriesFromProduct,
  type BaseShopPublicConfig,
  type BaseShopTopTile,
  type IconCategory,
  type IconProduct,
  type KeypadProduct,
} from '../lib/vendure';
import { useShopLandingSubcategoryIcons } from '../lib/useShopLandingSubcategoryIcons';
import { ensureShopHubAnchor } from '../lib/shopHistory';
import BaseShopHero from './BaseShopHero';
import CategoryCard from './CategoryCard';
import KeypadCard from './KeypadCard';
import ProductCard from './ProductCard';

const PAGE_SIZE_OPTIONS = [24, 48, 96] as const;
const ringBlueHoverClass =
  'border-2 border-transparent bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#d7dde7,#d7dde7)] [background-origin:border-box] [background-clip:padding-box,border-box] hover:bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(90deg,#4e84d8_0%,#6da5f5_55%,#8ab8ff_100%)] hover:shadow-[0_10px_24px_rgba(4,15,46,0.16)]';
const DEFAULT_EXPLORE_MORE_IMAGE_URL =
  'https://upload.wikimedia.org/wikipedia/commons/4/4d/Barber_Vintage_Motorsports_Museum_%28Birmingham%2C_Alabama%29_-_race_cars_display_1.jpg';
const fallbackTopTiles: BaseShopTopTile[] = [
  {
    id: 'button-inserts',
    label: 'Button Inserts',
    subtitle: 'Browse category-sorted inserts and find the exact symbol set for your workflow.',
    href: '/shop?section=button-inserts',
    hoverStyle: 'ring-blue',
    kind: 'section',
    isEnabled: true,
  },
  {
    id: 'keypads',
    label: 'Keypads',
    subtitle: 'Compare layouts, hardware formats, and jump directly into configuration.',
    href: '/shop?section=keypads',
    hoverStyle: 'ring-blue',
    kind: 'section',
    isEnabled: true,
  },
];

const SAFE_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:']);

function getSafeUrl(url: string | null | undefined): string {
  const value = (url ?? '').trim();
  if (!value) return '/shop';
  if (value.startsWith('/')) return value;
  try {
    const parsed = new URL(value);
    if (SAFE_EXTERNAL_PROTOCOLS.has(parsed.protocol)) return parsed.toString();
  } catch {
    // Invalid URLs fall back to a safe in-app location.
  }
  return '/shop';
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}

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

function humanizeDisciplineId(value: string) {
  const normalized = value.trim().replace(/[-_]+/g, ' ');
  if (!normalized) return value;
  return normalized.replace(/\b\w/g, (match) => match.toUpperCase());
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

type IconSearchEntry = {
  icon: IconProduct;
  tokens: string[];
  categoryNames: string[];
  categorySlugs: string[];
};

export default function ShopClient({
  icons,
  keypads,
  baseShopConfig,
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
  baseShopConfig?: BaseShopPublicConfig | null;
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
  const wasSpokeSectionRef = useRef(false);
  const debouncedQuery = useDebouncedValue(query, 300);

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
    return Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categorySeedIcons]);

  const categoriesBySlug = useMemo(() => {
    return new Map(categories.map((category) => [category.slug, category]));
  }, [categories]);

  const isLandingSection = activeSection === 'landing';
  const isAllSection = activeSection === 'all';
  const isCatalogWideSection = isLandingSection || isAllSection;
  const isIconsSection = activeSection === 'button-inserts';
  const isKeypadsSection = activeSection === 'keypads';

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeSection !== 'landing') params.set('section', activeSection);
    const trimmed = debouncedQuery.trim();
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
  }, [debouncedQuery, activeCategorySlugs, activeSection, page, take, pathname, router]);

  useEffect(() => {
    const isSpokeSection = activeSection === 'button-inserts' || activeSection === 'keypads';
    if (isSpokeSection && !wasSpokeSectionRef.current) {
      const currentHref = `${pathname}${window.location.search}${window.location.hash}`;
      ensureShopHubAnchor(currentHref);
    }
    wasSpokeSectionRef.current = isSpokeSection;
  }, [activeSection, pathname]);

  const queryTerms = useMemo(() => tokenizeSearchText(debouncedQuery), [debouncedQuery]);

  const iconSearchIndex = useMemo<IconSearchEntry[]>(() => {
    return icons.map((icon) => {
      const categoryNames = iconCategoriesFromProduct(icon);
      return {
        categoryNames,
        categorySlugs: categoryNames.map((name) => categorySlug(name)),
        icon,
        tokens: tokenizeSearchText(
          `${icon.customFields?.iconId ?? ''} ${icon.name ?? ''} ${icon.slug ?? ''} ${categoryNames.join(' ')}`,
        ),
      };
    });
  }, [icons]);

  const categoryNamesByIconId = useMemo(
    () => new Map(iconSearchIndex.map((entry) => [entry.icon.id, entry.categoryNames])),
    [iconSearchIndex],
  );

  const categorySlugsByIconId = useMemo(
    () => new Map(iconSearchIndex.map((entry) => [entry.icon.id, entry.categorySlugs])),
    [iconSearchIndex],
  );

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
      .filter(({ icon, tokens, categorySlugs }) => {
        if (shouldApplyCategoryFilter) {
          const matchesCategory =
            targetCategories.size === 0 || categorySlugs.some((slug) => targetCategories.has(slug));
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

  const onTopTileSelect = (tile: BaseShopTopTile) => {
    const forcedHref = tile.kind === 'exploreMore' ? '/shop?section=all' : tile.href;
    const safeHref = getSafeUrl(forcedHref);

    if (safeHref.startsWith('/')) {
      router.push(safeHref);
      return;
    }

    window.location.assign(safeHref);
  };

  const onDisciplineTileSelect = (tile: { slug: string }) => {
    if (!tile.slug) return;

    if (tile.slug && categoriesBySlug.has(tile.slug)) {
      setActiveSection('button-inserts');
      setActiveCategorySlugs([tile.slug]);
      setPage(1);
      scrollToPageTop();
      return;
    }

    onSectionChange('button-inserts', { scrollToTop: true });
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
    options?: { hubReady?: boolean },
  ) => {
    const params = new URLSearchParams();
    params.set('from', 'shop');
    params.set('section', section);
    if (options?.hubReady) {
      params.set('hub', '1');
    }
    if (section === 'button-inserts' && categorySlugValues.length > 0) {
      params.set('cats', categorySlugValues.join(','));
      const categoryForBreadcrumb =
        preferredCategorySlug && categorySlugValues.includes(preferredCategorySlug)
          ? preferredCategorySlug
          : categorySlugValues[0];
      params.set('cat', categoryForBreadcrumb);
    }
    return `/shop/product/${slug}?${params.toString()}`;
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
    const productCategorySlugs = categorySlugsByIconId.get(icon.id) ?? [];
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
      : 'Search by name, category or ID…';
  const showCatalogWideKeypads = isCatalogWideSection && query.trim().length > 0;
  const catalogWideKeypads = showCatalogWideKeypads ? filteredKeypads : [];
  const configuredTopTiles = useMemo(() => {
    const enabledTopTiles = (baseShopConfig?.topTiles ?? []).filter((tile) => tile.isEnabled !== false);
    if (enabledTopTiles.length === 0) return [];

    return [...enabledTopTiles]
      .sort((a, b) => {
        const aExplore = a.kind === 'exploreMore' ? 1 : 0;
        const bExplore = b.kind === 'exploreMore' ? 1 : 0;
        return aExplore - bExplore;
      })
      .slice(0, 6);
  }, [baseShopConfig]);
  const landingTopTiles = configuredTopTiles.length > 0 ? configuredTopTiles : fallbackTopTiles;
  const landingDisciplineTiles = useShopLandingSubcategoryIcons({
    categories,
    overrides: baseShopConfig?.disciplineTiles ?? [],
  });
  const featuredLandingKeypads = useMemo(() => {
    const configuredSlugs = baseShopConfig?.featuredProductSlugs ?? [];
    if (configuredSlugs.length === 0) return keypads.slice(0, 3);

    const keypadsBySlug = new Map(keypads.map((keypad) => [keypad.slug, keypad]));
    const fromConfig = configuredSlugs
      .map((slug) => keypadsBySlug.get(slug))
      .filter((keypad): keypad is KeypadProduct => Boolean(keypad));
    return fromConfig.length > 0 ? fromConfig : keypads.slice(0, 3);
  }, [baseShopConfig, keypads]);
  const visibleResultCount = isLandingSection
    ? 0
    : isIconsSection
      ? displayedIcons.length
      : isKeypadsSection
        ? filteredKeypads.length
        : displayedIcons.length + catalogWideKeypads.length;
  const visibleResultLabel = isIconsSection ? 'button inserts' : isKeypadsSection ? 'keypads' : 'products';
  const availableResultCount = isLandingSection
    ? totalIconCount + keypads.length
    : isIconsSection
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
    <div className="staggered grid grid-cols-2 gap-3 min-[430px]:grid-cols-3 lg:grid-cols-4">
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
              { hubReady: isIconsSection || isAllSection },
            )}
            replaceProductNavigation={isIconsSection}
          />
        );
      })}
    </div>
  );

  const renderKeypadsGrid = (
    keypadItems: KeypadProduct[],
    options?: { hubReady?: boolean; replaceDetailNavigation?: boolean },
  ) => (
    <div className="staggered grid gap-6 sm:grid-cols-2 xl:grid-cols-2">
      {keypadItems.map((keypad) => (
        <KeypadCard
          key={keypad.id}
          product={keypad}
          mode="shop"
          learnMoreHref={toProductHref(keypad.slug, 'keypads', [], '', { hubReady: options?.hubReady })}
          replaceDetailNavigation={options?.replaceDetailNavigation === true}
        />
      ))}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[88rem] bg-white px-6 pb-20 pt-10">
      <BaseShopHero showTiles={false} />

      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {(isIconsSection || isKeypadsSection || isAllSection) && (
            <div>
              <div className="pill">
                {isIconsSection ? 'Button Insert Catalog' : isKeypadsSection ? 'Keypad models' : 'All products'}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                {isIconsSection
                  ? 'Explore Inserts: Curated by Category.'
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

      {isLandingSection ? (
        <section className="space-y-12">
          <section className="card rounded-3xl p-5 md:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                  Product Categories
                </h2>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {landingTopTiles.map((tile) => {
                const href = tile.kind === 'exploreMore' ? '/shop?section=all' : (tile.href ?? '').trim();
                const isInteractive = href.length > 0 && tile.isEnabled !== false;
                const shouldUseRingBlue = isInteractive && (tile.hoverStyle ?? 'ring-blue') !== 'none';
                const isExploreMoreTile = tile.kind === 'exploreMore';
                const tileImage = tile.imageSource || tile.imagePreview || (isExploreMoreTile ? DEFAULT_EXPLORE_MORE_IMAGE_URL : '');
                const tileImageUrl = tileImage ? assetUrl(tileImage) : '';
                const tileTitle =
                  tile.label?.trim() || (tile.kind === 'exploreMore' ? 'Discover more' : humanizeDisciplineId(tile.id));
                const tileSubtitle = tile.subtitle?.trim() || '';

                const cardClass = `group relative overflow-hidden rounded-2xl text-left ${shouldUseRingBlue ? ringBlueHoverClass : 'border border-ink/10 bg-white'} ${isInteractive
                    ? 'cursor-pointer transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5'
                    : 'cursor-default'
                  }`;

                const content = (
                  <div className={`relative h-64 w-full ${tileImage ? '' : 'bg-[linear-gradient(145deg,#e8eef9_0%,#f7fbff_48%,#e1ebfa_100%)]'}`}>
                    {tileImage ? (
                      <Image
                        src={tileImageUrl}
                        alt={tileTitle}
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="pointer-events-none absolute -right-16 -top-12 h-40 w-40 rounded-full bg-white/70 blur-2xl" />
                    )}
                    {isInteractive && tileImage ? (
                      <div
                        className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${isExploreMoreTile
                            ? 'bg-black/45 opacity-60 group-hover:opacity-85'
                            : 'bg-black/25 opacity-55 group-hover:opacity-75'
                          }`}
                      />
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className={`text-lg font-semibold leading-tight ${isInteractive ? 'text-white' : 'text-ink'}`}>
                        {tileTitle}
                      </p>
                      {tileSubtitle ? (
                        <p className={`mt-2 text-sm ${isInteractive ? 'text-white/85' : 'text-ink/60'}`}>{tileSubtitle}</p>
                      ) : null}
                      {isInteractive ? (
                        <span
                          className={`btn-primary mt-4 translate-y-2 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 ${isExploreMoreTile
                              ? 'bg-surface text-ink shadow-sm'
                              : ''
                            }`}
                        >
                          {tile.kind === 'exploreMore' ? 'Discover more' : 'Explore'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );

                return isInteractive ? (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => onTopTileSelect(tile)}
                    className={cardClass}
                  >
                    {content}
                  </button>
                ) : (
                  <div key={tile.id} className={cardClass}>
                    {content}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card rounded-3xl p-5 md:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                  Button Insert Categories
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSectionChange('button-inserts', { scrollToTop: true })}
                className="btn-secondary"
              >
                View all inserts
              </button>
            </div>
            {landingDisciplineTiles.length > 0 ? (
              <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {landingDisciplineTiles.map((tile) => {
                  const isInteractive = Boolean(tile.slug);

                  return (
                    <div key={tile.id} className="h-full">
                      {isInteractive ? (
                        <CategoryCard
                          label={tile.label}
                          count={tile.count}
                          image={tile.image}
                          onClick={() => onDisciplineTileSelect(tile)}
                        />
                      ) : (
                        <CategoryCard
                          label={tile.label}
                          count={tile.count}
                          image={tile.image}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card-soft rounded-2xl p-6 text-sm text-ink/60">
                No insert categories are available yet.
              </div>
            )}
          </section>

          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                  Popular Keypads to Start From
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSectionChange('keypads', { scrollToTop: true })}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-ink/15 px-5 py-2 text-sm font-semibold text-ink whitespace-nowrap transition hover:border-ink/35"
              >
                View all keypads
              </button>
            </div>
            {featuredLandingKeypads.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-3">
                {featuredLandingKeypads.map((keypad, index) => (
                  <div key={keypad.id} className={index === 0 ? 'lg:col-span-2' : ''}>
                    <KeypadCard
                      product={keypad}
                      mode="shop"
                      learnMoreHref={toProductHref(keypad.slug, 'keypads', [], '', { hubReady: false })}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-soft p-8 text-sm text-ink/60">
                No featured keypads are available yet.
              </div>
            )}
          </section>
        </section>
      ) : (
        <div className="grid gap-8 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
          <aside className="space-y-6 md:sticky md:top-24 md:self-start">
            <div className="card-soft md:max-h-[calc(100vh-7rem)] md:overflow-y-auto md:pr-1">
              <div className="px-4 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
                  Browse
                </div>
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={onShopHome}
                    className="flex w-full items-center justify-between rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm font-semibold tracking-tight text-ink transition hover:border-ink/25 hover:bg-surface-alt"
                  >
                    <span>Shop Home</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={isAllSection}
                    onClick={() => onSectionChange('all', { scrollToTop: true })}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold tracking-tight transition ${isAllSection
                        ? 'border-ink bg-ink text-white'
                        : 'border-surface-border bg-surface text-ink hover:border-ink/25 hover:bg-surface-alt'
                      }`}
                  >
                    <span>All products</span>
                    <span className={`text-[11px] ${isAllSection ? 'text-white/75' : 'text-ink/45'}`}>
                      {totalIconCount + keypads.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={isIconsSection}
                    onClick={() => onSectionChange('button-inserts', { scrollToTop: true })}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold tracking-tight transition ${isIconsSection
                        ? 'border-ink bg-ink text-white'
                        : 'border-surface-border bg-surface text-ink hover:border-ink/25 hover:bg-surface-alt'
                      }`}
                  >
                    <span>Button Inserts</span>
                    <span className={`text-[11px] ${isIconsSection ? 'text-white/75' : 'text-ink/45'}`}>{totalIconCount}</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={isKeypadsSection}
                    onClick={() => onSectionChange('keypads', { scrollToTop: true })}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold tracking-tight transition ${isKeypadsSection
                        ? 'border-ink bg-ink text-white'
                        : 'border-surface-border bg-surface text-ink hover:border-ink/25 hover:bg-surface-alt'
                      }`}
                  >
                    <span>Keypads</span>
                    <span className={`text-[11px] ${isKeypadsSection ? 'text-white/75' : 'text-ink/45'}`}>{keypads.length}</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-surface-border px-4 py-4">
                <button
                  type="button"
                  aria-expanded={iconsGroupOpen}
                  aria-controls="icons-subcategories"
                  onClick={() => setIconsGroupOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-xl border border-surface-border bg-surface px-3 py-2 text-left text-sm font-semibold tracking-tight text-ink transition hover:border-ink/25 hover:bg-surface-alt"
                >
                  <span>Insert filters</span>
                  <span className={`transition ${iconsGroupOpen ? 'rotate-180' : ''}`}>⌄</span>
                </button>

                {iconsGroupOpen ? (
                  <div id="icons-subcategories" className="mt-3 space-y-2">
                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-ink transition hover:border-ink/20">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-surface-border text-ink focus:ring-ink/25"
                          checked={activeCategorySlugs.length === 0}
                          onChange={() => {
                            setActiveSection('button-inserts');
                            setActiveCategorySlugs([]);
                            setPage(1);
                            scrollToPageTop();
                          }}
                        />
                        <span className="font-medium">All button inserts</span>
                      </span>
                      <span className="text-[11px] text-ink/45">{totalIconCount}</span>
                    </label>

                    {categories.map((category) => (
                      <label
                        key={category.slug}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface px-3 py-2 text-sm text-ink transition hover:border-ink/20"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-surface-border text-ink focus:ring-ink/25"
                            checked={activeCategorySlugs.includes(category.slug)}
                            onChange={(event) => {
                              const { checked } = event.target;
                              setActiveSection('button-inserts');
                              setPage(1);
                              setActiveCategorySlugs((current) => {
                                if (checked) return Array.from(new Set([...current, category.slug]));
                                return current.filter((slug) => slug !== category.slug);
                              });
                            }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </span>
                        <span className="text-[11px] text-ink/45">{category.count}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
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
              renderKeypadsGrid(filteredKeypads, {
                hubReady: true,
                replaceDetailNavigation: true,
              })
            ) : (
              <div className="space-y-6">
                {displayedIcons.length > 0 && renderIconsGrid(displayedIcons)}
                {catalogWideKeypads.length > 0 &&
                  renderKeypadsGrid(catalogWideKeypads, {
                    hubReady: true,
                    replaceDetailNavigation: false,
                  })}
              </div>
            )}

            {renderIconPaginationControls('bottom')}
          </section>
        </div>
      )}
    </div>
  );
}
