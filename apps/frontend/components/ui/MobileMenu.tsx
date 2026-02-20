'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { X, Search, ChevronRight, ShoppingBag, User, Loader2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { searchProductsAction, type SearchResultItem } from '../../app/actions/search';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    isAuthenticated: boolean;
    cartQuantity: number;
    onLogout: () => void;
    onOpenSearch: () => void; // Kept for API compatibility, but unused
}

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

export default function MobileMenu({
    isOpen,
    onClose,
    isAuthenticated,
    cartQuantity,
    onLogout,
}: MobileMenuProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedQuery = useDebouncedValue(query, 300);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            });
            document.body.style.overflow = 'hidden';
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => {
                setIsRendered(false);
                document.body.style.overflow = '';
                setQuery(''); // Reset search on close
                setResults([]);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Close menu when route changes
    useEffect(() => {
        if (isOpen) onClose();
    }, [pathname]);

    // Search Effect - using Server Action
    useEffect(() => {
        let active = true;

        const fetchResults = async () => {
            if (debouncedQuery.trim().length < 2) {
                if (active) setResults([]);
                return;
            }

            if (active) setIsSearching(true);
            try {
                const items = await searchProductsAction(debouncedQuery);
                if (active) {
                    setResults(items);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                if (active) setIsSearching(false);
            }
        };

        void fetchResults();

        return () => {
            active = false;
        };
    }, [debouncedQuery]);

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
        onClose();
    };

    if (!mounted || !isRendered) return null;

    return createPortal(
        <div className="fixed inset-0 z-[150]" aria-modal="true" role="dialog">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Drawer - Slide from LEFT */}
            <div
                className={`absolute inset-y-0 left-0 w-full max-w-xs border-r border-white/10 bg-[rgba(6,10,18,0.95)] backdrop-blur-xl text-white shadow-2xl transition-transform duration-300 ease-out ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-panel-border px-6 py-4">
                        <span className="font-mono text-sm font-bold tracking-widest uppercase">Menu</span>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 hover:bg-white/10"
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-panel-muted" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full rounded-xl border border-panel-ring bg-panel-input py-3 pl-10 pr-4 text-sm text-white placeholder:text-panel-muted focus:border-sky/50 focus:outline-none focus:ring-1 focus:ring-sky/50"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-panel-muted" />
                                )}
                            </div>
                        </form>

                        {/* Search Results (Inline) */}
                        {query.trim().length >= 2 && (
                            <div className="mb-6 space-y-2">
                                <div className="text-xs font-semibold uppercase tracking-wider text-panel-muted">Results</div>
                                {results.length > 0 ? (
                                    <div className="grid gap-2">
                                        {results.slice(0, 5).map((result) => (
                                            <Link
                                                key={result.id}
                                                href={`/shop/product/${result.slug}`}
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
                                                    {result.iconId && <div className="text-xs text-panel-muted">{result.iconId}</div>}
                                                </div>
                                            </Link>
                                        ))}
                                        <button
                                            onClick={handleSearchSubmit}
                                            className="w-full text-center text-xs font-medium text-sky-400 hover:text-sky-300"
                                        >
                                            View all results
                                        </button>
                                    </div>
                                ) : (
                                    !isSearching && <div className="text-sm text-panel-muted">No products found.</div>
                                )}
                                <div className="my-4 h-px bg-white/10" />
                            </div>
                        )}


                        <nav className="space-y-6">
                            {/* Top Level: Configurator & Cart */}
                            <div className="flex flex-col gap-1">
                                <MobileLink
                                    href="/configurator"
                                    label="Configurator"
                                    highlight
                                    icon={<span className="flex h-5 w-5 items-center justify-center rounded bg-sky-500/20 text-[10px] font-bold text-sky-400">C</span>}
                                />
                                <MobileLink
                                    href="/cart"
                                    label={`Cart (${cartQuantity})`}
                                    icon={<ShoppingBag className="h-4 w-4" />}
                                    prefetch={false}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs font-semibold uppercase tracking-wider text-panel-muted">Shop</div>
                                <div className="flex flex-col gap-1">
                                    <MobileLink href="/shop" label="Shop Home" />
                                    <MobileLink href="/shop?section=button-inserts" label="Button Inserts" />
                                    <MobileLink href="/shop?section=keypads" label="Keypads" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs font-semibold uppercase tracking-wider text-panel-muted">Account</div>
                                <div className="flex flex-col gap-1">
                                    {isAuthenticated ? (
                                        <>
                                            <MobileLink href="/account" icon={<User className="h-4 w-4" />} label="My Profile" />
                                            <button
                                                onClick={onLogout}
                                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-white/5"
                                            >
                                                <span>Sign Out</span>
                                            </button>
                                        </>
                                    ) : (
                                        <MobileLink href="/login" icon={<User className="h-4 w-4" />} label="Sign In" />
                                    )}
                                </div>
                            </div>
                        </nav>
                    </div>

                    <div className="border-t border-panel-border p-6">
                        <div className="text-xs text-panel-muted">
                            &copy; 2026 Vehicle Control Technologies
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function MobileLink({ href, label, icon, highlight, prefetch }: { href: string; label: string; icon?: React.ReactNode; highlight?: boolean; prefetch?: boolean }) {
    return (
        <Link
            href={href}
            prefetch={prefetch}
            className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${highlight
                ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20'
                : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span>{label}</span>
            </div>
            {!highlight && <ChevronRight className="h-4 w-4 text-panel-muted opacity-0 transition-opacity group-hover:opacity-100" />}
        </Link>
    );
}
