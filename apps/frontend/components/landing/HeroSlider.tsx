'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';
import { Progress } from '../ui/progress';
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
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(products.length);
  const [showSwipeHint, setShowSwipeHint] = useState(products.length > 1);

  useEffect(() => {
    if (!api) return;

    const update = () => {
      setCurrentIndex(api.selectedScrollSnap());
      setSlideCount(api.scrollSnapList().length);
      setShowSwipeHint(false);
    };

    setSlideCount(api.scrollSnapList().length);
    setCurrentIndex(api.selectedScrollSnap());

    api.on('select', update);
    api.on('reInit', update);
    return () => {
      api.off('select', update);
      api.off('reInit', update);
    };
  }, [api]);

  useEffect(() => {
    setShowSwipeHint(products.length > 1);
    const timeoutId = window.setTimeout(() => setShowSwipeHint(false), 4600);
    return () => window.clearTimeout(timeoutId);
  }, [products.length]);

  const progressValue = useMemo(() => {
    if (slideCount <= 1) return 100;
    return ((currentIndex + 1) / slideCount) * 100;
  }, [currentIndex, slideCount]);

  if (!products || products.length === 0) return null;

  return (
    <div className="relative mx-auto w-full max-w-[1400px]">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-2 z-40 flex -translate-x-1/2 justify-center transition-all duration-500 md:hidden ${showSwipeHint ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
          }`}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/35 bg-[#081327]/85 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-100 shadow-[0_8px_22px_rgba(2,8,20,0.5)] backdrop-blur-md">
          <ChevronLeft className="h-3.5 w-3.5 animate-pulse" />
          <span>Swipe to browse</span>
          <ChevronRight className="h-3.5 w-3.5 animate-pulse" />
        </div>
      </div>

      <Carousel
        setApi={setApi}
        opts={{ align: 'start', dragFree: false, skipSnaps: false }}
        className="group/carousel"
        onPointerDown={() => setShowSwipeHint(false)}
        onTouchStart={() => setShowSwipeHint(false)}
      >
        <CarouselContent className="pb-6">
          {products.map((product, index) => {
            const priceLabel = formatPrice(product.priceWithTax, product.currencyCode);

            return (
              <CarouselItem
                key={product.id}
                className="basis-[86%] sm:basis-[58%] lg:basis-[42%] xl:basis-[34%]"
                aria-label={`Slide ${index + 1} of ${products.length}`}
              >
                <div className="h-full p-1">
                  <Link
                    href={`/configurator/keypad/${product.slug}`}
                    className="group/card relative block h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B1221] shadow-[0_14px_34px_-18px_rgba(0,0,0,0.65)] transition-all duration-500 hover:-translate-y-1.5 hover:border-sky-500/40 hover:shadow-[0_28px_55px_-24px_rgba(56,189,248,0.38)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/card:from-sky-500/10 group-hover/card:opacity-100" />

                    <div className="relative z-10 flex aspect-[4/3] w-full items-center justify-center border-b border-white/5 bg-gradient-to-b from-[#0e1628] to-[#0a111e] p-6">
                      {product.thumbnail ? (
                        <div className="relative h-full w-full transition-transform duration-700 ease-out group-hover/card:scale-[1.08]">
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
                    </div>

                    <div className="relative z-10 space-y-3 bg-[#0B1221] p-6">
                      <h3 className="line-clamp-1 text-xl font-bold tracking-tight text-white">{product.name}</h3>
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
                              variant="premium"
                              size="sm"
                              className="h-10 rounded-full px-4 text-[11px] uppercase tracking-[0.11em]"
                            >
                              Configure
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="top"
                            align="end"
                            className="w-64 border-sky-300/25 bg-[#081327]/95 text-sky-50 shadow-[0_14px_34px_-20px_rgba(2,8,20,0.85)] backdrop-blur-xl"
                          >
                            <p className="text-xs leading-relaxed text-sky-100/85">
                              Map icons slot-by-slot, save your layout, then add directly to cart with production-ready data.
                            </p>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </div>
                  </Link>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-16 bg-gradient-to-r from-[#081327] to-transparent md:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-16 bg-gradient-to-l from-[#081327] to-transparent md:block" />

        <Tooltip>
          <TooltipTrigger asChild>
            <CarouselPrevious
              variant="secondaryDark"
              className="left-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 rounded-full border-white/20 bg-[#0b1221]/85 text-white shadow-xl transition-all duration-300 group-hover/carousel:opacity-100 hover:border-sky-500/50 hover:bg-[#101c35] md:flex"
            />
          </TooltipTrigger>
          <TooltipContent className="border-sky-300/25 bg-[#081327] text-sky-50">
            Previous model
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <CarouselNext
              variant="secondaryDark"
              className="right-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 rounded-full border-white/20 bg-[#0b1221]/85 text-white shadow-xl transition-all duration-300 group-hover/carousel:opacity-100 hover:border-sky-500/50 hover:bg-[#101c35] md:flex"
            />
          </TooltipTrigger>
          <TooltipContent className="border-sky-300/25 bg-[#081327] text-sky-50">
            Next model
          </TooltipContent>
        </Tooltip>
      </Carousel>

      <div className="mt-2 flex items-center gap-4 px-2 sm:px-4">
        <Progress
          value={progressValue}
          className="h-1.5 bg-white/15 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-sky-300 [&_[data-slot=progress-indicator]]:to-sky-500"
        />
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/55">
          {Math.min(currentIndex + 1, slideCount)} / {slideCount}
        </div>
      </div>
    </div>
  );
}
