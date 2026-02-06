'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { IconProduct, KeypadProduct } from '../lib/vendure';
import { buildCategoryTree, normalizeCategoryPath } from '../lib/vendure';
import ProductCard from './ProductCard';

export default function ShopClient({
  icons,
  keypads,
  initialQuery = '',
  initialCategory = ''
}: {
  icons: IconProduct[];
  keypads: KeypadProduct[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [activePath, setActivePath] = useState(initialCategory);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const lastParams = useRef('');

  useEffect(() => {
    setQuery(initialQuery ?? '');
  }, [initialQuery]);

  useEffect(() => {
    setActivePath(initialCategory ?? '');
  }, [initialCategory]);

  const categoryTree = useMemo(() => {
    const paths = icons.map((icon) => normalizeCategoryPath(icon.customFields?.iconCategoryPath));
    return buildCategoryTree(paths);
  }, [icons]);

  useEffect(() => {
    if (!categoryTree.children.length) return;
    if (Object.keys(openCats).length) return;
    const next: Record<string, boolean> = {};
    categoryTree.children.forEach((node) => {
      next[node.path] = true;
    });
    setOpenCats(next);
  }, [categoryTree, openCats]);

  useEffect(() => {
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set('q', trimmed);
    if (activePath) params.set('cat', activePath);
    const next = params.toString();
    if (next === lastParams.current) return;
    lastParams.current = next;
    router.replace(`${pathname}${next ? `?${next}` : ''}`, { scroll: false });
  }, [query, activePath, pathname, router]);

  const filteredIcons = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const target = activePath ? normalizeCategoryPath(activePath) : '';

    return icons.filter((icon) => {
      const iconCategory = normalizeCategoryPath(icon.customFields?.iconCategoryPath);
      const matchesCategory =
        !target || iconCategory === target || iconCategory.startsWith(`${target}/`);
      if (!matchesCategory) return false;

      if (!trimmed) return true;
      const hay = `${icon.customFields?.iconId ?? ''} ${icon.name ?? ''} ${icon.slug ?? ''}`.toLowerCase();
      return hay.includes(trimmed);
    });
  }, [icons, query, activePath]);

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(query.trim());
  };

  const clearFilters = () => {
    setQuery('');
    setActivePath('');
  };

  const isBranchActive = (path: string) => {
    if (!activePath) return false;
    return activePath === path || activePath.startsWith(`${path}/`);
  };

  const activeChips = [
    ...(query.trim() ? [{ label: `Search: ${query.trim()}`, onClear: () => setQuery('') }] : []),
    ...(activePath ? [{ label: `Category: ${activePath}`, onClear: () => setActivePath('') }] : [])
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="pill">Icon catalog</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              Explore every icon, organized by workflow.
            </h1>
          </div>
          <div className="text-sm text-ink/60">{filteredIcons.length} icons available</div>
        </div>
        <form onSubmit={onSearch} className="flex flex-col gap-3 md:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by icon ID, name, or slug"
            className="input flex-1"
            aria-label="Search icons"
          />
          <button type="submit" className="btn-primary">Search</button>
          {(query || activePath) && (
            <button type="button" className="btn-ghost" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </form>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6">
          <div className="card p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">Keypads</div>
            <div className="mt-4 space-y-3">
              <Link href="/configurator" className="text-sm font-semibold text-ink hover:text-moss">
                Browse configurator
              </Link>
              <div className="space-y-2 text-sm text-ink/60">
                {keypads.length === 0 ? (
                  <span>No keypad models yet.</span>
                ) : (
                  keypads.map((keypad) => (
                    <Link
                      key={keypad.id}
                      href={`/configurator/${keypad.slug}`}
                      className="block rounded-full border border-transparent px-3 py-1 transition hover:border-ink/15 hover:text-ink"
                    >
                      {keypad.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink/40">
              Icon categories
              <span className="text-ink/30">{icons.length}</span>
            </div>
            <div className="mt-4 space-y-4">
              <button
                type="button"
                onClick={() => setActivePath('')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  !activePath ? 'bg-ink text-white' : 'text-ink/70 hover:text-ink'
                }`}
              >
                All icons
                <span className={`${!activePath ? 'text-white/70' : 'text-ink/40'}`}>{icons.length}</span>
              </button>

              {categoryTree.children.map((node) => {
                const branchActive = isBranchActive(node.path);
                const isOpen = openCats[node.path];
                return (
                  <div key={node.path} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setOpenCats((prev) => ({ ...prev, [node.path]: !prev[node.path] }))}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        branchActive
                          ? 'border-ink/30 bg-ink/5 text-ink'
                          : 'border-ink/10 text-ink/70 hover:border-ink/25'
                      }`}
                    >
                      <span>{node.name}</span>
                      <span className="flex items-center gap-2 text-ink/40">
                        <span className="text-xs">{node.count}</span>
                        <span className={`text-base transition ${isOpen ? 'rotate-90' : ''}`}>&gt;</span>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="ml-3 flex flex-col gap-2 border-l border-ink/10 pl-3">
                        <button
                          type="button"
                          onClick={() => setActivePath(node.path)}
                          className={`text-left text-xs font-semibold uppercase tracking-wide ${
                            activePath === node.path ? 'text-ink' : 'text-ink/50 hover:text-ink'
                          }`}
                        >
                          All {node.name}
                        </button>
                        {node.children.map((child) => (
                          <button
                            key={child.path}
                            type="button"
                            onClick={() => setActivePath(child.path)}
                            className={`text-left text-sm ${
                              activePath === child.path ? 'font-semibold text-ink' : 'text-ink/60 hover:text-ink'
                            }`}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/60">
            <span>
              Showing <span className="font-semibold text-ink">{filteredIcons.length}</span> icons
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
              </div>
            ) : (
              <span className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                All categories
              </span>
            )}
          </div>

          {filteredIcons.length === 0 ? (
            <div className="card-soft p-8 text-sm text-ink/60">
              No icons match that search. Try a different query or category.
            </div>
          ) : (
            <div className="staggered grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredIcons.map((icon) => (
                <ProductCard key={icon.id} product={icon} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
