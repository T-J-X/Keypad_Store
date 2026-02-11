'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { RING_GLOW_OPTIONS, type IconCatalogItem } from '../../lib/configuratorCatalog';
import { assetUrl, categorySlug } from '../../lib/vendure';

const SLOT_SIZE_MM = 15;

type PopupView = 'icons' | 'swatches';

export default function IconSelectionPopup({
  isOpen,
  isMobile = false,
  slotLabel,
  icons,
  selectedIconId,
  selectedColor,
  onSelectIcon,
  onSelectColor,
  onClose,
}: {
  isOpen: boolean;
  isMobile?: boolean;
  slotLabel: string;
  icons: IconCatalogItem[];
  selectedIconId: string | null;
  selectedColor: string | null;
  onSelectIcon: (icon: IconCatalogItem) => void;
  onSelectColor: (color: string | null) => void;
  onClose: () => void;
}) {
  const [activeView, setActiveView] = useState<PopupView>('icons');
  const [activeCategorySlug, setActiveCategorySlug] = useState('all');

  const sizeMatchedIcons = useMemo(
    () => icons.filter((icon) => icon.sizeMm === SLOT_SIZE_MM),
    [icons],
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

  useEffect(() => {
    if (!isOpen) return;
    setActiveView('icons');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const hasCurrentCategory = categoryTabs.some((tab) => tab.slug === activeCategorySlug);
    if (!hasCurrentCategory) {
      setActiveCategorySlug('all');
    }
  }, [activeCategorySlug, categoryTabs, isOpen]);

  const filteredIcons = useMemo(() => {
    if (activeCategorySlug === 'all') return sizeMatchedIcons;
    return sizeMatchedIcons.filter((icon) =>
      icon.categories.some((category) => categorySlug(category) === activeCategorySlug),
    );
  }, [activeCategorySlug, sizeMatchedIcons]);

  if (!isOpen) return null;

  const tabButtonClass =
    'inline-flex min-h-11 min-w-[102px] items-center justify-center rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.12em] transition';

  const overlayClass = isMobile
    ? 'fixed inset-0 z-[80] flex items-end bg-[#020a18]/72 px-0 py-0 backdrop-blur-[2px]'
    : 'fixed inset-0 z-[80] flex items-center justify-center bg-[#020a18]/72 px-4 py-6 backdrop-blur-[2px]';
  const panelClass = isMobile
    ? 'h-[60vh] w-full overflow-hidden rounded-t-3xl border border-white/15 border-b-0 bg-[linear-gradient(180deg,#0d1f43_0%,#07132a_100%)] shadow-[0_-20px_80px_rgba(2,8,24,0.55)]'
    : 'w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(180deg,#0d1f43_0%,#07132a_100%)] shadow-[0_30px_80px_rgba(2,8,24,0.55)]';
  const bodyClass = isMobile
    ? 'grid h-[calc(60vh-132px)] grid-cols-1 gap-4 overflow-auto px-5 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]'
    : 'grid max-h-[70vh] grid-cols-1 gap-4 overflow-auto px-5 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]';

  return (
    <div className={overlayClass}>
      <div className={panelClass}>
        <div className="flex items-center justify-between border-b border-white/12 px-5 py-4 sm:px-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/80">Icon Library</div>
            <h3 className="mt-1 text-lg font-semibold text-white">{slotLabel}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/50 hover:bg-white/10"
            aria-label="Close icon selector"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/12 px-5 pb-4 pt-3 sm:px-6">
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
        </div>

        {activeView === 'icons' ? (
          <div className={bodyClass}>
            <aside className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/70">Categories</div>
              <div className="flex flex-wrap gap-2 lg:flex-col">
                {categoryTabs.map((tab) => (
                  <button
                    key={tab.slug}
                    type="button"
                    onClick={() => setActiveCategorySlug(tab.slug)}
                    className={[
                      'inline-flex min-h-11 items-center justify-center rounded-full border px-3 text-xs font-semibold tracking-wide transition lg:justify-start',
                      tab.slug === activeCategorySlug
                        ? 'border-[#79b8ff] bg-[#193665] text-white'
                        : 'border-white/20 bg-white/5 text-blue-100 hover:border-white/45 hover:bg-white/10',
                    ].join(' ')}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </aside>

            <section>
              {filteredIcons.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/25 bg-white/5 p-8 text-sm text-blue-100/80">
                  No 15mm icons available for this category.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {filteredIcons
                    .slice()
                    .sort((a, b) => a.iconId.localeCompare(b.iconId))
                    .map((icon) => {
                      const isActive = selectedIconId === icon.iconId;
                      const glossySrc = icon.glossyAssetPath ? assetUrl(icon.glossyAssetPath) : '';
                      return (
                        <button
                          key={icon.id}
                          type="button"
                          onClick={() => {
                            onSelectIcon(icon);
                            setActiveView('swatches');
                          }}
                          className={[
                            'group flex min-h-[162px] flex-col overflow-hidden rounded-2xl border p-3 text-left transition',
                            isActive
                              ? 'border-[#8cc8ff] bg-[#15315f] shadow-[0_0_0_1px_rgba(140,200,255,0.4)]'
                              : 'border-white/18 bg-white/[0.07] hover:border-white/40 hover:bg-white/[0.12]',
                          ].join(' ')}
                        >
                          <div className="relative mb-3 h-20 overflow-hidden rounded-xl bg-[linear-gradient(180deg,#f8fbff_0%,#dce9f8_100%)]">
                            {glossySrc ? (
                              <Image
                                src={glossySrc}
                                alt={icon.name}
                                fill
                                className="object-contain p-3"
                                sizes="160px"
                                loading="lazy"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs font-semibold text-slate-500">
                                Render pending
                              </div>
                            )}
                          </div>
                          <div className="truncate text-sm font-semibold text-white">{icon.name}</div>
                          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-100/70">
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
                className="inline-flex min-h-11 min-w-[120px] items-center justify-center rounded-full border border-white/35 bg-white text-sm font-semibold text-[#04112b] transition hover:border-white hover:bg-blue-50"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
