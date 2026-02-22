'use client';

import { useEffect } from 'react';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function FooterParallaxEnhancer({
  footerId,
  parallaxId,
}: {
  footerId: string;
  parallaxId: string;
}) {
  useEffect(() => {
    const footerElement = document.getElementById(footerId);
    const parallaxElement = document.getElementById(parallaxId);
    if (!footerElement || !parallaxElement) return;

    let frameId: number | null = null;

    const updateParallax = () => {
      frameId = null;

      const rect = footerElement.getBoundingClientRect();
      const footerHeight = Math.max(rect.height, 1);
      const viewportHeight = window.innerHeight || 1;
      const progress = clamp((viewportHeight - rect.top) / footerHeight, 0, 1);
      const startOffsetPx = footerHeight * 0.25;
      const y = -startOffsetPx * (1 - progress);

      parallaxElement.style.transform = `translate3d(0, ${y}px, 0)`;
    };

    const requestTick = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateParallax);
    };

    requestTick();
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);

    return () => {
      window.removeEventListener('scroll', requestTick);
      window.removeEventListener('resize', requestTick);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [footerId, parallaxId]);

  return null;
}
