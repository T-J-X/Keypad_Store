'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useEffect, useRef, useState } from 'react';
import HeaderSearch from './HeaderSearch';

export default function Header() {
  const HIDE_AFTER_SCROLL_Y = 440;
  const SHOW_AT_TOP_SCROLL_Y = 24;
  const MIN_SCROLL_DELTA = 4;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 8);

      if (currentY <= SHOW_AT_TOP_SCROLL_Y) {
        setIsHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      const delta = currentY - lastScrollY.current;
      if (Math.abs(delta) < MIN_SCROLL_DELTA) {
        lastScrollY.current = currentY;
        return;
      }

      if (delta > 0 && currentY > HIDE_AFTER_SCROLL_Y) {
        setIsHidden(true);
      } else if (delta < 0) {
        setIsHidden(false);
      }

      lastScrollY.current = currentY;
    };

    lastScrollY.current = window.scrollY;
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-black backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 ease-out will-change-transform ${
        isHidden ? '-translate-y-full' : 'translate-y-0'
      } ${
        isScrolled ? 'border-white/20 shadow-[0_8px_26px_rgba(0,0,0,0.36)]' : 'border-white/10'
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-6xl flex-col px-6 md:flex-row md:items-center md:justify-between ${
          isScrolled ? 'gap-2 py-2.5 md:py-2.5' : 'gap-4 py-4 md:py-4'
        } transition-all duration-300 ease-out`}
      >
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`font-semibold tracking-tight text-white transition-all duration-300 ease-out ${
              isScrolled ? 'text-base' : 'text-lg'
            }`}
          >
            Keypad Store
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-white/75 md:flex">
            <Link href="/shop" className="transition hover:text-white/90">Shop</Link>
            <Link href="/configurator" className="transition hover:text-white/90">Configurator</Link>
            <Link href="/account" className="transition hover:text-white/90">Account</Link>
          </nav>
        </div>
        <div
          className={`flex flex-col gap-3 md:flex-row md:items-center ${
            isScrolled ? 'md:gap-3' : 'md:gap-4'
          } transition-all duration-300 ease-out`}
        >
          <div className="md:hidden">
            <nav className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wide text-white/65">
              <Link href="/shop" className="transition hover:text-white/90">Shop</Link>
              <Link href="/configurator" className="transition hover:text-white/90">Configurator</Link>
              <Link href="/account" className="transition hover:text-white/90">Account</Link>
            </nav>
          </div>
          <Suspense fallback={<div className="h-10 w-full max-w-[360px]" aria-hidden />}>
            <HeaderSearch />
          </Suspense>
          <Link
            href="/login"
            className={`hidden rounded-full border border-white/35 px-4 text-sm font-semibold text-white transition-all duration-300 ease-out hover:border-white/55 hover:text-white/90 md:inline-flex ${
              isScrolled ? 'py-1.5' : 'py-2'
            }`}
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
