'use client';

import Link from 'next/link';
import { Compass, Home, Package2, UserRound } from 'lucide-react';
import type { StitchBottomNavItem } from '../../data/stitchMockData';

export interface StitchBottomNavProps {
  readonly items: readonly StitchBottomNavItem[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
}

function BottomNavIcon({ id }: { readonly id: string }) {
  if (id === 'shop') return <Compass className="size-4" />;
  if (id === 'orders') return <Package2 className="size-4" />;
  if (id === 'profile') return <UserRound className="size-4" />;
  return <Home className="size-4" />;
}

export default function StitchBottomNav({ items, activeId, onSelect }: Readonly<StitchBottomNavProps>) {
  return (
    <nav className="sticky bottom-0 z-40 border-t border-white/10 bg-[rgba(7,12,28,0.92)] px-4 py-2 pb-5 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onSelect(item.id)}
              className={[
                'flex min-w-[64px] flex-col items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] transition',
                isActive ? 'text-[var(--stitch-primary)]' : 'text-slate-500 hover:text-slate-200',
              ].join(' ')}
            >
              <BottomNavIcon id={item.id} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
