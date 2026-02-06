'use client';

import { useState } from 'react';

const tabs = [
  { id: 'orders', label: 'Orders' },
  { id: 'saved', label: 'Saved Configurations' }
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function AccountTabs() {
  const [active, setActive] = useState<TabId>('orders');

  return (
    <div className="card p-6">
      <div className="flex flex-wrap gap-2 border-b border-black/5 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active === tab.id
                ? 'bg-ink text-white'
                : 'border border-ink/10 text-ink/60 hover:border-ink/25'
            }`}
            onClick={() => setActive(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {active === 'orders' ? (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-ink">Recent orders</div>
            <div className="card-soft flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Order #000124</span>
                <span className="text-ink/50">Processing</span>
              </div>
              <div className="text-xs text-ink/60">Custom 5x3 keypad - 15 icons</div>
            </div>
            <div className="card-soft flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Order #000118</span>
                <span className="text-ink/50">Delivered</span>
              </div>
              <div className="text-xs text-ink/60">2x2 keypad starter kit</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-ink">Saved configurations</div>
            <div className="card-soft p-4 text-xs text-ink/60">
              No saved configurations yet. Build a keypad in the configurator to save your layout.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
