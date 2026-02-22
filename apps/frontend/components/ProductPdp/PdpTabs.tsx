'use client';

import type { ReactNode } from 'react';
import { useEffect, useId, useMemo, useState } from 'react';
import {
  Boxes,
  CircleHelp,
  Download,
  FileText,
  Info,
} from 'lucide-react';

export type PdpTabId = 'overview' | 'specs' | 'in-the-box' | 'faq' | 'downloads';

export type PdpTabPanel = {
  id: PdpTabId;
  label: string;
  content: ReactNode;
};

const TAB_ICON_BY_ID: Record<PdpTabId, typeof FileText> = {
  overview: Info,
  specs: FileText,
  'in-the-box': Boxes,
  faq: CircleHelp,
  downloads: Download,
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
        className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 motion-safe:animate-fade-up"
      >
        {panels.map((panel) => {
          const isActive = panel.id === activeTabId;
          const tabId = `pdp-tab-${tabSetId}-${panel.id}`;
          const panelId = `pdp-tabpanel-${tabSetId}-${panel.id}`;
          const Icon = TAB_ICON_BY_ID[panel.id] ?? FileText;
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
              className={`group w-full touch-manipulation select-none justify-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                isActive
                  ? 'nav-pill nav-pill-active'
                  : 'nav-pill nav-pill-default'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-[#071835] group-hover:text-white'
                }`}
                aria-hidden="true"
              />
              <span>{panel.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        key={activePanel.id}
        id={`pdp-tabpanel-${tabSetId}-${activePanel.id}`}
        role="tabpanel"
        aria-labelledby={`pdp-tab-${tabSetId}-${activePanel.id}`}
        className="pt-8 motion-safe:animate-fade-up"
      >
        {activePanel.content}
      </div>
    </div>
  );
}
