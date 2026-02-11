'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import ConfiguredKeypadThumbnail from '../../components/configurator/ConfiguredKeypadThumbnail';
import { notifyCartUpdated } from '../../lib/cartEvents';
import {
  buildConfiguredIconLookupFromPayload,
  countConfiguredSlots,
  emptyPreviewConfiguration,
  parseConfigurationForPreview,
  type ConfiguredIconLookup,
} from '../../lib/configuredKeypadPreview';
import { assetUrl } from '../../lib/vendure';

type ShippingMethodQuote = {
  id: string;
  code: string;
  name: string;
  description: string;
  priceWithTax: number;
};

type PaymentMethodQuote = {
  id: string;
  code: string;
  name: string;
  description: string;
  isEligible: boolean;
  eligibilityMessage: string | null;
};

type CheckoutOrder = {
  id: string;
  code: string;
  state: string | null;
  currencyCode: string;
  totalQuantity: number;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  lines: Array<{
    id: string;
    quantity: number;
    linePriceWithTax: number;
    customFields?: {
      configuration?: string | null;
    } | null;
    productVariant?: {
      id: string;
      name: string;
      currencyCode: string;
      product?: {
        id: string;
        slug: string | null;
        name: string | null;
        featuredAsset?: {
          preview: string | null;
          source: string | null;
        } | null;
      } | null;
    } | null;
  }>;
};

type CheckoutSessionPayload = {
  order?: CheckoutOrder | null;
  shippingMethods?: ShippingMethodQuote[];
  paymentMethods?: PaymentMethodQuote[];
  error?: string;
};

