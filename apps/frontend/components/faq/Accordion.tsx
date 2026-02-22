'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  Accordion as AccordionPrimitive,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

type AccordionItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

export default function Accordion({
  items,
}: {
  items: AccordionItem[];
}) {
  const [openId, setOpenId] = useState<string>(items[0]?.id ?? '');

  return (
    <AccordionPrimitive
      type="single"
      collapsible
      value={openId}
      onValueChange={(nextValue) => setOpenId(nextValue)}
      className="space-y-3"
    >
      {items.map((item) => {
        return (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="rounded-2xl border border-ink/10 bg-white px-5"
          >
            <AccordionTrigger className="gap-4 py-4 text-left text-sm font-semibold text-ink no-underline hover:no-underline md:text-base [&>svg]:text-ink/55">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="border-t border-ink/10 px-0 py-4 text-sm leading-6 text-ink/70">
                {item.answer}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </AccordionPrimitive>
  );
}
