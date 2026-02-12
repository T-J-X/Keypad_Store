'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { RING_GLOW_OPTIONS, type IconCatalogItem } from '../../lib/configuratorCatalog';
import { assetUrl, categorySlug } from '../../lib/vendure';
import { useFuzzySearch, matchesSearchTerms } from '../../hooks/configurator/useFuzzySearch';
import { useRecommendationEngine } from '../../hooks/configurator/useRecommendationEngine';

type PopupView = 'icons' | 'swatches';

function normalizeIconId(value: string | null | undefined) {
  return (value ?? '').trim().toUpperCase();
}

export default function IconSelectionPopup({
  isOpen,
  isMobile = false,
  slotSizeMm,
  slotLabel,
  icons,
  selectedIconId,
  selectedColor,
  selectedIconIds = [],
  recommendationSeedIconId = null,
  onSelectIcon,
  onSelectColor,
  onClose,
}: {
  isOpen: boolean;
  isMobile?: boolean;
  slotSizeMm: number;
  slotLabel: string;
  icons: IconCatalogItem[];
  selectedIconId: string | null;
  selectedColor: string | null;
  selectedIconIds?: string[];
  recommendationSeedIconId?: string | null;
  onSelectIcon: (icon: IconCatalogItem) => void;
  onSelectColor: (color: string | null) => void;
  onClose: () => void;
}) {
  const [activeView, setActiveView] = useState<PopupView>('icons');
  const [activeCategorySlug, setActiveCategorySlug] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendationSeed, setRecommendationSeed] = useState<string | null>(null);

  const sizeMatchedIcons = useMemo(
    () => icons.filter((icon) => icon.sizeMm === slotSizeMm),
    [icons, slotSizeMm],
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
    if (!isOpen) return;
    setActiveView('icons');
    setSearchQuery('');
    setRecommendationSeed(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const hasCurrentCategory = categoryTabs.some((tab) => tab.slug === activeCategorySlug);
    if (!hasCurrentCategory) {
      setActiveCategorySlug('all');
    }
  }, [activeCategorySlug, categoryTabs, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow || '';
    };
  }, [isOpen]);

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
    const fromSlots = selectedIconIds.map(normalizeIconId).filter(Boolean);
    const current = normalizeIconId(selectedIconId);
    if (current && !fromSlots.includes(current)) {
      fromSlots.push(current);
    }
    return Array.from(new Set(fromSlots));
  }, [selectedIconId, selectedIconIds]);

  const { recommendedIds } = useRecommendationEngine({
    seedIconId: recommendationSeed ?? recommendationSeedIconId ?? selectedIconId,
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

  const hasAnySelection = normalizedSelectedIconIds.length > 0;

  if (!isOpen) return null;

  const tabButtonClass =
    'inline-flex min-h-10 min-w-[98px] items-center justify-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition';

  const overlayClass = isMobile
    ? 'fixed inset-0 z-[80] flex items-end bg-[#020a18]/74 px-0 py-0 backdrop-blur-[2px]'
    : 'fixed inset-0 z-[80] flex items-center justify-center bg-[#020a18]/74 px-4 py-6 backdrop-blur-[2px]';
  const panelClass = isMobile
    ? 'h-[74vh] w-full overflow-hidden rounded-t-3xl border border-white/15 border-b-0 bg-[linear-gradient(180deg,#0d1f43_0%,#07132a_100%)] shadow-[0_-20px_80px_rgba(2,8,24,0.55)]'
    : 'h-[78vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(180deg,#0d1f43_0%,#07132a_100%)] shadow-[0_30px_80px_rgba(2,8,24,0.55)]';

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={`${panelClass} flex flex-col`} onClick={(event) => event.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-white/12 px-5 py-4 sm:px-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/80">Icon Library</div>
            <h3 className="mt-1 text-lg font-semibold text-white">{slotLabel}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/50 hover:bg-white/10"
            aria-label="Close icon selector"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="sticky top-0 z-20 border-b border-white/12 bg-[#081733]/88 px-5 pb-4 pt-3 backdrop-blur-xl sm:px-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveView('icons')}
                className={`${tabButtonClass} ${
                  activeView === 'icons'
                    ? 'border-white/70 bg-white text-[#05112a]'
                    : 'border-white/25 bg-transparent text-blue-100 hover:border-white/55'
                }`}
              >
                Icons
              </button>
              <button
                type="button"
                onClick={() => setActiveView('swatches')}
                className={`${tabButtonClass} ${
                  activeView === 'swatches'
                    ? 'border-white/70 bg-white text-[#05112a]'
                    : 'border-white/25 bg-transparent text-blue-100 hover:border-white/55'
                }`}
              >
                Ring Glow
              </button>
            </div>

            {activeView === 'icons' ? (
              <>
                <div className="mt-3">
                  <label htmlFor="icon-search" className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100/70">
                    Search icons
                  </label>
                  <input
                    id="icon-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by name, ID, SKU, category"
                    className="h-10 w-full rounded-full border border-white/22 bg-white/[0.08] px-4 text-sm text-blue-50 placeholder:text-blue-100/60 outline-none backdrop-blur-[6px] transition focus:border-[#8cc8ff] focus:bg-white/[0.12]"
                  />
                </div>

                <div className="mt-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100/70">Categories</div>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {categoryTabs.map((tab) => (
                      <button
                        key={tab.slug}
                        type="button"
                        onClick={() => setActiveCategorySlug(tab.slug)}
                        className={[
                          'inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border px-3 text-[11px] font-semibold tracking-wide transition',
                          tab.slug === activeCategorySlug
                            ? 'border-[#79b8ff] bg-[#193665] text-white'
                            : 'border-white/20 bg-white/5 text-blue-100 hover:border-white/45 hover:bg-white/10',
                        ].join(' ')}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {activeView === 'icons' ? (
            <div className="space-y-4 px-5 py-5 sm:px-6">
              {hasAnySelection && recommendedIcons.length > 0 ? (
                <section>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100/80">
                      Recommended for your setup
                    </h4>
                    <span className="rounded-full border border-[#1EA7FF]/45 bg-[#1EA7FF]/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a7ddff]">
                      Frequently Paired
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                    {recommendedIcons.map((icon) => {
                      const isActive = normalizeIconId(selectedIconId) === normalizeIconId(icon.iconId);
                      const glossySrc = icon.glossyAssetPath ? assetUrl(icon.glossyAssetPath) : '';
                      return (
                        <button
                          key={`recommended-${icon.id}`}
                          type="button"
                          onClick={() => {
                            onSelectIcon(icon);
                            setRecommendationSeed(icon.iconId);
                            setActiveView('swatches');
                          }}
                          className={[
                            'group relative flex min-h-[118px] flex-col overflow-hidden rounded-2xl border p-2 text-left transition',
                            isActive
                              ? 'border-[#8cc8ff] bg-[#15315f] shadow-[0_0_0_1px_rgba(140,200,255,0.4)]'
                              : 'border-[#1EA7FF]/55 bg-[#0d2146]/85 shadow-[0_0_0_1px_rgba(30,167,255,0.25)] hover:border-[#69cbff] hover:bg-[#163566]',
                          ].join(' ')}
                        >
                          <span className="pointer-events-none absolute right-2 top-2 rounded-full border border-[#7fd5ff]/55 bg-[#1EA7FF]/18 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#b5e6ff]">
                            Recommended
                          </span>
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
                    })}
                  </div>
                </section>
              ) : null}

              <section>
                {filteredIcons.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/25 bg-white/5 p-8 text-sm text-blue-100/80">
                    {searchQuery.trim()
                      ? `No ${slotSizeMm}mm icons match "${searchQuery.trim()}" across all categories.`
                      : `No ${slotSizeMm}mm icons available for this category.`}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                    {filteredIcons.map((icon) => {
                      const isActive = normalizeIconId(selectedIconId) === normalizeIconId(icon.iconId);
                      const isRecommended = recommendedIds.includes(normalizeIconId(icon.iconId));
                      const glossySrc = icon.glossyAssetPath ? assetUrl(icon.glossyAssetPath) : '';
                      return (
                        <button
                          key={icon.id}
                          type="button"
                          onClick={() => {
                            onSelectIcon(icon);
                            setRecommendationSeed(icon.iconId);
                            setActiveView('swatches');
                          }}
                          className={[
                            'group relative flex min-h-[118px] flex-col overflow-hidden rounded-2xl border p-2 text-left transition',
                            isActive
                              ? 'border-[#8cc8ff] bg-[#15315f] shadow-[0_0_0_1px_rgba(140,200,255,0.4)]'
                              : 'border-white/18 bg-white/[0.07] hover:border-white/40 hover:bg-white/[0.12]',
                            isRecommended
                              ? 'shadow-[0_0_0_1px_rgba(30,167,255,0.32)]'
                              : '',
                          ].join(' ')}
                        >
                          {isRecommended ? (
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
                    })}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="px-5 py-6 sm:px-6">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/70">Swatches</div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {RING_GLOW_OPTIONS.map((option) => {
                  const isActive = (selectedColor ?? null) === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => onSelectColor(option.value)}
                      className={[
                        'inline-flex min-h-12 items-center justify-between rounded-full border px-4 text-sm font-semibold transition',
                        isActive
                          ? 'border-[#8cc8ff] bg-[#17345f] text-white shadow-[0_0_0_1px_rgba(140,200,255,0.4)]'
                          : 'border-white/20 bg-white/[0.07] text-blue-100 hover:border-white/50 hover:bg-white/[0.12]',
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
                  onClick={onClose}
                  className="inline-flex min-h-10 min-w-[110px] items-center justify-center rounded-full border border-white/35 bg-white px-4 text-sm font-semibold text-[#04112b] transition hover:border-white hover:bg-blue-50"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
