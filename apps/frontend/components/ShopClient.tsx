'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from 'react';
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
import { Button, buttonVariants } from './ui/Button';
import { LayoutGrid, List as ListIcon } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [24, 48, 96] as const;
const EMPTY_CATEGORIES: string[] = [];
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
  if (term.length >= 2 && isSubsequence(term, token)) return true;
  if (term.length < 3) return false;
  // Increase tolerance: 2 for short words, 3 for longer words
  const maxDistance = term.length >= 5 ? 3 : 2;
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


function ViewToggle({ viewMode, onChange }: { viewMode: 'grid' | 'list', onChange: (mode: 'grid' | 'list') => void }) {
  return (
    <div className="flex items-center rounded-lg border border-ink/10 bg-white p-1">
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`rounded-md p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-ink/5 text-ink' : 'text-ink/40 hover:bg-ink/5 hover:text-ink/60'}`}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-ink/5 text-ink' : 'text-ink/40 hover:bg-ink/5 hover:text-ink/60'}`}
        aria-label="List view"
      >
        <ListIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function IconPaginationControls({
  location,
  page,
  totalPages,
  take,
  summaryTotal,
  summaryLabel,
  onTakeChange,
  onPrev,
  onNext,
}: {
  location: 'top' | 'bottom';
  page: number;
  totalPages: number;
  take: number;
  summaryTotal: number;
  summaryLabel: string;
  onTakeChange: (nextTake: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const selectId = `shop-page-size-${location}`;
  const wrapperClass =
    location === 'top'
      ? 'mt-6 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 px-4 py-3 text-xs text-ink/60'
      : 'mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 px-4 py-3 text-xs text-ink/60';

  return (
    <div className={wrapperClass}>
      <span>
        Page <span className="font-semibold text-ink">{page}</span> of{' '}
        <span className="font-semibold text-ink">{totalPages}</span> ({summaryTotal} total {summaryLabel})
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
          onClick={onPrev}
          disabled={page <= 1}
          className="rounded-full border border-ink/15 px-3 py-1 font-semibold text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="rounded-full border border-ink/15 px-3 py-1 font-semibold text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function IconResultsGrid({
  iconItems,
  viewMode,
  categoryNamesByIconId,
  activeCategorySlugs,
  isIconsSection,
  isAllSection,
  toCategoryHref,
  toProductHref,
  resolveProductCategoryForBreadcrumb,
}: {
  iconItems: IconProduct[];
  viewMode: 'grid' | 'list';
  categoryNamesByIconId: Map<string, string[]>;
  activeCategorySlugs: string[];
  isIconsSection: boolean;
  isAllSection: boolean;
  toCategoryHref: (categorySlugValue: string) => string;
  toProductHref: (
    slug: string,
    section: 'button-inserts' | 'keypads',
    categorySlugValues?: string[],
    preferredCategorySlug?: string,
    options?: { hubReady?: boolean },
  ) => string;
  resolveProductCategoryForBreadcrumb: (icon: IconProduct) => string;
}) {
  const gridClasses = viewMode === 'grid'
    ? 'staggered grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6'
    : 'flex flex-col gap-3';

  return (
    <div className={gridClasses} style={{ contentVisibility: 'auto' }}>
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
            layout={viewMode}
          />
        );
      })}
    </div>
  );
}

function KeypadResultsGrid({
  keypadItems,
  hubReady,
  replaceDetailNavigation,
  toProductHref,
}: {
  keypadItems: KeypadProduct[];
  hubReady?: boolean;
  replaceDetailNavigation?: boolean;
  toProductHref: (
    slug: string,
    section: 'button-inserts' | 'keypads',
    categorySlugValues?: string[],
    preferredCategorySlug?: string,
    options?: { hubReady?: boolean },
  ) => string;
}) {
  return (
    <div className="staggered grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3" style={{ contentVisibility: 'auto' }}>
      {keypadItems.map((keypad) => (
        <KeypadCard
          key={keypad.id}
          product={keypad}
          mode="shop"
          learnMoreHref={toProductHref(keypad.slug, 'keypads', [], '', { hubReady })}
          replaceDetailNavigation={replaceDetailNavigation === true}
        />
      ))}
    </div>
  );
}

export default function ShopClient({
  icons,
  keypads,
  baseShopConfig,
  categoryCounts,
  catalogIconTotal,
  initialQuery = '',
  initialCategories = EMPTY_CATEGORIES,
  initialSection = 'landing',
  initialPage = 1,
  initialTake = 24,
  pagedTotalItems = 0,
  isIconsPaginationActive = false,
}: {
  icons: IconProduct[];
  keypads: KeypadProduct[];
  baseShopConfig?: BaseShopPublicConfig | null;
  categoryCounts?: IconCategory[];
  catalogIconTotal?: number;
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
  // Derived state from props (URL search params)
  const activeSection = normalizedInitialSection;
  const activeCategorySlugs = normalizedInitialSection === 'button-inserts' ? initialCategories : [];
  const page = Math.max(1, initialPage);
  const take = initialTake;

  // Local state for search input only - not synced back from URL to avoid loop
  const [query, setQuery] = useState('');
  const [iconsGroupOpen, setIconsGroupOpen] = useState(Boolean(initialCategories.length));

  // Debounce query for URL updates
  const debouncedQuery = useDebouncedValue(query, 300);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isPending, startTransition] = useTransition();

  // Sync query input when URL changes externally (e.g. back button)
  useEffect(() => {
    setQuery((previous) => (previous === initialQuery ? previous : initialQuery ?? ''));
  }, [initialQuery]);

  // Expand categories if selected
  useEffect(() => {
    if (activeCategorySlugs.length > 0) setIconsGroupOpen(true);
  }, [activeCategorySlugs.length]);

  const wasSpokeSectionRef = useRef(false);

  const updateParams = useCallback((updates: Record<string, string | number | string[] | null>) => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    });

    if (updates.section && updates.section !== 'button-inserts') {
      params.delete('cats');
      params.delete('cat');
    }

    const queryString = params.toString();
    const target = `${pathname}${queryString ? `?${queryString}` : ''}`;
    startTransition(() => {
      router.replace(target, { scroll: false });
    });
  }, [pathname, router, startTransition]);

  useEffect(() => {
    if (debouncedQuery !== initialQuery) {
      updateParams({ q: debouncedQuery, page: 1 });
    }
  }, [debouncedQuery, initialQuery, updateParams]);

  useEffect(() => {
    const isSpokeSection = activeSection === 'button-inserts' || activeSection === 'keypads';
    if (isSpokeSection && !wasSpokeSectionRef.current) {
      // In a real app we might want to wait for render, but this is a side effect.
      // We can rely on the URL change mostly.
      // Keeping this logic for now as it handles scrolling to a specific anchor.
      const currentHref = `${pathname}${typeof window !== 'undefined' ? window.location.search : ''}${typeof window !== 'undefined' ? window.location.hash : ''}`;
      ensureShopHubAnchor(currentHref);
    }
    wasSpokeSectionRef.current = isSpokeSection;
  }, [activeSection, pathname]);

  const queryTerms = useMemo(() => tokenizeSearchText(debouncedQuery), [debouncedQuery]);

  const totalIconCount = Math.max(catalogIconTotal ?? icons.length, 0);

  const categories = useMemo<IconCategory[]>(() => {
    if (categoryCounts && categoryCounts.length > 0) {
      return [...categoryCounts].sort((a, b) => a.name.localeCompare(b.name));
    }

    const bySlug = new Map<string, IconCategory>();
    for (const icon of icons) {
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
  }, [categoryCounts, icons]);

  const categoriesBySlug = useMemo(() => {
    return new Map(categories.map((category) => [category.slug, category]));
  }, [categories]);

  const isLandingSection = activeSection === 'landing';
  const isAllSection = activeSection === 'all';
  const isCatalogWideSection = isLandingSection || isAllSection;
  const isIconsSection = activeSection === 'button-inserts';
  const isKeypadsSection = activeSection === 'keypads';

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
      .filter(({ tokens, categorySlugs }) => {
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
    // Immediate update on submit
    updateParams({ q: query, page: 1, section: activeSection === 'landing' && query ? 'all' : null });
  };

  const scrollToPageTop = () => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onShopHome = () => {
    setQuery('');
    setIconsGroupOpen(false);
    updateParams({ section: 'landing', q: null, cats: null, page: 1 });
    scrollToPageTop();
  };

  const onSectionChange = (
    section: 'landing' | 'all' | 'button-inserts' | 'keypads',
    options?: { scrollToTop?: boolean },
  ) => {
    if (section === activeSection) return;

    updateParams({
      section,
      page: 1,
      cats: section !== 'button-inserts' ? null : null
    });

    if (options?.scrollToTop) {
      scrollToPageTop();
    }
  };

  const onTopTileSelect = (tile: BaseShopTopTile) => {
    const forcedHref = tile.kind === 'exploreMore' ? '/shop?section=all' : tile.href;
    const safeHref = getSafeUrl(forcedHref);

    if (safeHref.startsWith('/')) {
      startTransition(() => {
        router.push(safeHref);
      });
      return;
    }

    if (typeof window !== 'undefined') window.location.assign(safeHref);
  };

  const onDisciplineTileSelect = (tile: { slug: string }) => {
    if (!tile.slug) return;

    if (categoriesBySlug.has(tile.slug)) {
      updateParams({ section: 'button-inserts', cats: [tile.slug], page: 1 });
      scrollToPageTop();
      return;
    }

    onSectionChange('button-inserts', { scrollToTop: true });
  };

  const clearFilters = () => {
    setQuery(''); // Clear local input
    updateParams({ q: null, cats: null, page: 1 });
  };

  const onTakeChange = (nextTake: number) => {
    if (nextTake === take) return;
    updateParams({ take: nextTake, page: 1 });
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
    ...(query.trim() ? [{
      label: `Search: ${query.trim()}`, onClear: () => {
        setQuery('');
        updateParams({ q: null, page: 1 });
      }
    }] : []),
    ...activeCategorySlugs.map((slug, index) => ({
      label: `Category: ${activeCategoryLabels[index]}`,
      onClear: () => {
        const nextSlugs = activeCategorySlugs.filter((value) => value !== slug);
        updateParams({ cats: nextSlugs.length > 0 ? nextSlugs : null, page: 1 });
      },
    })),
  ];
  const hasActiveFilters = query.trim().length > 0 || activeCategorySlugs.length > 0;
  useEffect(() => {
    if (!(isIconsSection || isAllSection)) return;
    if (page > totalPages) {
      updateParams({ page: totalPages });
    }
  }, [isIconsSection, isAllSection, page, totalPages, updateParams]);

  const shouldShowIconPaginationControls = (isIconsSection || isAllSection) && isAnyIconsPaginationMode;
  const paginationSummaryTotal = isAllSection ? availableResultCount : paginationTotalItems;
  const paginationSummaryLabel = isAllSection ? 'products' : 'button inserts';




  return (
    <div className="mx-auto w-full max-w-[88rem] bg-white px-6 pb-20 pt-10" aria-busy={isPending}>
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
          <div className={`flex items-center gap-4 text-sm text-ink/60 ${isCatalogWideSection ? 'ml-auto' : ''}`}>
            {availableResultCount} {visibleResultLabel} available
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>
        <form onSubmit={onSearch} className="flex flex-col gap-3 md:flex-row md:flex-nowrap md:items-center">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
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
          <Button type="submit" variant="premium" className="shrink-0">Search</Button>
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
                          className={`mt-4 translate-y-2 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 ${buttonVariants({ variant: 'premium' })} ${isExploreMoreTile
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
              <Button
                type="button"
                onClick={() => onSectionChange('button-inserts', { scrollToTop: true })}
                variant="secondary"
              >
                View all inserts
              </Button>
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
              <Button
                type="button"
                onClick={() => onSectionChange('keypads', { scrollToTop: true })}
                variant="secondary"
              >
                View all keypads
              </Button>
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
                            updateParams({ section: 'button-inserts', cats: null, page: 1 });
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
                              let nextSlugs = checked ? [...activeCategorySlugs, category.slug] : activeCategorySlugs.filter((slug) => slug !== category.slug);
                              // Ensure uniqueness
                              nextSlugs = Array.from(new Set(nextSlugs));

                              updateParams({
                                section: 'button-inserts',
                                cats: nextSlugs.length > 0 ? nextSlugs : null,
                                page: 1
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
                    <Button
                      type="button"
                      onClick={clearFilters}
                      variant="ghost"
                      className="px-3 py-1 text-xs h-auto"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {isIconsSection ? 'All categories' : isKeypadsSection ? 'All keypads' : 'All products'}
                </span>
              )}
            </div>
            {shouldShowIconPaginationControls ? (
              <IconPaginationControls
                location="top"
                page={page}
                totalPages={totalPages}
                take={take}
                summaryTotal={paginationSummaryTotal}
                summaryLabel={paginationSummaryLabel}
                onTakeChange={onTakeChange}
                onPrev={() => updateParams({ page: Math.max(1, page - 1) })}
                onNext={() => updateParams({ page: Math.min(totalPages, page + 1) })}
              />
            ) : null}

            {visibleResultCount === 0 ? (
              <div className="card-soft p-8 text-sm text-ink/60">
                {isIconsSection
                  ? 'No button inserts match that search. Try a different query or category.'
                  : isKeypadsSection
                    ? 'No keypads match that search. Try a different query.'
                    : 'No products match that search. Try a different query.'}
              </div>
            ) : isIconsSection ? (
              <IconResultsGrid
                iconItems={displayedIcons}
                viewMode={viewMode}
                categoryNamesByIconId={categoryNamesByIconId}
                activeCategorySlugs={activeCategorySlugs}
                isIconsSection={isIconsSection}
                isAllSection={isAllSection}
                toCategoryHref={toCategoryHref}
                toProductHref={toProductHref}
                resolveProductCategoryForBreadcrumb={resolveProductCategoryForBreadcrumb}
              />
            ) : isKeypadsSection ? (
              <KeypadResultsGrid
                keypadItems={filteredKeypads}
                hubReady
                replaceDetailNavigation
                toProductHref={toProductHref}
              />
            ) : (
              <div className="space-y-6">
                {displayedIcons.length > 0 && (
                  <IconResultsGrid
                    iconItems={displayedIcons}
                    viewMode={viewMode}
                    categoryNamesByIconId={categoryNamesByIconId}
                    activeCategorySlugs={activeCategorySlugs}
                    isIconsSection={isIconsSection}
                    isAllSection={isAllSection}
                    toCategoryHref={toCategoryHref}
                    toProductHref={toProductHref}
                    resolveProductCategoryForBreadcrumb={resolveProductCategoryForBreadcrumb}
                  />
                )}
                {catalogWideKeypads.length > 0 &&
                  (
                    <KeypadResultsGrid
                      keypadItems={catalogWideKeypads}
                      hubReady
                      replaceDetailNavigation={false}
                      toProductHref={toProductHref}
                    />
                  )}
              </div>
            )}

            {shouldShowIconPaginationControls ? (
              <IconPaginationControls
                location="bottom"
                page={page}
                totalPages={totalPages}
                take={take}
                summaryTotal={paginationSummaryTotal}
                summaryLabel={paginationSummaryLabel}
                onTakeChange={onTakeChange}
                onPrev={() => updateParams({ page: Math.max(1, page - 1) })}
                onNext={() => updateParams({ page: Math.min(totalPages, page + 1) })}
              />
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
