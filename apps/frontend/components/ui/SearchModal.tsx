'use client';

import { Search, X, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

import { searchProductsAction, type SearchResultItem } from '../../app/actions/search';

function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebounced(value);
        }, delayMs);
        return () => clearTimeout(handler);
    }, [value, delayMs]);
    return debounced;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const debouncedQuery = useDebouncedValue(query, 300);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setQuery('');
            setResults([]);
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    useEffect(() => {
        let active = true;

        const fetchResults = async () => {
            if (debouncedQuery.trim().length < 2) {
                if (active) setResults([]);
                return;
            }

            if (active) setIsLoading(true);
            try {
                const items = await searchProductsAction(debouncedQuery);
                if (active) {
                    setResults(items);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                if (active) setIsLoading(false);
            }
        };

        void fetchResults();

        return () => {
            active = false;
        };
    }, [debouncedQuery]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
        onClose();
    };

    const handleResultClick = (slug: string) => {
        router.push(`/shop/product/${slug}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-4 sm:pt-24">
            {/* Backdrop */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                className="absolute inset-0 bg-ink/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-2xl animate-scale-in overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
                role="dialog"
                aria-modal="true"
            >
                <form onSubmit={handleSubmit} className="relative flex items-center border-b border-surface-border p-4">
                    <Search className="h-5 w-5 text-ink-muted" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent px-4 py-2 text-lg text-ink placeholder:text-ink-muted focus:outline-none"
                        placeholder="Search products, IDs, or categories..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-ink-muted hover:bg-surface-alt hover:text-ink"
                    >
                        <span className="sr-only">Close</span>
                        <X className="h-5 w-5" />
                    </button>
                </form>

                <div className="bg-surface-alt/50 px-4 py-3 text-xs font-medium text-ink-muted">
                    <div className="flex items-center justify-between">
                        <span>{results.length > 0 ? 'Search Results' : 'Recent Searches'}</span>
                        <span className="hidden sm:inline-block">Press ↵ to search all</span>
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
                                    onClick={() => handleResultClick(result.slug)}
                                    className="group flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-surface-alt"
                                >
                                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-surface-border bg-white">
                                        {result.image ? (
                                            <Image
                                                src={result.image}
                                                alt={result.name}
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
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-sm font-semibold text-ink">{result.name}</span>
                                            {result.iconId && (
                                                <span className="rounded bg-surface-border px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                                                    {result.iconId}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-ink-muted">
                                            Product Code: {result.slug}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                                </button>
                            ))}
                            <button
                                onClick={handleSubmit}
                                className="mt-2 flex w-full items-center justify-center rounded-xl border border-dashed border-surface-border py-3 text-sm font-medium text-ink-muted transition-colors hover:border-ink/20 hover:bg-surface-alt hover:text-ink"
                            >
                                View all results for "{query}"
                            </button>
                        </div>
                    ) : (
                        // Empty State / Default Options
                        <div className="space-y-1">
                            {!query && (
                                <>
                                    <button
                                        onClick={() => { router.push('/shop?section=keypads'); onClose(); }}
                                        className="group flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-surface-alt"
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
                                        onClick={() => { router.push('/shop?section=button-inserts'); onClose(); }}
                                        className="group flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-surface-alt"
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
                            )}
                            {query && !isLoading && (
                                <div className="py-8 text-center">
                                    <p className="text-sm text-ink-muted">No products found for "{query}"</p>
                                    <button
                                        onClick={handleSubmit}
                                        className="mt-2 text-xs font-medium text-sky-500 hover:text-sky-600 hover:underline"
                                    >
                                        Try a broader search
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
