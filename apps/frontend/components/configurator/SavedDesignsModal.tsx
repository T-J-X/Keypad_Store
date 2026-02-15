'use client';

import { use, useEffect, useState } from 'react';
import { X, Search } from 'lucide-react';
import AccessibleModal from '../ui/AccessibleModal';
import { KeypadContext } from './KeypadProvider';
import type { SavedConfigurationItem } from './types';

function formatDate(isoString: string) {
    try {
        return new Date(isoString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return isoString;
    }
}

export default function SavedDesignsModal() {
    const context = use(KeypadContext);
    if (!context) return null;

    const { state, actions } = context;
    const { savedDesigns, savedDesignsModalOpen, savedDesignsLoading, savedDesignsError } = state;
    const { closeSavedDesignsModal } = actions;

    const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');
    const [searchQuery, setSearchQuery] = useState('');

    // Reset state on open
    useEffect(() => {
        if (savedDesignsModalOpen) {
            setSearchQuery('');
            setActiveTab('current');
        }
    }, [savedDesignsModalOpen]);

    const filteredDesigns = savedDesigns.filter((item) => {
        // Tab filter
        if (activeTab === 'current' && item.keypadModel !== state.modelCode) {
            return false;
        }
        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return (
                item.name.toLowerCase().includes(query) ||
                item.keypadModel.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const handleLoadDesign = (design: SavedConfigurationItem) => {
        // If same model, just load it via URL param or hydration
        if (design.keypadModel === state.modelCode) {
            // We can reload the page with ?load=ID
            // Or we can assume KeypadProvider might handle hydration if we just set it?
            // Actually KeypadProvider hydration logic relies on ?load=ID param or cart line.
            // So navigation is the safest and most consistent way.
            window.location.assign(
                `/configurator/keypad/${encodeURIComponent(context.meta.keypad.slug)}?load=${encodeURIComponent(design.id)}`
            );
        } else {
            // Find the slug for this model? We don't have a map of model->slug here easily.
            // But we can try to guess or just warn.
            // Actually, saved designs usually store the product slug or we might need to fetch it.
            // The SavedConfigurationItem type doesn't have slug.
            // For now, let's assume we can navigate to the configurator root or we need to know the slug.
            // Wait, if it's a different model, we might not know the URL.
            // Let's rely on the user to know, or maybe we can't fully support cross-model loading without slug.
            // BUT, the user said "links to that page".
            // Let's assume standard path: /configurator/keypad/<MODEL-CODE>?load=... (if model code works as slug, usually it does or satisfies the route).
            // Actually `[slug]` is usually the product slug (e.g. `pkp-2200-si`).
            // Let's try to lower-case the model code as a best-effort slug.
            const slug = design.keypadModel.toLowerCase();
            window.location.assign(`/configurator/keypad/${slug}?load=${encodeURIComponent(design.id)}`);
        }
    };

    const overlayClass = state.isMobile
        ? 'fixed inset-0 z-[80] flex items-end bg-[#020a18]/74 px-0 py-0 backdrop-blur-[2px]'
        : 'fixed inset-0 z-[80] flex items-center justify-center bg-[#020a18]/74 px-4 py-6 backdrop-blur-[2px]';

    // Using similar styling to IconPickerModal
    const panelClass = state.isMobile
        ? 'h-[74vh] w-full overflow-hidden rounded-t-3xl border border-panel-border border-b-0 bg-panel shadow-[0_-20px_80px_rgba(2,8,24,0.55)]'
        : 'h-[70vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-panel-border bg-panel shadow-[0_30px_80px_rgba(2,8,24,0.55)]';

    const tabButtonClass =
        'inline-flex min-h-9 px-4 items-center justify-center rounded-full border text-[11px] font-semibold uppercase tracking-[0.12em] transition';

    return (
        <AccessibleModal
            open={savedDesignsModalOpen}
            onClose={closeSavedDesignsModal}
            backdropClassName={overlayClass}
            panelClassName={`${panelClass} flex flex-col`}
        >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/12 px-5 py-4 sm:px-6">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-panel-muted">My Account</div>
                    <h3 className="mt-1 text-lg font-semibold text-white">Saved Designs</h3>
                </div>
                <button
                    type="button"
                    onClick={closeSavedDesignsModal}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/50 hover:bg-white/10"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Controls */}
            <div className="shrink-0 border-b border-white/5 bg-panel/95 px-5 py-4 backdrop-blur-xl sm:px-6 space-y-4">
                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('current')}
                        className={`${tabButtonClass} ${activeTab === 'current'
                                ? 'border-panel-accent bg-panel-light text-white shadow-[0_0_0_1px_rgba(30,167,255,0.25)]'
                                : 'border-white/10 bg-white/5 text-panel-muted hover:border-white/30 hover:bg-white/10'
                            }`}
                    >
                        Current Model
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`${tabButtonClass} ${activeTab === 'all'
                                ? 'border-panel-accent bg-panel-light text-white shadow-[0_0_0_1px_rgba(30,167,255,0.25)]'
                                : 'border-white/10 bg-white/5 text-panel-muted hover:border-white/30 hover:bg-white/10'
                            }`}
                    >
                        All Designs
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-panel-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your designs..."
                        className="input input-dark h-10 rounded-full pl-10"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                {savedDesignsLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-panel-muted">
                        Loading designs...
                    </div>
                ) : savedDesignsError ? (
                    <div className="flex h-full items-center justify-center text-sm text-rose-400">
                        {savedDesignsError}
                    </div>
                ) : filteredDesigns.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-panel-muted">
                        <p className="text-sm">No saved designs found.</p>
                        {activeTab === 'current' && (
                            <button
                                onClick={() => setActiveTab('all')}
                                className="text-xs text-sky hover:underline"
                            >
                                View all designs
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {filteredDesigns.map((design) => {
                            const isCurrentModel = design.keypadModel === state.modelCode;
                            return (
                                <button
                                    key={design.id}
                                    onClick={() => handleLoadDesign(design)}
                                    className="group relative flex flex-col items-start gap-1 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/30 hover:bg-white/10"
                                >
                                    <div className="flex w-full items-center justify-between gap-2">
                                        <span className="font-semibold text-white group-hover:text-sky transition-colors">{design.name}</span>
                                        {isCurrentModel && (
                                            <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/70">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-panel-muted">
                                        {design.keypadModel} • {formatDate(design.updatedAt)}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </AccessibleModal>
    );
}
