import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense, use } from 'react';
import OrderTechnicalSpecification from '../../../components/order/OrderTechnicalSpecification';

type OrderSearchParams = {
  payment?: string | string[];
};

function toStringParam(value?: string | string[]) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return '';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const orderCode = decodeURIComponent(resolved.code || '').trim();

  return {
    title: orderCode ? `Order ${orderCode} | Keypad Store` : 'Order Confirmation | Keypad Store',
    description: 'Order confirmation and technical specification access.',
    alternates: {
      canonical: orderCode ? `/order/${encodeURIComponent(orderCode)}` : '/order',
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams?: Promise<OrderSearchParams>;
}) {
  return (
    <Suspense fallback={<OrderConfirmationSkeleton />}>
      <OrderConfirmationContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function OrderConfirmationContent({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams?: Promise<OrderSearchParams>;
}) {
  const [resolvedParams, resolvedSearch] = use(Promise.all([
    params,
    searchParams ?? Promise.resolve({} as OrderSearchParams),
  ]));

  const orderCode = decodeURIComponent(resolvedParams.code || '').trim();
  const paymentMethod = toStringParam(resolvedSearch.payment) || 'card';

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <div className="card-soft p-8 sm:p-10">
        <div className="pill">Order confirmed</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Thank you for your order</h1>
        <p className="mt-3 text-sm text-ink/65">
          Your keypad order has been received. We will email updates as production and shipping progress.
        </p>

        <div className="mt-6 grid gap-3 rounded-2xl border border-ink/10 bg-white/70 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink/60">Order code</span>
            <span className="font-semibold text-ink">{orderCode || 'Unavailable'}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink/60">Payment method</span>
            <span className="font-semibold capitalize text-ink">{paymentMethod}</span>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          {orderCode ? <OrderTechnicalSpecification orderCode={orderCode} /> : null}
          <Link
            href="/account"
            className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            View account
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

function OrderConfirmationSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <div className="card-soft animate-pulse space-y-4 p-8 sm:p-10">
        <div className="h-5 w-28 rounded bg-gray-200" />
        <div className="h-8 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}
