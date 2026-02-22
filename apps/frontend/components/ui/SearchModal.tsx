'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, Search, X } from 'lucide-react';
import { useEffect, useReducer, useRef, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogTitle } from './dialog';
import { searchProductsAction, type SearchResultItem } from '../../app/actions/search';

interface SearchState {
  query: string;
  results: SearchResultItem[];
  isLoading: boolean;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useReducer((_: T, next: T) => next, value);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => window.clearTimeout(handler);
  }, [value, delayMs]);

  return debounced;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [state, updateState] = useReducer(
    (prev: SearchState, next: Partial<SearchState>) => ({ ...prev, ...next }),
    { query: '', results: [], isLoading: false },
  );
  const { query, results, isLoading } = state;

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (!isOpen) {
      updateState({ query: '', results: [], isLoading: false });
      return;
    }

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    const fetchResults = async () => {
      if (debouncedQuery.trim().length < 2) {
        if (active) {
          updateState({ results: [], isLoading: false });
        }
        return;
      }

      if (active) {
        updateState({ isLoading: true });
      }

      try {
        const items = await searchProductsAction(debouncedQuery);
        if (active) {
          updateState({ results: items, isLoading: false });
        }
      } catch (error) {
        console.error('Search error:', error);
        if (active) {
          updateState({ isLoading: false });
        }
      }
    };

    void fetchResults();

    return () => {
      active = false;
    };
  }, [debouncedQuery, isOpen]);

  const closeModal = () => {
    onClose();
  };

  const submitSearch = () => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    router.push(`/shop?q=${encodeURIComponent(normalizedQuery)}`);
    closeModal();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitSearch();
  };

  const handleResultClick = (slug: string) => {
    router.push(`/shop/product/${slug}`);
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl overflow-hidden rounded-2xl border border-surface-border bg-white p-0 shadow-2xl ring-1 ring-black/5"
      >
        <DialogTitle className="sr-only">Search products</DialogTitle>

        <form onSubmit={handleSubmit} className="relative flex items-center border-b border-surface-border p-4">
          <Search className="h-5 w-5 text-ink-muted" aria-hidden="true" />
          <label htmlFor="site-search-input" className="sr-only">
            Search products, IDs, or categories
          </label>
          <input
            id="site-search-input"
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent px-4 py-2 text-lg text-ink placeholder:text-ink-muted focus:outline-none"
            placeholder="Search products, IDs, or categories..."
            aria-label="Search products, IDs, or categories"
            value={query}
            onChange={(event) => updateState({ query: event.target.value })}
          />
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </form>

        <div className="bg-surface-alt/50 px-4 py-3 text-xs font-medium text-ink-muted">
          <div className="flex items-center justify-between">
            <span>{results.length > 0 ? 'Search Results' : 'Recent Searches'}</span>
            <span className="hidden sm:inline-block">Press enter to search all</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-ink-muted">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="grid gap-1">
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleResultClick(result.slug)}
                  className="group flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-surface-alt"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-surface-border bg-white">
                    {result.image ? (
                      <Image
                        src={result.image}
                        alt={`${result.name} product search result ${result.iconId ?? result.slug}`.replace(/\s+/g, ' ').trim()}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-50 text-ink-muted">
                        <Search className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-ink">{result.name}</span>
                      {result.iconId ? (
                        <span className="rounded bg-surface-border px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                          {result.iconId}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-ink-muted">Product Code: {result.slug}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
              <button
                type="button"
                onClick={submitSearch}
                className="mt-2 flex w-full items-center justify-center rounded-xl border border-dashed border-surface-border py-3 text-sm font-medium text-ink-muted transition-colors hover:border-ink/20 hover:bg-surface-alt hover:text-ink"
              >
                View all results for &quot;{query}&quot;
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {!query ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/shop/keypads');
                      closeModal();
                    }}
                    className="group flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-surface-alt"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-white text-ink-muted transition-colors group-hover:border-ink/20 group-hover:text-ink">
                        <Search className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-ink">Browse All Keypads</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/shop/button-inserts');
                      closeModal();
                    }}
                    className="group flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-surface-alt"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-white text-ink-muted transition-colors group-hover:border-ink/20 group-hover:text-ink">
                        <Search className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-ink">Browse Button Inserts</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </>
              ) : null}

              {query && !isLoading ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-ink-muted">No products found for &quot;{query}&quot;</p>
                  <button
                    type="button"
                    onClick={submitSearch}
                    className="mt-2 text-xs font-medium text-sky-500 transition-colors hover:text-sky-600 hover:underline"
                  >
                    Try a broader search
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
