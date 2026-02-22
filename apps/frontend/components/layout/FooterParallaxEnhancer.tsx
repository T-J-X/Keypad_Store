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
    const mobileViewportQuery = window.matchMedia('(max-width: 1023px)');
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const applyStaticState = () => {
      parallaxElement.style.setProperty('--footer-parallax-y', '0px');
      parallaxElement.style.setProperty('--footer-parallax-scale', '1');
      parallaxElement.style.setProperty('--footer-glow-opacity', '0.18');
    };

    const shouldDisableParallax = () =>
      reduceMotionQuery.matches || mobileViewportQuery.matches || coarsePointerQuery.matches;

    let frameId: number | null = null;
    let footerIsNearby = false;
    let parallaxEnabled = !shouldDisableParallax();

    const observer = new IntersectionObserver(
      (entries) => {
        footerIsNearby = entries.some((entry) => entry.isIntersecting);
        if (footerIsNearby && parallaxEnabled) requestTick();
      },
      {
        rootMargin: '260px 0px 260px 0px',
      },
    );
    observer.observe(footerElement);

    const updateParallax = () => {
      frameId = null;
      if (!footerIsNearby || !parallaxEnabled) return;

      const rect = footerElement.getBoundingClientRect();
      const footerHeight = Math.max(rect.height, 1);
      const viewportHeight = window.innerHeight || 1;
      const rawProgress = clamp((viewportHeight - rect.top) / (viewportHeight + footerHeight), 0, 1);
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
      const startOffsetPx = Math.min(footerHeight * 0.15, 44);
      const y = -startOffsetPx * (1 - easedProgress);
      const scale = 0.982 + easedProgress * 0.018;
      const glowOpacity = 0.14 + easedProgress * 0.34;

      parallaxElement.style.setProperty('--footer-parallax-y', `${y.toFixed(2)}px`);
      parallaxElement.style.setProperty('--footer-parallax-scale', scale.toFixed(3));
      parallaxElement.style.setProperty('--footer-glow-opacity', glowOpacity.toFixed(3));
    };

    const requestTick = () => {
      if (!parallaxEnabled) return;
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateParallax);
    };

    const syncParallaxMode = () => {
      parallaxEnabled = !shouldDisableParallax();
      if (!parallaxEnabled) {
        applyStaticState();
        return;
      }
      requestTick();
    };

    syncParallaxMode();
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);
    reduceMotionQuery.addEventListener('change', syncParallaxMode);
    mobileViewportQuery.addEventListener('change', syncParallaxMode);
    coarsePointerQuery.addEventListener('change', syncParallaxMode);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', requestTick);
      window.removeEventListener('resize', requestTick);
      reduceMotionQuery.removeEventListener('change', syncParallaxMode);
      mobileViewportQuery.removeEventListener('change', syncParallaxMode);
      coarsePointerQuery.removeEventListener('change', syncParallaxMode);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [footerId, parallaxId]);

  return null;
}
