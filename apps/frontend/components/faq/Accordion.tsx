'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

export type AccordionItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

export default function Accordion({
  items,
}: {
  items: AccordionItem[];
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <section key={item.id} className="rounded-2xl border border-ink/10 bg-white">
            <h3>
              <button
                type="button"
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${item.id}`}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-ink md:text-base">{item.question}</span>
                <span className="text-xl leading-none text-ink/55">{isOpen ? '-' : '+'}</span>
              </button>
            </h3>
            {isOpen && (
              <div id={`faq-panel-${item.id}`} className="border-t border-ink/10 px-5 py-4 text-sm leading-6 text-ink/70">
                {item.answer}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
