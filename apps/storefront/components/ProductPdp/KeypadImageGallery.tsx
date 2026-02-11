'use client';

import { useMemo, useRef, useState, type PointerEvent } from 'react';
import MagnifyImageBox from './MagnifyImageBox';

type GalleryImage = {
  id: string;
  src: string;
  alt: string;
};

const SWIPE_THRESHOLD = 48;

export default function KeypadImageGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hasMultipleImages = images.length > 1;

  const safeImages = useMemo(() => {
    if (images.length > 0) return images;
    return [
      {
        id: 'fallback',
        src: '',
        alt: productName,
      },
    ];
  }, [images, productName]);

  const activeImage = safeImages[activeIndex] ?? safeImages[0];

  const goToIndex = (nextIndex: number) => {
    if (!hasMultipleImages) return;
    const imageCount = safeImages.length;
    const wrappedIndex = (nextIndex + imageCount) % imageCount;
    setActiveIndex(wrappedIndex);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    touchStart.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || !hasMultipleImages) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const mostlyHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

    if (!mostlyHorizontal || Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaX < 0) goToIndex(activeIndex + 1);
    if (deltaX > 0) goToIndex(activeIndex - 1);
  };

  if (!activeImage?.src) {
    return <div className="text-xs font-semibold uppercase tracking-wide text-ink/40">Render pending</div>;
  }

  const controlsEnabled = hasMultipleImages;

  return (
    <div
      className="relative h-[520px] w-full touch-pan-y"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        touchStart.current = null;
      }}
    >
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-3xl bg-white">
        <div className="h-full w-full p-6 md:p-8">
          <MagnifyImageBox src={activeImage.src} alt={activeImage.alt} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => goToIndex(activeIndex - 1)}
        disabled={!controlsEnabled}
        className="absolute left-[-18px] top-1/2 z-20 -translate-y-1/2 p-1 text-slate-900/80 transition hover:text-slate-950 disabled:cursor-default disabled:text-slate-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-label="Previous image"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/92 shadow-[0_12px_28px_rgba(12,17,26,0.24)] ring-1 ring-black/10 backdrop-blur transition-transform duration-200 hover:scale-[1.03]">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path d="M14.5 6.5L9 12l5.5 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <button
        type="button"
        onClick={() => goToIndex(activeIndex + 1)}
        disabled={!controlsEnabled}
        className="absolute right-[-18px] top-1/2 z-20 -translate-y-1/2 p-1 text-slate-900/80 transition hover:text-slate-950 disabled:cursor-default disabled:text-slate-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-label="Next image"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/92 shadow-[0_12px_28px_rgba(12,17,26,0.24)] ring-1 ring-black/10 backdrop-blur transition-transform duration-200 hover:scale-[1.03]">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
            <path d="M9.5 6.5L15 12l-5.5 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-[-18px] z-20 flex justify-center px-4">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 ring-1 ring-black/10 shadow-[0_8px_24px_rgba(12,17,26,0.16)] backdrop-blur">
          {safeImages.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => goToIndex(index)}
                aria-label={`View image ${index + 1}`}
                aria-pressed={isActive}
                className={isActive
                  ? 'h-2.5 w-2.5 rounded-full bg-slate-900 shadow-[0_0_0_1px_rgba(15,23,42,0.25)]'
                  : 'h-2.5 w-2.5 rounded-full bg-slate-500/45 transition hover:bg-slate-700/65'}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
