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

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyStaticState = () => {
      parallaxElement.style.setProperty('--footer-parallax-y', '0px');
      parallaxElement.style.setProperty('--footer-parallax-scale', '1');
      parallaxElement.style.setProperty('--footer-glow-opacity', '0.18');
    };

    if (reduceMotionQuery.matches) {
      applyStaticState();
      return;
    }

    let frameId: number | null = null;
    let footerIsNearby = false;

    const observer = new IntersectionObserver(
      (entries) => {
        footerIsNearby = entries.some((entry) => entry.isIntersecting);
        if (footerIsNearby) requestTick();
      },
      {
        rootMargin: '260px 0px 260px 0px',
      },
    );
    observer.observe(footerElement);

    const updateParallax = () => {
      frameId = null;
      if (!footerIsNearby) return;

      const rect = footerElement.getBoundingClientRect();
      const footerHeight = Math.max(rect.height, 1);
      const viewportHeight = window.innerHeight || 1;
      const rawProgress = clamp((viewportHeight - rect.top) / (viewportHeight + footerHeight), 0, 1);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
      const startOffsetPx = Math.min(footerHeight * 0.18, 52);
      const y = -startOffsetPx * (1 - easedProgress);
      const scale = 0.972 + easedProgress * 0.028;
      const glowOpacity = 0.14 + easedProgress * 0.34;

      parallaxElement.style.setProperty('--footer-parallax-y', `${y.toFixed(2)}px`);
      parallaxElement.style.setProperty('--footer-parallax-scale', scale.toFixed(3));
      parallaxElement.style.setProperty('--footer-glow-opacity', glowOpacity.toFixed(3));
    };

    const requestTick = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateParallax);
    };

    requestTick();
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', requestTick);
      window.removeEventListener('resize', requestTick);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [footerId, parallaxId]);

  return null;
}
