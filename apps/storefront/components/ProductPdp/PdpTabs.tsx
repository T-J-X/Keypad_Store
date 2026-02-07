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
    <div className="space-y-12">
      <nav
        aria-label="Product detail sections"
        role="tablist"
        className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
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
                  ? 'w-full touch-manipulation select-none rounded-full bg-[linear-gradient(90deg,#040F2E_0%,#112B5D_55%,#29457A_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(5,15,46,0.28)]'
                  : 'w-full touch-manipulation select-none rounded-full bg-[#E0E0E0] px-4 py-2.5 text-sm font-semibold text-ink/85 shadow-[0_1px_2px_rgba(12,17,26,0.14)] transition hover:bg-[#112B5D] hover:text-white'
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
        className="border-t border-ink/10 pt-12"
      >
        {activePanel.content}
      </div>
    </div>
  );
}
