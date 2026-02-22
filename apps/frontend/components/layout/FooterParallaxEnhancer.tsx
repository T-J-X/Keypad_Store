'use client';

import { useEffect } from 'react';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

export default function FooterParallaxEnhancer({
  shellId,
  mainId,
  footerId,
  parallaxId,
}: {
  shellId: string;
  mainId: string;
  footerId: string;
  parallaxId: string;
}) {
  useEffect(() => {
    const shellElement = document.getElementById(shellId);
    const mainElement = document.getElementById(mainId);
    const footerElement = document.getElementById(footerId);
    const parallaxElement = document.getElementById(parallaxId);
    if (!shellElement || !mainElement || !footerElement || !parallaxElement) return;

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyRevealHeight = () => {
      const revealHeight = Math.ceil(Math.max(parallaxElement.getBoundingClientRect().height, 1));
      shellElement.style.setProperty('--footer-reveal-height', `${revealHeight}px`);
      return revealHeight;
    };
    const applyStaticState = () => {
      parallaxElement.style.setProperty('--footer-parallax-y', '0px');
      parallaxElement.style.setProperty('--footer-parallax-scale', '1');
      parallaxElement.style.setProperty('--footer-glow-opacity', '0.18');
    };

    let frameId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      applyRevealHeight();
      requestTick();
    });
    resizeObserver.observe(footerElement);

    const updateParallax = () => {
      frameId = null;
      const revealHeight = applyRevealHeight();
      if (reduceMotionQuery.matches) {
        applyStaticState();
        return;
      }

      const mainRect = mainElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const revealLeadPx = Math.min(viewportHeight * 0.28, 220);
      const rawProgress = clamp(
        (viewportHeight + revealLeadPx - mainRect.bottom) / (revealHeight + revealLeadPx),
        0,
        1,
      );
      const acceleratedProgress = Math.pow(rawProgress, 0.82);
      const easedProgress = smoothstep(acceleratedProgress);
      const startOffsetPx = Math.min(revealHeight * 0.22, 64);
      const y = -startOffsetPx * (1 - easedProgress);
      const scale = 0.968 + easedProgress * 0.032;
      const glowOpacity = 0.12 + easedProgress * 0.4;

      parallaxElement.style.setProperty('--footer-parallax-y', `${y.toFixed(2)}px`);
      parallaxElement.style.setProperty('--footer-parallax-scale', scale.toFixed(3));
      parallaxElement.style.setProperty('--footer-glow-opacity', glowOpacity.toFixed(3));
    };

    const requestTick = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateParallax);
    };

    const handleMotionPreferenceChange = () => {
      if (reduceMotionQuery.matches) {
        applyStaticState();
      }
      requestTick();
    };

    applyRevealHeight();
    requestTick();
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);
    reduceMotionQuery.addEventListener('change', handleMotionPreferenceChange);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', requestTick);
      window.removeEventListener('resize', requestTick);
      reduceMotionQuery.removeEventListener('change', handleMotionPreferenceChange);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [footerId, mainId, parallaxId, shellId]);

  return null;
}
