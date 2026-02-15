'use client';

import { Search, X, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
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

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-4 sm:pt-24">
            {/* Backdrop */}
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
                        <span>Recent Searches</span>
                        <span className="hidden sm:inline-block">Press ↵ to search</span>
                    </div>
                </div>

                {/* Empty State / Suggestions (Static for now) */}
                {!query && (
                    <div className="p-2">
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
                    </div>
                )}
            </div>
        </div>
    );
}
