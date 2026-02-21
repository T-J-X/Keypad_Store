import { Suspense } from 'react';
import type { Metadata } from 'next';
import { fetchCheckoutSession } from '../../lib/vendure.server';
import { fetchIconCatalog } from '../../lib/configurator.server';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout | Vehicle Control Technologies',
  description: 'Complete your secure checkout process.',
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutFetcher />
    </Suspense>
  );
}

async function CheckoutFetcher() {
  const [session, iconCatalog] = await Promise.all([
    fetchCheckoutSession(),
    fetchIconCatalog(),
  ]);
  const iconLookupPayload = iconCatalog.map((icon) => ({
    iconId: icon.iconId,
    name: icon.name,
    matteAssetPath: icon.matteAssetPath,
    categories: icon.categories,
  }));

  return (
    <CheckoutClient
      initialOrder={session.order}
      initialShippingMethods={session.shippingMethods}
      initialPaymentMethods={session.paymentMethods}
      iconCatalog={iconLookupPayload}
    />
  );
}

function CheckoutLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-panel-muted text-sm">Loading checkout...</div>
    </div>
  );
}
