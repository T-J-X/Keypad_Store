'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import type { CookieConsent } from '../../lib/consent';

type AnalyticsComponents = {
  Analytics: ComponentType<Record<string, never>>;
  SpeedInsights: ComponentType<Record<string, never>>;
};

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') return false;
  return fallback;
}

export default function ConsentAwareAnalytics({ consent }: { consent: CookieConsent }) {
  const [components, setComponents] = useState<AnalyticsComponents | null>(null);

  const analyticsEnabled = useMemo(
    () => parseBoolean(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS, process.env.NODE_ENV === 'production'),
    [],
  );
  const requireConsent = useMemo(
    () => parseBoolean(process.env.NEXT_PUBLIC_ANALYTICS_REQUIRE_CONSENT, true),
    [],
  );

  const shouldLoad = analyticsEnabled && (!requireConsent || consent === 'accepted');

  useEffect(() => {
    if (!shouldLoad || components) return;

    let cancelled = false;

    void Promise.all([
      import('@vercel/analytics/react'),
      import('@vercel/speed-insights/next'),
    ]).then(([analyticsModule, speedInsightsModule]) => {
      if (cancelled) return;
      setComponents({
        Analytics: analyticsModule.Analytics,
        SpeedInsights: speedInsightsModule.SpeedInsights,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, components]);

  if (!shouldLoad || !components) return null;

  const { Analytics, SpeedInsights } = components;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
