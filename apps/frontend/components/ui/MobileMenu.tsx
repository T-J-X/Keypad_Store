'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, Search, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useReducer, useState, type FormEvent, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetTitle } from './sheet';
import { searchProductsAction, type SearchResultItem } from '../../app/actions/search';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  cartQuantity: number;
  onLogout: () => void;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => window.clearTimeout(handler);
  }, [value, delayMs]);

  return debounced;
}

type SearchState = {
  results: SearchResultItem[];
  isSearching: boolean;
};

type SearchAction =
  | { type: 'reset' }
  | { type: 'start' }
  | { type: 'success'; results: SearchResultItem[] }
  | { type: 'error' };

const INITIAL_SEARCH_STATE: SearchState = {
  results: [],
  isSearching: false,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'reset':
      return INITIAL_SEARCH_STATE;
    case 'start':
      return state.isSearching ? state : { ...state, isSearching: true };
    case 'success':
      return { results: action.results, isSearching: false };
    case 'error':
      return state.isSearching ? { ...state, isSearching: false } : state;
    default:
      return state;
  }
}

export default function MobileMenu({
  isOpen,
  onClose,
  isAuthenticated,
  cartQuantity,
  onLogout,
}: MobileMenuProps) {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [{ results, isSearching }, dispatchSearch] = useReducer(searchReducer, INITIAL_SEARCH_STATE);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      dispatchSearch({ type: 'reset' });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    const fetchResults = async () => {
      if (debouncedQuery.trim().length < 2) {
        if (active) {
          dispatchSearch({ type: 'reset' });
        }
        return;
      }

      if (active) dispatchSearch({ type: 'start' });
      try {
        const items = await searchProductsAction(debouncedQuery);
        if (active) {
          dispatchSearch({ type: 'success', results: items });
        }
      } catch (error) {
        console.error('Search error:', error);
        if (active) dispatchSearch({ type: 'error' });
      }
    };

    void fetchResults();

    return () => {
      active = false;
    };
  }, [debouncedQuery, isOpen]);

  const closeMenu = () => {
    setQuery('');
    dispatchSearch({ type: 'reset' });
    onClose();
  };

  const submitSearch = () => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    router.push(`/shop?q=${encodeURIComponent(normalizedQuery)}`);
    closeMenu();
  };

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitSearch();
  };

  if (!isOpen) return null;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeMenu();
      }}
    >
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-full max-w-xs border-r border-white/10 bg-[rgba(6,10,18,0.95)] p-0 text-white backdrop-blur-xl"
      >
        <SheetTitle className="sr-only">Mobile navigation menu</SheetTitle>

        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-panel-border px-6 py-4">
            <span className="font-mono text-sm font-bold uppercase tracking-widest">Menu</span>
            <button
              type="button"
              onClick={closeMenu}
              className="rounded-full p-2 transition-colors hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSearchSubmit} className="mb-6">
              <label htmlFor="mobile-menu-search" className="sr-only">
                Search products
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-panel-muted" aria-hidden="true" />
                <input
                  id="mobile-menu-search"
                  type="text"
                  placeholder="Search products..."
                  aria-label="Search products"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-xl border border-panel-ring bg-panel-input py-3 pl-10 pr-4 text-sm text-white placeholder:text-panel-muted focus:border-sky/50 focus:outline-none focus:ring-1 focus:ring-sky/50"
                />
                {isSearching ? (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-panel-muted" />
                ) : null}
              </div>
            </form>

            {query.trim().length >= 2 ? (
              <div className="mb-6 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-panel-muted">Results</div>
                {results.length > 0 ? (
                  <div className="grid gap-2">
                    {results.slice(0, 5).map((result) => (
                      <Link
                        key={result.id}
                        href={`/shop/product/${result.slug}`}
                        onClick={closeMenu}
                        className="flex items-center gap-3 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10"
                      >
                        <div className="relative h-10 w-10 overflow-hidden rounded bg-white">
                          {result.image ? (
                            <Image
                              src={result.image}
                              alt={result.name}
                              fill
                              className="object-contain p-1"
                              sizes="40px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-ink-muted">
                              <Search className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-white">{result.name}</div>
                          {result.iconId ? <div className="text-xs text-panel-muted">{result.iconId}</div> : null}
                        </div>
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={submitSearch}
                      className="w-full text-center text-xs font-medium text-sky-400 transition-colors hover:text-sky-300"
                    >
                      View all results
                    </button>
                  </div>
                ) : !isSearching ? (
                  <div className="text-sm text-panel-muted">No products found.</div>
                ) : null}
                <div className="my-4 h-px bg-white/10" />
              </div>
            ) : null}

            <nav className="space-y-6">
              <div className="flex flex-col gap-1">
                <MobileLink
                  href="/configurator"
                  label="Configurator"
                  highlight
                  onClick={closeMenu}
                  icon={<span className="flex h-5 w-5 items-center justify-center rounded bg-sky-500/20 text-[10px] font-bold text-sky-400">C</span>}
                />
                <MobileLink
                  href="/cart"
                  label={`Cart (${cartQuantity})`}
                  onClick={closeMenu}
                  icon={<ShoppingBag className="h-4 w-4" />}
                  prefetch={false}
                />
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-panel-muted">Shop</div>
                <div className="flex flex-col gap-1">
                  <MobileLink href="/shop" label="Shop Home" onClick={closeMenu} />
                  <MobileLink href="/shop?section=button-inserts" label="Button Inserts" onClick={closeMenu} />
                  <MobileLink href="/shop?section=keypads" label="Keypads" onClick={closeMenu} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-panel-muted">Account</div>
                <div className="flex flex-col gap-1">
                  {isAuthenticated ? (
                    <>
                      <MobileLink href="/account" icon={<User className="h-4 w-4" />} label="My Profile" onClick={closeMenu} />
                      <button
                        type="button"
                        onClick={() => {
                          onLogout();
                          closeMenu();
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-white/5"
                      >
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <MobileLink href="/login" icon={<User className="h-4 w-4" />} label="Sign In" onClick={closeMenu} />
                  )}
                </div>
              </div>
            </nav>
          </div>

          <div className="border-t border-panel-border p-6">
            <div className="text-xs text-panel-muted">&copy; 2026 Vehicle Control Technologies</div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileLink({
  href,
  label,
  icon,
  highlight,
  prefetch,
  onClick,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
  highlight?: boolean;
  prefetch?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={onClick}
      className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${highlight
        ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20'
        : 'text-white/80 hover:bg-white/5 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-white/30 transition group-hover:translate-x-1 group-hover:text-white/60" />
    </Link>
  );
}
