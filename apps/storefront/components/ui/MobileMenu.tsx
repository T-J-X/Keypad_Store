'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Search, ChevronRight, ShoppingBag, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    isAuthenticated: boolean;
    onLogout: () => void;
    onOpenSearch: () => void;
}

export default function MobileMenu({
    isOpen,
    onClose,
    isAuthenticated,
    onLogout,
    onOpenSearch
}: MobileMenuProps) {
    const pathname = usePathname();
    const [isRendered, setIsRendered] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsRendered(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Close menu when route changes
    useEffect(() => {
        onClose();
    }, [pathname, onClose]);

    if (!isRendered) return null;

    return (
        <div className="fixed inset-0 z-[90] lg:hidden" aria-modal="true" role="dialog">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`absolute inset-y-0 right-0 w-full max-w-xs bg-panel text-white shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
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
                        <button
                            onClick={() => { onOpenSearch(); onClose(); }}
                            className="mb-8 flex w-full items-center gap-3 rounded-xl border border-panel-ring bg-panel-input px-4 py-3 text-left text-sm text-panel-muted transition-colors hover:border-panel-muted/50"
                        >
                            <Search className="h-4 w-4" />
                            <span>Search products...</span>
                        </button>

                        <nav className="space-y-6">
                            <div className="space-y-3">
                                <div className="text-xs font-semibold uppercase tracking-wider text-panel-muted">Shop</div>
                                <div className="flex flex-col gap-1">
                                    <MobileLink href="/shop" icon={<ShoppingBag className="h-4 w-4" />} label="Shop Home" />
                                    <MobileLink href="/shop?section=button-inserts" label="Button Inserts" />
                                    <MobileLink href="/shop?section=keypads" label="Keypads" />
                                    <MobileLink href="/configurator" label="Configurator" highlight />
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
                            &copy; 2026 Keypad Co.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MobileLink({ href, label, icon, highlight }: { href: string; label: string; icon?: React.ReactNode; highlight?: boolean }) {
    return (
        <Link
            href={href}
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
