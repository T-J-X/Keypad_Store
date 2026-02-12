'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useMemo, useState } from 'react';

export type PdpTabId = 'overview' | 'specs' | 'in-the-box' | 'faq' | 'downloads';

export type PdpTabPanel = {
  id: PdpTabId;
  label: string;
  content: ReactNode;
};

export default function PdpTabs({
  panels,
  defaultTabId,
}: {
  panels: PdpTabPanel[];
  defaultTabId?: PdpTabId;
}) {
  const tabSetId = useId().replace(/:/g, '');
  const panelIds = useMemo(() => panels.map((panel) => panel.id), [panels]);
  const initialTabId =
    defaultTabId && panelIds.includes(defaultTabId)
      ? defaultTabId
      : (panels[0]?.id ?? 'overview');
  const [activeTabId, setActiveTabId] = useState<PdpTabId>(initialTabId);
  const joinedPanelIds = panelIds.join('|');

  useEffect(() => {
    if (panelIds.length === 0) return;
    if (!panelIds.includes(activeTabId)) {
      setActiveTabId(initialTabId);
    }
  }, [activeTabId, initialTabId, joinedPanelIds, panelIds]);

  const activePanel = panels.find((panel) => panel.id === activeTabId) ?? panels[0];

  if (!activePanel) return null;

  return (
    <div className="space-y-10">
      <nav
        aria-label="Product detail sections"
        role="tablist"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-1 border-b border-surface-border pb-2"
      >
        {panels.map((panel) => {
          const isActive = panel.id === activeTabId;
          const tabId = `pdp-tab-${tabSetId}-${panel.id}`;
          const panelId = `pdp-tabpanel-${tabSetId}-${panel.id}`;
          return (
            <button
              key={panel.id}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              onClick={() => setActiveTabId(panel.id)}
              onPointerUp={(event) => {
                if (event.pointerType === 'touch') {
                  setActiveTabId(panel.id);
                }
              }}
              className={
                isActive
                  ? 'touch-manipulation select-none rounded-full border border-ink bg-ink px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white'
                  : 'touch-manipulation select-none rounded-full border border-transparent px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-ink/55 transition hover:border-surface-border hover:bg-surface hover:text-ink'
              }
            >
              {panel.label}
            </button>
          );
        })}
      </nav>

      <div
        id={`pdp-tabpanel-${tabSetId}-${activePanel.id}`}
        role="tabpanel"
        aria-labelledby={`pdp-tab-${tabSetId}-${activePanel.id}`}
        className="pt-8"
      >
        {activePanel.content}
      </div>
    </div>
  );
}
