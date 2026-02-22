'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { resolveHeroConfigureHint } from '../../config/heroSliderCopy';
import { Button } from '../ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type SlideProduct = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  priceWithTax: number;
  currencyCode: string;
  thumbnail: string;
};

interface HeroSliderProps {
  products: SlideProduct[];
}

function formatPrice(minorUnits: number, currencyCode: string) {
  if (!minorUnits) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 2,
    }).format(minorUnits / 100);
  } catch {
    return null;
  }
}

export function HeroSlider({ products }: HeroSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(products.length > 1);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(products.length > 1);
  const hasMultipleProducts = products.length > 1;

  const updateScrollButtons = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    setCanScrollPrev(track.scrollLeft > 6);
    setCanScrollNext(track.scrollLeft < maxLeft - 6);
  }, []);

  useEffect(() => {
    if (!hasMultipleProducts) {
      setShowSwipeHint(false);
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    setShowSwipeHint(true);
    const timeoutId = window.setTimeout(() => setShowSwipeHint(false), 4600);
    return () => window.clearTimeout(timeoutId);
  }, [hasMultipleProducts, products.length]);

  useEffect(() => {
    updateScrollButtons();
    const track = trackRef.current;
    if (!track) return;

    track.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      track.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [products.length, updateScrollButtons]);

  const scrollTrack = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    const nextStep = Math.max(Math.round(track.clientWidth * 0.78), 300);
    track.scrollBy({ left: direction * nextStep, behavior: 'smooth' });
    setShowSwipeHint(false);
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <div className="relative mx-auto w-full max-w-[1400px]">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-2 z-40 flex -translate-x-1/2 justify-center transition-all duration-500 md:hidden ${
          showSwipeHint ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        }`}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/35 bg-[#081327]/85 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-100 shadow-[0_8px_22px_rgba(2,8,20,0.5)] backdrop-blur-md">
          <ChevronLeft className="h-3.5 w-3.5 animate-pulse" />
          <span>Use side-scroll or swipe</span>
          <ChevronRight className="h-3.5 w-3.5 animate-pulse" />
        </div>
      </div>

      <div className="group/slider relative">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-4"
          onPointerDown={() => setShowSwipeHint(false)}
          onTouchStart={() => setShowSwipeHint(false)}
          onWheel={() => setShowSwipeHint(false)}
        >
          {products.map((product) => {
            const priceLabel = formatPrice(product.priceWithTax, product.currencyCode);
            const productHref = `/configurator/keypad/${product.slug}`;

            return (
              <article
                key={product.id}
                className="w-[86%] shrink-0 snap-start sm:w-[58%] lg:w-[42%] xl:w-[34%]"
              >
                <div className="group/card relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B1221] shadow-[0_14px_34px_-18px_rgba(0,0,0,0.65)] transition-[border-color,box-shadow] duration-300 hover:border-sky-500/40 hover:shadow-[0_24px_46px_-24px_rgba(56,189,248,0.44)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/card:from-sky-500/10 group-hover/card:opacity-100" />

                  <Link
                    href={productHref}
                    className="relative z-10 flex aspect-[4/3] w-full items-center justify-center border-b border-white/5 bg-gradient-to-b from-[#0e1628] to-[#0a111e] p-6"
                  >
                    {product.thumbnail ? (
                      <div className="relative h-full w-full transition-transform duration-700 ease-out group-hover/card:scale-[1.06]">
                        <Image
                          src={product.thumbnail}
                          alt={product.name}
                          fill
                          className="object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
                          sizes="(max-width: 640px) 86vw, (max-width: 1024px) 58vw, 34vw"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <Sparkles className="h-5 w-5 text-white/25" />
                      </div>
                    )}
                  </Link>

                  <div className="relative z-10 space-y-3 bg-[#0B1221] p-6">
                    <h3 className="line-clamp-1 text-xl font-bold tracking-tight text-white">
                      <Link href={productHref} className="transition-colors hover:text-sky-200">
                        {product.name}
                      </Link>
                    </h3>
                    {product.description ? (
                      <p className="line-clamp-2 text-sm leading-relaxed text-white/55">{product.description}</p>
                    ) : null}

                    <div className="flex items-end justify-between gap-3 pt-2">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Starting from</p>
                        <p className="text-base font-semibold text-white">{priceLabel ?? 'Custom quote'}</p>
                      </div>

                      <HoverCard openDelay={180} closeDelay={120}>
                        <HoverCardTrigger asChild>
                          <Button
                            asChild
                            variant="premium"
                            size="sm"
                            className="h-10 rounded-full px-4 text-[11px] uppercase tracking-[0.11em]"
                          >
                            <Link href={productHref}>Configure</Link>
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="top"
                          align="end"
                          className="w-64 border-sky-300/25 bg-[#081327]/95 text-sky-50 shadow-[0_14px_34px_-20px_rgba(2,8,20,0.85)] backdrop-blur-xl"
                        >
                          <p className="text-xs leading-relaxed text-sky-100/85">
                            {resolveHeroConfigureHint(product.slug || product.name)}
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-16 bg-gradient-to-r from-[#081327] to-transparent md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-16 bg-gradient-to-l from-[#081327] to-transparent md:block" />

        {hasMultipleProducts ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => scrollTrack(-1)}
                  disabled={!canScrollPrev}
                  className="absolute left-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0b1221]/85 text-white shadow-xl opacity-0 transition-[opacity,transform,border-color,background-color] duration-300 group-hover/slider:opacity-100 hover:border-sky-500/50 hover:bg-[#101c35] disabled:pointer-events-none disabled:opacity-30 md:flex"
                  aria-label="Scroll to previous models"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="border-sky-300/25 bg-[#081327] text-sky-50">
                Previous model
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => scrollTrack(1)}
                  disabled={!canScrollNext}
                  className="absolute right-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0b1221]/85 text-white shadow-xl opacity-0 transition-[opacity,transform,border-color,background-color] duration-300 group-hover/slider:opacity-100 hover:border-sky-500/50 hover:bg-[#101c35] disabled:pointer-events-none disabled:opacity-30 md:flex"
                  aria-label="Scroll to next models"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="border-sky-300/25 bg-[#081327] text-sky-50">
                Next model
              </TooltipContent>
            </Tooltip>
          </>
        ) : null}
      </div>
    </div>
  );
}
