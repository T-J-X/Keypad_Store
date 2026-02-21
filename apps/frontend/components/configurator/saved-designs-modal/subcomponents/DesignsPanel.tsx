import { Search } from 'lucide-react';
import type { SavedConfigurationItem } from '../../types';

type DesignsPanelProps = {
  activeTab: 'current' | 'all';
  searchQuery: string;
  savedDesignsLoading: boolean;
  savedDesignsError: string | null;
  filteredDesigns: SavedConfigurationItem[];
  currentModelCode: string;
  onSetActiveTab: (tab: 'current' | 'all') => void;
  onSearchQueryChange: (value: string) => void;
  onLoadDesign: (design: SavedConfigurationItem) => void;
};

const tabButtonClass =
  'inline-flex min-h-9 px-4 items-center justify-center rounded-full border text-[11px] font-semibold uppercase tracking-[0.12em] transition';

export default function DesignsPanel({
  activeTab,
  searchQuery,
  savedDesignsLoading,
  savedDesignsError,
  filteredDesigns,
  currentModelCode,
  onSetActiveTab,
  onSearchQueryChange,
  onLoadDesign,
}: DesignsPanelProps) {
  return (
    <>
      <div className="shrink-0 border-b border-white/5 bg-panel/95 px-5 py-4 backdrop-blur-xl sm:px-6 space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSetActiveTab('current')}
            className={`${tabButtonClass} ${activeTab === 'current'
              ? 'border-panel-accent bg-panel-light text-white shadow-[0_0_0_1px_rgba(30,167,255,0.25)]'
              : 'border-white/10 bg-white/5 text-panel-muted hover:border-white/30 hover:bg-white/10'
              }`}
          >
            Current Model
          </button>
          <button
            type="button"
            onClick={() => onSetActiveTab('all')}
            className={`${tabButtonClass} ${activeTab === 'all'
              ? 'border-panel-accent bg-panel-light text-white shadow-[0_0_0_1px_rgba(30,167,255,0.25)]'
              : 'border-white/10 bg-white/5 text-panel-muted hover:border-white/30 hover:bg-white/10'
              }`}
          >
            All Designs
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-panel-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search your designs..."
            className="input input-dark h-10 rounded-full pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        {savedDesignsLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-panel-muted">
            Loading designs…
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
                type="button"
                onClick={() => onSetActiveTab('all')}
                className="text-xs text-sky hover:underline"
              >
                View all designs
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredDesigns.map((design) => {
              const isCurrentModel = design.keypadModel === currentModelCode;
              return (
                <button
                  key={design.id}
                  type="button"
                  onClick={() => onLoadDesign(design)}
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
    </>
  );
}

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