type IconCatalogPayload = {
  icons?: Array<{
    iconId: string;
    name?: string;
    matteAssetPath: string | null;
    categories: string[];
  }>;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodQuote[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodQuote[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iconLookup, setIconLookup] = useState<ConfiguredIconLookup>(new Map());

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetLine1, setStreetLine1] = useState('');
  const [streetLine2, setStreetLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [countryCode, setCountryCode] = useState('US');

  const [shippingMethodId, setShippingMethodId] = useState('');
  const [paymentMethodCode, setPaymentMethodCode] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/checkout/session', {
          method: 'GET',
          cache: 'no-store',
        });

        const payload = (await response.json().catch(() => ({}))) as CheckoutSessionPayload;
        if (!response.ok) {
          throw new Error(payload.error || 'Could not load your checkout session.');
        }

        if (cancelled) return;

        const nextOrder = payload.order ?? null;
        const nextShippingMethods = payload.shippingMethods ?? [];
        const nextPaymentMethods = payload.paymentMethods ?? [];

        setOrder(nextOrder);
        setShippingMethods(nextShippingMethods);
        setPaymentMethods(nextPaymentMethods);

        if (nextShippingMethods.length > 0) {
          setShippingMethodId((current) =>
            current && nextShippingMethods.some((method) => method.id === current)
              ? current
              : nextShippingMethods[0].id,
          );
        }

        if (nextPaymentMethods.length > 0) {
          setPaymentMethodCode((current) =>
            current && nextPaymentMethods.some((method) => method.code === current)
              ? current
              : nextPaymentMethods[0].code,
          );
        }
      } catch (nextError) {
        if (!cancelled) {
          const message = nextError instanceof Error ? nextError.message : 'Could not load your checkout session.';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadIconCatalog = async () => {
      try {
        const response = await fetch('/api/configurator/icon-catalog', {
          method: 'GET',
          cache: 'no-store',
        });

        const payload = (await response.json().catch(() => ({}))) as IconCatalogPayload;
        if (!response.ok) return;

        if (!cancelled) {
          const icons = payload.icons ?? [];
          setIconLookup(buildConfiguredIconLookupFromPayload(icons));
        }
      } catch {
        // Keep empty map and render graceful placeholders.
      }
    };

    void loadIconCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    if (!order) {
      return {
        subTotal: formatMinor(0, 'USD'),
        shipping: formatMinor(0, 'USD'),
        total: formatMinor(0, 'USD'),
      };
    }

    const selectedShipping = shippingMethods.find((method) => method.id === shippingMethodId);
    const shippingMinor = selectedShipping ? selectedShipping.priceWithTax : order.shippingWithTax;
    const totalMinor = order.subTotalWithTax + shippingMinor;

    return {
      subTotal: formatMinor(order.subTotalWithTax, order.currencyCode),
      shipping: formatMinor(shippingMinor, order.currencyCode),
      total: formatMinor(totalMinor, order.currencyCode),
    };
  }, [order, shippingMethodId, shippingMethods]);

  const canSubmit = Boolean(
    order
      && shippingMethodId
      && paymentMethodCode
      && email.trim()
      && firstName.trim()
      && lastName.trim()
      && streetLine1.trim()
      && city.trim()
      && postalCode.trim()
      && countryCode.trim(),
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!order?.code) {
      setError('No active order found. Please add items before checkout.');
      return;
    }

    if (!canSubmit) {
      setError('Please complete all required checkout fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          emailAddress: email,
          firstName,
          lastName,
          phoneNumber,
          streetLine1,
          streetLine2,
          city,
          province,
          postalCode,
          countryCode,
          shippingMethodId,
          paymentMethodCode,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        orderCode?: string;
        paymentMethodCode?: string;
        error?: string;
      };

      if (!response.ok || payload.ok !== true || !payload.orderCode) {
        throw new Error(payload.error || 'Checkout could not be completed.');
      }

      notifyCartUpdated();
      router.push(`/order/${encodeURIComponent(payload.orderCode)}?payment=${encodeURIComponent(payload.paymentMethodCode || paymentMethodCode)}`);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Checkout could not be completed.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">Checkout</h1>
          <p className="mt-1 text-sm text-ink/60">Enter shipping and payment details to confirm your order.</p>
        </div>
        <Link
          href="/cart"
          className="inline-flex items-center justify-center rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
        >
          Back to cart
        </Link>
      </div>

      {isLoading ? (
        <div className="card-soft p-6 text-sm text-ink/60">Loading checkout...</div>
      ) : null}

      {!isLoading && error ? (
        <div className="card-soft border border-rose-200 p-6 text-sm font-medium text-rose-700">{error}</div>
      ) : null}

      {!isLoading && !error && !order ? (
        <div className="card-soft p-8 text-center">
          <p className="text-base font-semibold text-ink">Your cart is empty.</p>
          <p className="mt-2 text-sm text-ink/60">Add items before starting checkout.</p>
          <div className="mt-5">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Browse products
            </Link>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && order ? (
        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="card-soft space-y-6 p-5">
            {order.lines.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold text-ink">Configured line items</h2>
                <div className="mt-3 space-y-3">
                  {order.lines.map((line) => {
                    const configurationRaw = line.customFields?.configuration ?? null;
                    const hasConfiguration = typeof configurationRaw === 'string' && configurationRaw.trim().length > 0;
                    const previewConfiguration = hasConfiguration
                      ? parseConfigurationForPreview(configurationRaw)
                      : null;
                    const configuredSlots = countConfiguredSlots(previewConfiguration);
                    const imagePath = line.productVariant?.product?.featuredAsset?.preview
                      || line.productVariant?.product?.featuredAsset?.source
                      || '';
                    const imageSrc = imagePath ? assetUrl(imagePath) : '';

                    return (
                      <article key={line.id} className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-white/75 p-3">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                          {hasConfiguration ? (
                            <ConfiguredKeypadThumbnail
                              shellAssetPath={imagePath || null}
                              configuration={previewConfiguration ?? emptyPreviewConfiguration()}
                              iconLookup={iconLookup}
                              size="sm"
                            />
                          ) : imageSrc ? (
                            <Image
                              src={imageSrc}
                              alt={line.productVariant?.name || 'Product image'}
                              fill
                              className="object-contain p-2"
                              sizes="80px"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-ink">
                            {line.productVariant?.name || line.productVariant?.product?.name || 'Product'}
                          </div>
                          {hasConfiguration ? (
                            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#1e3a66]">
                              Custom configuration: {configuredSlots}/4 slots defined
                            </div>
                          ) : null}
                          <div className="mt-1 text-xs text-ink/60">Qty {line.quantity}</div>
                        </div>
                        <div className="text-right text-xs font-semibold text-ink">
                          {formatMinor(line.linePriceWithTax, line.productVariant?.currencyCode || order.currencyCode)}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <h2 className="text-lg font-semibold text-ink">Contact</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="input"
                    placeholder="you@company.com"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">First name</span>
                  <input type="text" value={firstName} onChange={(event) => setFirstName(event.target.value)} required className="input" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Last name</span>
                  <input type="text" value={lastName} onChange={(event) => setLastName(event.target.value)} required className="input" />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Phone (optional)</span>
                  <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="input" />
                </label>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-ink">Shipping address</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Address line 1</span>
                  <input type="text" value={streetLine1} onChange={(event) => setStreetLine1(event.target.value)} required className="input" />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Address line 2 (optional)</span>
                  <input type="text" value={streetLine2} onChange={(event) => setStreetLine2(event.target.value)} className="input" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">City</span>
                  <input type="text" value={city} onChange={(event) => setCity(event.target.value)} required className="input" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Province/State</span>
                  <input type="text" value={province} onChange={(event) => setProvince(event.target.value)} className="input" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Postal code</span>
                  <input type="text" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} required className="input" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Country</span>
                  <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="input" required>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                  </select>
                </label>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-ink">Shipping method</h2>
              <div className="mt-3 grid gap-2">
                {shippingMethods.length > 0 ? (
                  shippingMethods.map((method) => (
                    <label key={method.id} className="inline-flex items-start gap-2 rounded-xl border border-ink/12 px-3 py-2 text-sm">
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method.id}
                        checked={shippingMethodId === method.id}
                        onChange={() => setShippingMethodId(method.id)}
                        required
                      />
                      <span>
                        <span className="block font-semibold text-ink">{method.name}</span>
                        <span className="block text-xs text-ink/60">{method.description || method.code}</span>
                        <span className="block text-xs font-semibold text-ink/70">{formatMinor(method.priceWithTax, order.currencyCode)}</span>
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    No eligible shipping methods available for this order yet.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-ink">Payment</h2>
              <div className="mt-3 grid gap-2">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <label key={method.code} className="inline-flex items-start gap-2 rounded-xl border border-ink/12 px-3 py-2 text-sm">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.code}
                        checked={paymentMethodCode === method.code}
                        onChange={() => setPaymentMethodCode(method.code)}
                        required
                      />
                      <span>
                        <span className="block font-semibold text-ink">{method.name}</span>
                        <span className="block text-xs text-ink/60">{method.description || method.code}</span>
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    No eligible payment methods available for this order.
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="card-soft h-fit p-5">
            <h2 className="text-base font-semibold text-ink">Order summary</h2>
            <div className="mt-1 text-xs text-ink/55">Order code: {order.code}</div>
            <div className="mt-4 space-y-2 text-sm text-ink/75">
              <div className="flex items-center justify-between">
                <span>Items ({order.totalQuantity})</span>
                <span>{totals.subTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>{totals.shipping}</span>
              </div>
            </div>
            <div className="my-4 h-px bg-ink/10" />
            <div className="flex items-center justify-between text-base font-semibold text-ink">
              <span>Total</span>
              <span>{totals.total}</span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Placing order...' : 'Place order'}
            </button>
          </aside>
        </form>
      ) : null}
    </div>
  );
}

function formatMinor(minor: number | null | undefined, currencyCode: string) {
  const value = typeof minor === 'number' && Number.isFinite(minor) ? minor : 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 2,
    }).format(value / 100);
  } catch {
    return `${(value / 100).toFixed(2)} ${currencyCode || 'USD'}`;
  }
}
