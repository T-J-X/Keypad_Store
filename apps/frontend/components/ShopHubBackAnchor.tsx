'use client';

import { useEffect } from 'react';
import { ensureShopHubAnchor, SHOP_HUB_HREF } from '../lib/shopHistory';

export default function ShopHubBackAnchor({
  enabled = true,
  hubHref = SHOP_HUB_HREF,
}: {
  enabled?: boolean;
  hubHref?: string;
}) {
  useEffect(() => {
    if (!enabled) return;
    const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    ensureShopHubAnchor(currentHref, hubHref);
  }, [enabled, hubHref]);

  return null;
}
