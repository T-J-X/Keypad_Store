import Link from 'next/link';
import { Gauge, Menu, ShoppingCart } from 'lucide-react';

export interface StitchHeaderProps {
  readonly cartCount: number;
}

export default function StitchHeader({ cartCount }: Readonly<StitchHeaderProps>) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(7,12,28,0.85)] px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Keypad Store home">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--stitch-primary)] shadow-[0_0_20px_rgba(77,77,255,0.45)]">
            <Gauge className="size-4 text-white" />
          </div>
          <span className="text-sm font-bold uppercase italic tracking-tight text-white sm:text-base">
            Keypad<span className="text-[var(--stitch-primary)]">Store</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/cart" className="relative rounded-full p-2 text-slate-100 transition-colors hover:bg-white/10" aria-label="Open cart">
            <ShoppingCart className="size-4" />
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full border border-[var(--stitch-bg)] bg-[var(--stitch-primary)] text-[10px] font-bold text-white">
              {cartCount}
            </span>
          </Link>
          <button type="button" className="rounded-full p-2 text-slate-100 transition-colors hover:bg-white/10" aria-label="Open menu">
            <Menu className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
