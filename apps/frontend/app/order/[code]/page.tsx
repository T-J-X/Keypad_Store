import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, use } from 'react';
import { toStringParam } from '@keypad-store/shared-utils/search-params';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { buildPageMetadata } from '../../../lib/seo/metadata';

const OrderTechnicalSpecification = dynamic(() => import('../../../components/order/OrderTechnicalSpecification'), {
  loading: () => (
    <span className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#0e2e60]/30 bg-[#0d2f63]/15 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-[#0e2e60] whitespace-nowrap">
      Loading specification…
    </span>
  ),
});

type OrderSearchParams = {
  payment?: string | string[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const resolved = await params;
  const orderCode = decodeURIComponent(resolved.code || '').trim();

  return buildPageMetadata({
    title: orderCode ? `Order ${orderCode}` : 'Order Confirmation',
    description: 'Order confirmation and technical specification access.',
    canonical: orderCode ? `/order/${encodeURIComponent(orderCode)}` : '/order',
    noIndex: true,
  });
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
    <div className="mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
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
          <Button asChild variant="default" className="w-full min-w-[12rem] sm:w-auto">
            <Link href="/account">View account</Link>
          </Button>
          <Button asChild variant="outline" className="w-full min-w-[12rem] sm:w-auto">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrderConfirmationSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <div className="card-soft space-y-4 p-8 sm:p-10">
        <Skeleton className="h-5 w-28 rounded bg-gray-200" />
        <Skeleton className="h-8 w-3/4 rounded bg-gray-200" />
        <Skeleton className="h-4 w-2/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}
