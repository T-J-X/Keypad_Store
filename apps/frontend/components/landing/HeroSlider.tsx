'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, ChevronLeft } from 'lucide-react';

// Using a simplified type to accept whatever we pass from the server component
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

export function HeroSlider({ products }: HeroSliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showSwipeHint, setShowSwipeHint] = useState(products.length > 1);

    const dismissSwipeHint = useCallback(() => {
        setShowSwipeHint((previous) => (previous ? false : previous));
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        dismissSwipeHint();
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = current.clientWidth * 0.8; // Scroll 80% of container width
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        setShowSwipeHint(products.length > 1);
    }, [products.length]);

    useEffect(() => {
        const slider = scrollRef.current;
        if (!slider || !showSwipeHint) return;

        const timeoutId = window.setTimeout(() => {
            dismissSwipeHint();
        }, 5000);

        const onPointerDown = () => dismissSwipeHint();
        const onTouchStart = () => dismissSwipeHint();
        const onWheel = () => dismissSwipeHint();
        const onScroll = () => {
            if (slider.scrollLeft > 8) {
                dismissSwipeHint();
            }
        };

        slider.addEventListener('pointerdown', onPointerDown, { passive: true });
        slider.addEventListener('touchstart', onTouchStart, { passive: true });
        slider.addEventListener('wheel', onWheel, { passive: true });
        slider.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.clearTimeout(timeoutId);
            slider.removeEventListener('pointerdown', onPointerDown);
            slider.removeEventListener('touchstart', onTouchStart);
            slider.removeEventListener('wheel', onWheel);
            slider.removeEventListener('scroll', onScroll);
        };
    }, [dismissSwipeHint, showSwipeHint]);

    if (!products || products.length === 0) return null;

    return (
        <div className="relative w-full max-w-[1400px] mx-auto group">
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute left-1/2 top-3 z-30 flex -translate-x-1/2 justify-center transition-all duration-500 md:hidden ${
                    showSwipeHint ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
                }`}
            >
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/35 bg-[#081327]/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-100 shadow-[0_8px_22px_rgba(2,8,20,0.5)] backdrop-blur-md">
                    <ChevronLeft className="h-3.5 w-3.5 animate-pulse" />
                    <span>Swipe to browse</span>
                    <ChevronRight className="h-3.5 w-3.5 animate-pulse" />
                </div>
            </div>

            {/* Navigation Buttons (Hidden on mobile, appear on hover for desktop) */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-[#0B1221]/80 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/10 hover:border-sky-500/50 shadow-xl hidden md:flex"
                aria-label="Scroll left"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={() => scroll('right')}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-[#0B1221]/80 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/10 hover:border-sky-500/50 shadow-xl hidden md:flex"
                aria-label="Scroll right"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Slider Track */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-6 snap-x snap-mandatory pb-8 pt-4 custom-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
                {/* Visual padding block to center items on edges slightly better */}
                <div className="min-w-[5vw] shrink-0" />

                {products.map((product) => (
                    <div
                        key={product.id}
                        className="snap-center shrink-0 w-[280px] sm:w-[320px] md:w-[380px] group/card perspective-1000"
                    >
                        <Link
                            href={`/configurator/keypad/${product.slug}`}
                            className="block relative h-full rounded-2xl bg-[#0B1221] border border-white/10 overflow-hidden transform-gpu transition-all duration-500 hover:-translate-y-2 hover:border-sky-500/40 hover:shadow-[0_20px_40px_-10px_rgba(56,189,248,0.2)]"
                        >
                            {/* Ambient glow inside card on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 via-transparent to-transparent opacity-0 group-hover/card:from-sky-500/10 group-hover/card:opacity-100 transition-opacity duration-500 z-0" />

                            {/* Product Image */}
                            <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-[#0e1628] to-[#0a111e] p-6 flex flex-col items-center justify-center border-b border-white/5 z-10">
                                {product.thumbnail ? (
                                    <div className="relative w-full h-full transition-transform duration-700 ease-out group-hover/card:scale-110">
                                        <Image
                                            src={product.thumbnail}
                                            alt={product.name}
                                            fill
                                            className="object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
                                            sizes="(max-width: 768px) 280px, 380px"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                                        <div className="w-6 h-6 text-white/20">...</div>
                                    </div>
                                )}
                            </div>

                            {/* Text Content */}
                            <div className="p-6 relative z-10 bg-[#0B1221]">
                                <h3 className="text-xl font-bold text-white tracking-tight line-clamp-1">{product.name}</h3>
                                {product.description && (
                                    <p className="mt-2 text-sm text-white/50 line-clamp-2 md:line-clamp-3 leading-relaxed">
                                        {product.description}
                                    </p>
                                )}
                                <div className="mt-6 flex items-center justify-end">
                                    <span className="btn-premium inline-flex min-h-0 items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
                                        Configure Layout
                                        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/card:translate-x-0.5" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}

                {/* Visual padding block for Right edge */}
                <div className="min-w-[5vw] shrink-0" />
            </div>
        </div>
    );
}
