'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  getCookieConsent,
  type CookieConsent,
} from '../../lib/consent';

const CookieBanner = dynamic(() => import('../CookieBanner'), { ssr: false });
const GlobalToastViewport = dynamic(() => import('../GlobalToastViewport'), { ssr: false });
const ConsentAwareAnalytics = dynamic(() => import('../analytics/ConsentAwareAnalytics'), { ssr: false });

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') return false;
  return fallback;
}

function shouldRenderToast(pathname: string) {
  if (pathname.startsWith('/shop')) return true;
  if (pathname.startsWith('/configurator')) return true;
  if (pathname.startsWith('/cart')) return true;
  if (pathname.startsWith('/checkout')) return true;
  return false;
}

export default function ClientRuntimeGate() {
  const pathname = usePathname() ?? '/';
  const [consent, setConsent] = useState<CookieConsent>(null);

  const analyticsEnabled = useMemo(
    () => parseBoolean(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS, process.env.NODE_ENV === 'production'),
    [],
  );
  const requireConsent = useMemo(
    () => parseBoolean(process.env.NEXT_PUBLIC_ANALYTICS_REQUIRE_CONSENT, true),
    [],
  );

  useEffect(() => {
    setConsent(getCookieConsent());

    const onConsentChanged = () => {
      setConsent(getCookieConsent());
    };

    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentChanged as EventListener);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentChanged as EventListener);
    };
  }, []);

  const showCookieBanner = consent === null;
  const showToastViewport = shouldRenderToast(pathname);
  const shouldMountAnalyticsLoader = analyticsEnabled && (!requireConsent || consent === 'accepted');

  return (
    <>
      {showToastViewport ? <GlobalToastViewport /> : null}
      {showCookieBanner ? <CookieBanner /> : null}
      {shouldMountAnalyticsLoader ? <ConsentAwareAnalytics consent={consent} /> : null}
    </>
  );
}
