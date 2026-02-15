'use client';

import Image from 'next/image';
import { useRef, useState, type MouseEvent } from 'react';

const ZOOM_SCALE = 2.6;
const LENS_SIZE = 180;
const LENS_RADIUS = LENS_SIZE / 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function MagnifyImageBox({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [lensStyle, setLensStyle] = useState({
    left: 0,
    top: 0,
    backgroundSize: '0px 0px',
    backgroundPosition: '0px 0px',
  });

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);

    const baseWidth = naturalSize.width || rect.width;
    const baseHeight = naturalSize.height || rect.height;
    const scale = Math.min(rect.width / baseWidth, rect.height / baseHeight);
    const renderedWidth = baseWidth * scale;
    const renderedHeight = baseHeight * scale;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;

    const isInsideRenderedImage =
      x >= offsetX
      && x <= offsetX + renderedWidth
      && y >= offsetY
      && y <= offsetY + renderedHeight;

    if (!isInsideRenderedImage) {
      setActive(false);
      return;
    }

    const ratioX = clamp((x - offsetX) / renderedWidth, 0, 1);
    const ratioY = clamp((y - offsetY) / renderedHeight, 0, 1);
    const zoomedWidth = renderedWidth * ZOOM_SCALE;
    const zoomedHeight = renderedHeight * ZOOM_SCALE;
    const bgX = LENS_RADIUS - ratioX * zoomedWidth;
    const bgY = LENS_RADIUS - ratioY * zoomedHeight;

    setLensStyle({
      left: x,
      top: y,
      backgroundSize: `${zoomedWidth}px ${zoomedHeight}px`,
      backgroundPosition: `${bgX}px ${bgY}px`,
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={onMouseMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-contain drop-shadow-[0_5px_12px_rgba(41,69,122,0.30)]"
        draggable={false}
        onLoad={(event) => {
          const target = event.currentTarget as HTMLImageElement;
          setNaturalSize({
            width: target.naturalWidth || 0,
            height: target.naturalHeight || 0,
          });
        }}
      />

      <div className={active ? 'pointer-events-none absolute inset-0 block' : 'pointer-events-none absolute inset-0 hidden'}>
        <div
          className="absolute h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border border-white/80 ring-1 ring-black/12 shadow-[0_16px_36px_rgba(12,17,26,0.25)]"
          style={{
            left: `${lensStyle.left}px`,
            top: `${lensStyle.top}px`,
          }}
        >
          <div
            className="h-full w-full bg-white/20"
            style={{
              backgroundImage: `url("${src}")`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: lensStyle.backgroundSize,
              backgroundPosition: lensStyle.backgroundPosition,
            }}
          />
        </div>
      </div>
    </div>
  );
}
