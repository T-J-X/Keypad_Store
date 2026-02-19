'use client';

import Image from 'next/image';
import { createContext, use, useEffect, useId, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { RING_GLOW_OPTIONS, type IconCatalogItem } from '../../lib/configuratorCatalog';
import { assetUrl, categorySlug } from '../../lib/vendure';
import { useFuzzySearch, matchesSearchTerms } from '../../hooks/configurator/useFuzzySearch';
import { useRecommendationEngine } from '../../hooks/configurator/useRecommendationEngine';
import AccessibleModal from '../ui/AccessibleModal';
import { KeypadContext } from './KeypadProvider';
import type { KeypadConfiguratorContextValue } from './types';

type PopupView = 'icons' | 'swatches';

type IconSelectionPopupProps = {
  isOpen?: boolean;
  isMobile?: boolean;
  slotSizeMm?: number;
  slotLabel?: string;
  icons?: IconCatalogItem[];
  selectedIconId?: string | null;
  selectedColor?: string | null;
  selectedIconIds?: string[];
  recommendationSeedIconId?: string | null;
  onSelectIcon?: (icon: IconCatalogItem) => void;
  onSelectColor?: (color: string | null) => void;
  onClose?: () => void;
};

type ResolvedPopupProps = {
  isOpen: boolean;
  isMobile: boolean;
  slotSizeMm: number;
  slotLabel: string;
  icons: IconCatalogItem[];
  selectedIconId: string | null;
  selectedColor: string | null;
  selectedIconIds: string[];
  recommendationSeedIconId: string | null;
  onSelectIcon: (icon: IconCatalogItem) => void;
  onSelectColor: (color: string | null) => void;
  onClose: () => void;
};

type IconPickerContextValue = {
  props: ResolvedPopupProps;
  state: {
    activeView: PopupView;
    activeCategorySlug: string;
    searchQuery: string;
    recommendationSeed: string | null;
  };
  derived: {
    categoryTabs: Array<{ slug: string; name: string }>;
    filteredIcons: IconCatalogItem[];
    recommendedIcons: IconCatalogItem[];
    recommendedIds: string[];
    hasAnySelection: boolean;
    normalizedSelectedIconIds: string[];
  };
  actions: {
    setActiveView: (view: PopupView) => void;
    setActiveCategorySlug: (slug: string) => void;
    setSearchQuery: (query: string) => void;
    selectIcon: (icon: IconCatalogItem) => void;
    selectColor: (color: string | null) => void;
    close: () => void;
  };
};

function normalizeIconId(value: string | null | undefined) {
  return (value ?? '').trim().toUpperCase();
}

const IconPickerContext = createContext<IconPickerContextValue | null>(null);

function resolvePopupProps(
  props: IconSelectionPopupProps,
  context: KeypadConfiguratorContextValue | null,
): ResolvedPopupProps {
  const popupSlotId = context?.state.popupSlotId ?? null;
  const slotLabelFromContext = popupSlotId ? (context?.state.slotLabels[popupSlotId] ?? 'Slot') : 'Slot';

  const selectIconFromContext = (icon: IconCatalogItem) => {
    if (!context || !popupSlotId) return;
    context.actions.selectIconForSlot(popupSlotId, icon);
  };

  const selectColorFromContext = (color: string | null) => {
    if (!context || !popupSlotId) return;
    context.actions.setSlotGlowForSlot(popupSlotId, color);
  };

  return {
    isOpen: props.isOpen ?? Boolean(popupSlotId),
    isMobile: props.isMobile ?? context?.state.isMobile ?? false,
    slotSizeMm: props.slotSizeMm ?? context?.meta.geometry.slotSizeMm ?? 15,
    slotLabel: props.slotLabel ?? slotLabelFromContext,
    icons: props.icons ?? context?.state.icons ?? [],
    selectedIconId: props.selectedIconId ?? (popupSlotId ? context?.state.slots[popupSlotId]?.iconId ?? null : null),
    selectedColor: props.selectedColor ?? (popupSlotId ? context?.state.slots[popupSlotId]?.color ?? null : null),
    selectedIconIds: props.selectedIconIds ?? context?.state.selectedIconIds ?? [],
    recommendationSeedIconId: props.recommendationSeedIconId ?? context?.state.recommendationSeedIconId ?? null,
    onSelectIcon: props.onSelectIcon ?? selectIconFromContext,
    onSelectColor: props.onSelectColor ?? selectColorFromContext,
    onClose: props.onClose ?? context?.actions.closeSlot ?? (() => { }),
  };
}

function IconPickerProvider({
  resolved,
  children,
}: {
  resolved: ResolvedPopupProps;
  children: React.ReactNode;
}) {
  const [activeView, setActiveView] = useState<PopupView>('icons');
  const [activeCategorySlug, setActiveCategorySlug] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendationSeed, setRecommendationSeed] = useState<string | null>(null);

  const sizeMatchedIcons = useMemo(
    () => resolved.icons.filter((icon) => icon.sizeMm === resolved.slotSizeMm),
    [resolved.icons, resolved.slotSizeMm],
  );

  const categoryTabs = useMemo(() => {
    const map = new Map<string, string>();
    for (const icon of sizeMatchedIcons) {
      const categories = icon.categories.length > 0 ? icon.categories : ['Uncategorised'];
      for (const category of categories) {
        map.set(categorySlug(category), category);
      }
    }
    return [{ slug: 'all', name: 'All' }, ...Array.from(map.entries()).map(([slug, name]) => ({ slug, name }))]
      .sort((a, b) => {
        if (a.slug === 'all') return -1;
        if (b.slug === 'all') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [sizeMatchedIcons]);

  const { queryTerms, index: iconSearchIndex } = useFuzzySearch({
    items: sizeMatchedIcons,
    query: searchQuery,
    getSearchText: (icon) => `${icon.name} ${icon.iconId} ${icon.sku ?? ''} ${icon.categories.join(' ')}`,
  });

  useEffect(() => {
    if (!resolved.isOpen) return;
    setActiveView('icons');
    setSearchQuery('');
    setRecommendationSeed(null);
  }, [resolved.isOpen]);

  useEffect(() => {
    if (!resolved.isOpen) return;
    const hasCurrentCategory = categoryTabs.some((tab) => tab.slug === activeCategorySlug);
    if (!hasCurrentCategory) {
      setActiveCategorySlug('all');
    }
  }, [activeCategorySlug, categoryTabs, resolved.isOpen]);

  const filteredIcons = useMemo(() => {
    const categoryScoped =
      activeCategorySlug === 'all'
        ? iconSearchIndex
        : iconSearchIndex.filter(({ item: icon }) =>
          icon.categories.some((category) => categorySlug(category) === activeCategorySlug),
        );

    const searchBase = queryTerms.length > 0 ? iconSearchIndex : categoryScoped;

    return searchBase
      .filter(({ tokens }) => matchesSearchTerms(tokens, queryTerms))
      .map(({ item: icon }) => icon)
      .sort((a, b) => a.iconId.localeCompare(b.iconId));
  }, [activeCategorySlug, iconSearchIndex, queryTerms]);

  const normalizedSelectedIconIds = useMemo(() => {
    const fromSlots = resolved.selectedIconIds.map(normalizeIconId).filter(Boolean);
    const current = normalizeIconId(resolved.selectedIconId);
    if (current && !fromSlots.includes(current)) {
      fromSlots.push(current);
    }
    return Array.from(new Set(fromSlots));
  }, [resolved.selectedIconId, resolved.selectedIconIds]);

  const { recommendedIds } = useRecommendationEngine({
    seedIconId: recommendationSeed ?? resolved.recommendationSeedIconId ?? resolved.selectedIconId,
    selectedIconIds: normalizedSelectedIconIds,
  });

  const recommendedIcons = useMemo(() => {
    if (recommendedIds.length === 0) return [];

    const iconById = new Map(sizeMatchedIcons.map((icon) => [normalizeIconId(icon.iconId), icon]));

    const iconsFromRecommendations = recommendedIds
      .map((id) => iconById.get(normalizeIconId(id)) ?? null)
      .filter((icon): icon is IconCatalogItem => Boolean(icon))
      .filter((icon) => {
        if (queryTerms.length === 0) return true;
        const tokens = iconSearchIndex.find(({ item }) => item.id === icon.id)?.tokens ?? [];
        return matchesSearchTerms(tokens, queryTerms);
      });

    return Array.from(new Map(iconsFromRecommendations.map((icon) => [icon.id, icon])).values());
  }, [iconSearchIndex, queryTerms, recommendedIds, sizeMatchedIcons]);

  const value = useMemo<IconPickerContextValue>(() => ({
    props: resolved,
    state: {
      activeView,
      activeCategorySlug,
      searchQuery,
      recommendationSeed,
    },
    derived: {
      categoryTabs,
      filteredIcons,
      recommendedIcons,
      recommendedIds,
      hasAnySelection: normalizedSelectedIconIds.length > 0,
      normalizedSelectedIconIds,
    },
    actions: {
      setActiveView,
      setActiveCategorySlug,
      setSearchQuery,
      selectIcon: (icon) => {
        resolved.onSelectIcon(icon);
        setRecommendationSeed(icon.iconId);
        setActiveView('swatches');
      },
      selectColor: (color) => {
        resolved.onSelectColor(color);
      },
      close: resolved.onClose,
    },
  }), [
    activeCategorySlug,
    activeView,
    categoryTabs,
    filteredIcons,
    normalizedSelectedIconIds,
    recommendationSeed,
    recommendedIcons,
    recommendedIds,
    resolved,
    searchQuery,
  ]);

  return (
    <IconPickerContext value={value}>
      {children}
    </IconPickerContext>
  );
}

function IconPickerTabs() {
  const context = use(IconPickerContext);
  if (!context) return null;

  const tabButtonClass =
    'inline-flex min-h-10 min-w-[98px] items-center justify-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition';

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => context.actions.setActiveView('icons')}
        className={`${tabButtonClass} ${context.state.activeView === 'icons'
          ? 'border-white/70 bg-white text-[#05112a]'
          : 'border-white/25 bg-transparent text-blue-100 hover:border-white/55'
          }`}
      >
        Icons
      </button>
      <button
        type="button"
        onClick={() => context.actions.setActiveView('swatches')}
        className={`${tabButtonClass} ${context.state.activeView === 'swatches'
          ? 'border-white/70 bg-white text-[#05112a]'
          : 'border-white/25 bg-transparent text-blue-100 hover:border-white/55'
          }`}
      >
        Ring Glow
      </button>
    </div>
  );
}

function IconPickerSearchAndCategories() {
  const context = use(IconPickerContext);
  if (!context || context.state.activeView !== 'icons') return null;

  return (
    <>
      <div className="mt-3">
        <label htmlFor="icon-search" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100/70">
          Search icons
        </label>
        <input
          id="icon-search"
          type="search"
          value={context.state.searchQuery}
          onChange={(event) => context.actions.setSearchQuery(event.target.value)}
          placeholder="Search by name, ID, SKU, category"
          className="input input-dark h-10 rounded-full"
        />
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100/70">Categories</div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {context.derived.categoryTabs.map((tab) => (
            <button
              key={tab.slug}
              type="button"
              onClick={() => context.actions.setActiveCategorySlug(tab.slug)}
              className={[
                'inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border px-3 text-[11px] font-semibold tracking-wide transition',
                tab.slug === context.state.activeCategorySlug
                  ? 'border-panel-accent bg-panel-light text-white shadow-[0_0_0_1px_rgba(30,167,255,0.25)]'
                  : 'border-white/10 bg-white/5 text-panel-muted hover:border-white/30 hover:bg-white/10',
              ].join(' ')}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function IconCard({
  icon,
  isActive,
  recommendedBadge = false,
  recommendedStyle = false,
  onSelect,
}: {
  icon: IconCatalogItem;
  isActive: boolean;
  recommendedBadge?: boolean;
  recommendedStyle?: boolean;
  onSelect: (icon: IconCatalogItem) => void;
}) {
  const glossySrc = icon.glossyAssetPath ? assetUrl(icon.glossyAssetPath) : '';
  return (
    <button
      type="button"
      onClick={() => onSelect(icon)}
      className={[
        'group relative flex min-h-[118px] flex-col overflow-hidden rounded-2xl border p-2 text-left transition',
        isActive
          ? 'border-panel-accent bg-panel-light shadow-[0_0_0_1px_rgba(30,167,255,0.4)]'
          : (recommendedStyle
            ? 'border-panel-accent/50 bg-panel-light shadow-[0_0_0_1px_rgba(30,167,255,0.15)] hover:border-panel-accent/80'
            : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'),
      ].join(' ')}
    >
      {recommendedBadge ? (
        <span className="pointer-events-none absolute right-2 top-2 rounded-full border border-[#7fd5ff]/45 bg-[#1EA7FF]/12 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#b5e6ff]">
          Recommended
        </span>
      ) : null}
      <div className="relative mb-2 h-14 overflow-hidden rounded-lg bg-[linear-gradient(180deg,#f8fbff_0%,#dce9f8_100%)]">
        {glossySrc ? (
          <Image
            src={glossySrc}
            alt={icon.name}
            fill
            className="object-contain p-2"
            sizes="112px"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-[10px] font-semibold text-slate-500">
            Render pending
          </div>
        )}
      </div>
      <div className="truncate text-xs font-semibold text-white">{icon.name}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-100/70">
        {icon.iconId}
      </div>
    </button>
  );
}

function IconPickerIconResults() {
  const context = use(IconPickerContext);
  if (!context || context.state.activeView !== 'icons') return null;

  const { filteredIcons, recommendedIcons, hasAnySelection, recommendedIds } = context.derived;
  const selectedIconId = context.props.selectedIconId;
  const searchQuery = context.state.searchQuery.trim();

  return (
    <div className="space-y-4 px-5 py-5 sm:px-6">
      {hasAnySelection && recommendedIcons.length > 0 ? (
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-panel-muted">
              Recommended for your setup
            </h4>
            <span className="rounded-full border border-[#1EA7FF]/45 bg-[#1EA7FF]/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a7ddff]">
              Frequently Paired
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
            {recommendedIcons.map((icon) => (
              <IconCard
                key={`recommended-${icon.id}`}
                icon={icon}
                isActive={normalizeIconId(selectedIconId) === normalizeIconId(icon.iconId)}
                recommendedBadge
                recommendedStyle
                onSelect={context.actions.selectIcon}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        {filteredIcons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-panel-muted">
            {searchQuery
              ? `No ${context.props.slotSizeMm}mm icons match "${searchQuery}" across all categories.`
              : `No ${context.props.slotSizeMm}mm icons available for this category.`}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
            {filteredIcons.map((icon) => (
              <IconCard
                key={icon.id}
                icon={icon}
                isActive={normalizeIconId(selectedIconId) === normalizeIconId(icon.iconId)}
                recommendedBadge={recommendedIds.includes(normalizeIconId(icon.iconId))}
                onSelect={context.actions.selectIcon}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function IconPickerSwatches() {
  const context = use(IconPickerContext);
  if (!context || context.state.activeView !== 'swatches') return null;

  return (
    <div className="px-5 py-6 sm:px-6">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-panel-muted">Swatches</div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {RING_GLOW_OPTIONS.map((option) => {
          const isActive = (context.props.selectedColor ?? null) === option.value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => context.actions.selectColor(option.value)}
              className={[
                'inline-flex min-h-12 items-center justify-between rounded-full border px-4 text-sm font-semibold transition',
                isActive
                  ? 'border-panel-accent bg-panel-light text-white shadow-[0_0_0_1px_rgba(30,167,255,0.4)]'
                  : 'border-white/10 bg-white/5 text-panel-muted hover:border-white/30 hover:bg-white/10',
              ].join(' ')}
            >
              <span>{option.label}</span>
              <span
                className="h-4 w-4 rounded-full border border-white/40"
                style={{
                  background:
                    option.value == null
                      ? 'linear-gradient(135deg, transparent 0%, transparent 45%, rgba(255,255,255,0.9) 45%, rgba(255,255,255,0.9) 55%, transparent 55%, transparent 100%)'
                      : option.value,
                }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={context.actions.close}
          className="btn-premium"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function IconPickerModal() {
  const context = use(IconPickerContext);
  const titleId = useId();
  const descriptionId = useId();

  if (!context) return null;

  const overlayClass = context.props.isMobile
    ? 'fixed inset-0 z-[80] flex items-end bg-[#020a18]/74 px-0 py-0 backdrop-blur-[2px]'
    : 'fixed inset-0 z-[80] flex items-center justify-center bg-[#020a18]/74 px-4 py-6 backdrop-blur-[2px]';
  const panelClass = context.props.isMobile
    ? 'h-[85vh] w-full overflow-hidden rounded-t-3xl border border-panel-border border-b-0 bg-panel shadow-[0_-20px_80px_rgba(2,8,24,0.55)]'
    : 'h-[78vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-panel-border bg-panel shadow-[0_30px_80px_rgba(2,8,24,0.55)]';

  return (
    <AccessibleModal
      open={context.props.isOpen}
      onClose={context.actions.close}
      labelledBy={titleId}
      describedBy={descriptionId}
      backdropClassName={overlayClass}
      panelClassName={`${panelClass} flex flex-col`}
    >
      <div className={`flex shrink-0 items-center justify-between border-b border-white/12 px-5 py-4 sm:px-6 ${context.props.isMobile ? 'py-3' : ''}`}>
        <div>
          <div id={descriptionId} className="text-xs font-semibold uppercase tracking-[0.16em] text-panel-muted">Icon Library</div>
          <h3 id={titleId} className="mt-1 text-lg font-semibold text-white">{context.props.slotLabel}</h3>
        </div>
        <button
          type="button"
          onClick={context.actions.close}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/50 hover:bg-white/10"
          aria-label="Close icon selector"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-20 border-b border-white/5 bg-panel/95 px-5 pb-4 pt-3 backdrop-blur-xl sm:px-6">
          <IconPickerTabs />
          <IconPickerSearchAndCategories />
        </div>
        <IconPickerIconResults />
        <IconPickerSwatches />
      </div>
    </AccessibleModal>
  );
}

function IconSelectionPopupRoot(props: IconSelectionPopupProps) {
  const keypadContext = use(KeypadContext);
  const resolved = useMemo(
    () => resolvePopupProps(props, keypadContext),
    [keypadContext, props],
  );

  if (!resolved.isOpen) return null;

  return (
    <IconPickerProvider resolved={resolved}>
      <IconPickerModal />
    </IconPickerProvider>
  );
}

const IconSelectionPopup = Object.assign(IconSelectionPopupRoot, {
  Provider: IconPickerProvider,
  Modal: IconPickerModal,
  Tabs: IconPickerTabs,
  SearchAndCategories: IconPickerSearchAndCategories,
  IconResults: IconPickerIconResults,
  Swatches: IconPickerSwatches,
});

export default IconSelectionPopup;
