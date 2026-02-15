'use client';

import { useEffect, useState } from 'react';
import PremiumToast from './configurator/PremiumToast';
import { useUIStore } from '../lib/uiStore';

const TOAST_TIMEOUT_MS = 5500;

export default function GlobalToastViewport() {
  const toast = useUIStore((state) => state.toast);
  const hideToast = useUIStore((state) => state.hideToast);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsMobile(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!toast.visible) return;
    const timer = window.setTimeout(() => {
      hideToast();
    }, TOAST_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [hideToast, toast.visible, toast.message, toast.ctaHref, toast.ctaLabel]);

  if (!toast.visible) return null;

  return (
    <PremiumToast
      toast={toast}
      onClose={hideToast}
      offsetBottom={isMobile}
    />
  );
}
