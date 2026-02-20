import { Suspense } from 'react';
import type { Metadata } from 'next';
import CartClient from '../../components/CartClient';
import { fetchActiveOrder } from '../../lib/vendure.server';

export const metadata: Metadata = {
  title: 'Your Cart | Vehicle Control Technologies',
  description: 'Review and edit your keypad configurations before checkout.',
};

export default function CartPage() {
  return (
    <Suspense fallback={<CartLoading />}>
      <CartFetcher />
    </Suspense>
  );
}

import { fetchIconCatalog } from '../../lib/configurator.server';

async function CartFetcher() {
  const [order, icons] = await Promise.all([
    fetchActiveOrder(),
    fetchIconCatalog(),
  ]);
  return <CartClient order={order} iconCatalog={icons} />;
}

function CartLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="card-panel p-5 sm:p-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="h-10 w-32 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-white/5" />
          </div>
        </div>
        <div className="card-panel bg-panel-light p-6 text-sm text-panel-muted">
          Loading your cart…
        </div>
      </div>
    </div>
  );
}
