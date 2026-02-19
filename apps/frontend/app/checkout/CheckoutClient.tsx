'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useRef, useState } from 'react';
import ConfiguredKeypadThumbnail from '../../components/configurator/ConfiguredKeypadThumbnail';
import { notifyCartUpdated } from '../../lib/cartEvents';
import {
    buildConfiguredIconLookupFromPayload,
    countConfiguredSlots,
    emptyPreviewConfiguration,
    parseConfigurationForPreview,
    resolvePreviewSlotIds,
    type ConfiguredIconLookup,
} from '../../lib/configuredKeypadPreview';
import { resolvePkpModelCode } from '../../lib/keypadUtils';
import { assetUrl } from '../../lib/vendure';
import type { CheckoutOrder, ShippingMethodQuote, PaymentMethodQuote } from '../../lib/checkoutTypes';
import type { IconCatalogItem } from '../../lib/configuratorCatalog';

type CheckoutField = 'email' | 'firstName' | 'lastName' | 'streetLine1' | 'city' | 'postalCode' | 'countryCode';

type CheckoutFieldErrors = Partial<Record<CheckoutField, string>>;

type CheckoutSelectionErrors = {
    shippingMethodId?: string;
    paymentMethodCode?: string;
    termsAccepted?: string;
};

const REQUIRED_FIELD_ORDER: CheckoutField[] = [
    'email',
    'firstName',
    'lastName',
    'streetLine1',
    'city',
    'postalCode',
    'countryCode',
];

interface CheckoutClientProps {
    initialOrder: CheckoutOrder | null;
    initialShippingMethods: ShippingMethodQuote[];
    initialPaymentMethods: PaymentMethodQuote[];
    iconCatalog: IconCatalogItem[];
}

export default function CheckoutClient({
    initialOrder,
    initialShippingMethods,
    initialPaymentMethods,
    iconCatalog,
}: CheckoutClientProps) {
    const router = useRouter();

    const order = initialOrder;
    const shippingMethods = initialShippingMethods;
    const paymentMethods = initialPaymentMethods;

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize icon lookup from prop
    const [iconLookup] = useState<ConfiguredIconLookup>(() => {
        return buildConfiguredIconLookupFromPayload(iconCatalog);
    });

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

    // Initialize selection with first available option if not already set
    const [shippingMethodId, setShippingMethodId] = useState<string>(() => {
        return initialShippingMethods.length > 0 ? initialShippingMethods[0].id : '';
    });
    const [paymentMethodCode, setPaymentMethodCode] = useState<string>(() => {
        return initialPaymentMethods.length > 0 ? initialPaymentMethods[0].code : '';
    });

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
    const [selectionErrors, setSelectionErrors] = useState<CheckoutSelectionErrors & { termsAccepted?: string }>({});

    const emailRef = useRef<HTMLInputElement | null>(null);
    const firstNameRef = useRef<HTMLInputElement | null>(null);
    const lastNameRef = useRef<HTMLInputElement | null>(null);
    const streetLine1Ref = useRef<HTMLInputElement | null>(null);
    const cityRef = useRef<HTMLInputElement | null>(null);
    const postalCodeRef = useRef<HTMLInputElement | null>(null);
    const countryCodeRef = useRef<HTMLSelectElement | null>(null);

    const clearFieldError = (field: CheckoutField) => {
        setFieldErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    };

    const clearSelectionError = (field: keyof CheckoutSelectionErrors) => {
        setSelectionErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    };

    const validateFields = () => {
        const nextErrors: CheckoutFieldErrors = {};
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            nextErrors.email = 'Enter your email address.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            nextErrors.email = 'Enter a valid email address.';
        }
        if (!firstName.trim()) nextErrors.firstName = 'Enter your first name.';
        if (!lastName.trim()) nextErrors.lastName = 'Enter your last name.';
        if (!streetLine1.trim()) nextErrors.streetLine1 = 'Enter your address line 1.';
        if (!city.trim()) nextErrors.city = 'Enter your city.';
        if (!postalCode.trim()) nextErrors.postalCode = 'Enter your postal code.';
        if (!countryCode.trim()) nextErrors.countryCode = 'Select your country.';
        return nextErrors;
    };

    const focusField = (field: CheckoutField) => {
        switch (field) {
            case 'email':
                emailRef.current?.focus();
                break;
            case 'firstName':
                firstNameRef.current?.focus();
                break;
            case 'lastName':
                lastNameRef.current?.focus();
                break;
            case 'streetLine1':
                streetLine1Ref.current?.focus();
                break;
            case 'city':
                cityRef.current?.focus();
                break;
            case 'postalCode':
                postalCodeRef.current?.focus();
                break;
            case 'countryCode':
                countryCodeRef.current?.focus();
                break;
            default:
                break;
        }
    };

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

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!order?.code) {
            setError('No active order found. Please add items before checkout.');
            return;
        }

        const nextFieldErrors = validateFields();
        const nextSelectionErrors: CheckoutSelectionErrors = {};
        if (!shippingMethodId) nextSelectionErrors.shippingMethodId = 'Select a shipping method.';
        if (!paymentMethodCode) nextSelectionErrors.paymentMethodCode = 'Select a payment method.';
        if (!termsAccepted) nextSelectionErrors.termsAccepted = 'You must agree to the terms to proceed.';

        if (Object.keys(nextFieldErrors).length > 0 || Object.keys(nextSelectionErrors).length > 0) {
            setFieldErrors(nextFieldErrors);
            setSelectionErrors(nextSelectionErrors);
            setError('Please correct the highlighted fields and try again.');

            const firstFieldError = REQUIRED_FIELD_ORDER.find((field) => Boolean(nextFieldErrors[field]));
            if (firstFieldError) {
                focusField(firstFieldError);
            } else if (nextSelectionErrors.shippingMethodId) {
                document.querySelector<HTMLInputElement>('input[name="shippingMethod"]')?.focus();
            } else if (nextSelectionErrors.paymentMethodCode) {
                document.querySelector<HTMLInputElement>('input[name="paymentMethod"]')?.focus();
            }
            return;
        }

        setFieldErrors({});
        setSelectionErrors({});
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
    const canSubmit = !isSubmitting;

    return (
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="card-panel p-5 sm:p-6">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Checkout</h1>
                        <p className="mt-1 text-sm text-panel-muted">Enter shipping and payment details to confirm your order.</p>
                    </div>
                    <Button asChild variant="secondaryDark" className="w-full sm:w-auto">
                        <Link href="/cart">Back to Cart</Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="card-panel bg-panel-light p-6 text-sm text-panel-muted">Loading checkout…</div>
                ) : null}

                {!isLoading && error ? (
                    <div
                        role="alert"
                        aria-live="polite"
                        aria-atomic="true"
                        className="rounded-xl border border-rose-400/20 bg-rose-950/30 p-6 text-sm font-medium text-rose-100"
                    >
                        {error}
                    </div>
                ) : null}

                {!isLoading && !order ? (
                    <div className="card-panel bg-panel-light p-8 text-center">
                        <p className="text-base font-semibold text-white">Your cart is empty.</p>
                        <p className="mt-2 text-sm text-panel-muted">Add items before starting checkout.</p>
                        <div className="mt-5">
                            <Button asChild variant="premium" className="w-full sm:w-auto">
                                <Link href="/shop">Browse products</Link>
                            </Button>
                        </div>
                    </div>
                ) : null}

                {!isLoading && order ? (
                    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                        <section className="card-panel bg-panel-light space-y-6 p-5">
                            {order.lines.length > 0 ? (
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Configured line items</h2>
                                    <div className="mt-3 space-y-3">
                                        {order.lines.map((line) => {
                                            const configurationRaw = line.customFields?.configuration ?? null;
                                            const hasConfiguration = typeof configurationRaw === 'string' && configurationRaw.trim().length > 0;
                                            const previewConfiguration = hasConfiguration
                                                ? parseConfigurationForPreview(configurationRaw)
                                                : null;
                                            const modelCode = resolvePkpModelCode(
                                                line.productVariant?.product?.slug ?? '',
                                                line.productVariant?.product?.name ?? line.productVariant?.name ?? '',
                                            ) || null;
                                            const slotIds = resolvePreviewSlotIds({
                                                modelCode,
                                                configuration: previewConfiguration,
                                            });
                                            const configuredSlots = countConfiguredSlots(previewConfiguration);
                                            const imagePath = line.productVariant?.product?.featuredAsset?.preview
                                                || line.productVariant?.product?.featuredAsset?.source
                                                || '';
                                            const imageSrc = imagePath ? assetUrl(imagePath) : '';

                                            return (
                                                <article key={line.id} className="flex items-start gap-3 rounded-2xl border border-white/12 bg-[#081831]/65 p-3">
                                                    <div className={`relative shrink-0 overflow-hidden rounded-xl flex items-center justify-center ${hasConfiguration ? 'h-20 w-24 bg-[#020916]' : 'h-20 w-20 bg-neutral-100'}`}>
                                                        {hasConfiguration ? (
                                                            <ConfiguredKeypadThumbnail
                                                                modelCode={modelCode}
                                                                shellAssetPath={imagePath || null}
                                                                configuration={previewConfiguration ?? emptyPreviewConfiguration()}
                                                                iconLookup={iconLookup}
                                                                size="fill"
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
                                                        <div className="text-sm font-semibold text-white">
                                                            {line.productVariant?.name || line.productVariant?.product?.name || 'Product'}
                                                        </div>
                                                        {hasConfiguration ? (
                                                            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#9dcfff]">
                                                                Custom configuration: {configuredSlots}/{slotIds.length} slots defined
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 text-right">
                                                        <div className="text-xs font-semibold text-white">
                                                            {formatMinor(line.linePriceWithTax, line.productVariant?.currencyCode || order.currencyCode)}
                                                        </div>

                                                        {/* Quantity Controls */}
                                                        <div className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.08]">
                                                            <button
                                                                type="button"
                                                                aria-label="Decrease quantity"
                                                                disabled={line.quantity <= 1}
                                                                className="h-7 w-7 rounded-l-full text-sm text-blue-50 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="min-w-[2rem] px-1 text-center text-xs font-semibold text-white">
                                                                {line.quantity}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                aria-label="Increase quantity"
                                                                className="h-7 w-7 rounded-r-full text-sm text-blue-50 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="text-[10px] font-semibold text-blue-100/60 underline-offset-4 transition hover:text-rose-300 hover:underline"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}

                            <div>
                                <h2 className="text-lg font-semibold text-white">Contact</h2>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <label className="sm:col-span-2">
                                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-100/70">Email</span>
                                        <input
                                            id="checkout-email"
                                            ref={emailRef}
                                            name="email"
                                            type="email"
                                            value={email}
                                            onChange={(event) => {
                                                setEmail(event.target.value);
                                                clearFieldError('email');
                                            }}
                                            required
                                            className="input input-dark"
                                            placeholder="you@company.com"
                                            autoComplete="email"
                                            spellCheck={false}
                                            aria-invalid={fieldErrors.email ? 'true' : undefined}
                                            aria-describedby={fieldErrors.email ? 'checkout-email-error' : undefined}
                                        />
                                        {fieldErrors.email ? (
                                            <span id="checkout-email-error" role="alert" className="mt-1 block text-xs font-semibold text-rose-200">
                                                {fieldErrors.email}
                                            </span>
                                        ) : null}
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-100/70">First name</span>
                                        <input
                                            id="checkout-first-name"
                                            ref={firstNameRef}
                                            name="firstName"
                                            type="text"
                                            value={firstName}
                                            onChange={(event) => {
                                                setFirstName(event.target.value);
                                                clearFieldError('firstName');
                                            }}
                                            required
                                            className="input input-dark"
                                            autoComplete="given-name"
                                            aria-invalid={fieldErrors.firstName ? 'true' : undefined}
                                            aria-describedby={fieldErrors.firstName ? 'checkout-first-name-error' : undefined}
                                        />
                                        {fieldErrors.firstName ? (
                                            <span id="checkout-first-name-error" role="alert" className="mt-1 block text-xs font-semibold text-rose-200">
                                                {fieldErrors.firstName}
                                            </span>
                                        ) : null}
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-100/70">Last name</span>
                                        <input
                                            id="checkout-last-name"
                                            ref={lastNameRef}
                                            name="lastName"
                                            type="text"
                                            value={lastName}
                                            onChange={(event) => {
                                                setLastName(event.target.value);
                                                clearFieldError('lastName');
                                            }}
                                            required
                                            className="input input-dark"
                                            autoComplete="family-name"
                                            aria-invalid={fieldErrors.lastName ? 'true' : undefined}
                                            aria-describedby={fieldErrors.lastName ? 'checkout-last-name-error' : undefined}
                                        />
                                        {fieldErrors.lastName ? (
                                            <span id="checkout-last-name-error" role="alert" className="mt-1 block text-xs font-semibold text-rose-200">
                                                {fieldErrors.lastName}
                                            </span>
                                        ) : null}
                                    </label>
                                    <label className="sm:col-span-2">
                                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-100/70">Phone (optional)</span>
                                        <input
                                            id="checkout-phone"
                                            name="phoneNumber"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(event) => setPhoneNumber(event.target.value)}
                                            className="input input-dark"
                                            autoComplete="tel"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-white">Shipping address</h2>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <label className="sm:col-span-2">
                                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-100/70">Address line 1</span>
                                        <input
                                            id="checkout-street-line-1"
                                            ref={streetLine1Ref}
                                            name="streetLine1"
                                            type="text"
                                            value={streetLine1}
                                            onChange={(event) => {
                                                setStreetLine1(event.target.value);
                                                clearFieldError('streetLine1');
                                            }}
                                            required
                                            className="input input-dark"
                                            autoComplete="address-line1"
                                            aria-invalid={fieldErrors.streetLine1 ? 'true' : undefined}
                                            aria-describedby={fieldErrors.streetLine1 ? 'checkout-street-line-1-error' : undefined}
                                        />
                                        {fieldErrors.streetLine1 ? (
                                            <span id="checkout-street-line-1-error" role="alert" className="mt-1 block text-xs font-semibold text-rose-200">
                                                {fieldErrors.streetLine1}
                                            </span>
                                        ) : null}
                                    </label>
                                    <label className="sm:col-span-2">
                                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-100/70">Address line 2 (optional)</span>
                                        <input
                                            id="checkout-street-line-2"
                                            name="streetLine2"
                                            type="text"
                                            value={streetLine2}
                                            onChange={(event) => setStreetLine2(event.target.value)}
                                            className="input input-dark"
                                            autoComplete="address-line2"
                                        />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-100/70">City</span>
                                        <input
                                            id="checkout-city"
                                            ref={cityRef}
                                            name="city"
                                            type="text"
                                            value={city}
                                            onChange={(event) => {
                                                setCity(event.target.value);
                                                clearFieldError('city');
                                            }}
                                            required
                                            className="input input-dark"
                                            autoComplete="address-level2"
                                            aria-invalid={fieldErrors.city ? 'true' : undefined}
                                            aria-describedby={fieldErrors.city ? 'checkout-city-error' : undefined}
                                        />
                                        {fieldErrors.city ? (
                                            <span id="checkout-city-error" role="alert" className="mt-1 block text-xs font-semibold text-rose-200">
                                                {fieldErrors.city}
                                            </span>
                                        ) : null}
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-100/70">Province/State</span>
                                        <input
                                            id="checkout-province"
                                            name="province"
                                            type="text"
                                            value={province}
                                            onChange={(event) => setProvince(event.target.value)}
                                            className="input input-dark"
                                            autoComplete="address-level1"
                                        />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-100/70">Postal code</span>
                                        <input
                                            id="checkout-postal-code"
                                            ref={postalCodeRef}
                                            name="postalCode"
                                            type="text"
                                            value={postalCode}
                                            onChange={(event) => {
                                                setPostalCode(event.target.value);
                                                clearFieldError('postalCode');
                                            }}
                                            required
                                            className="input input-dark"
                                            autoComplete="postal-code"
                                            aria-invalid={fieldErrors.postalCode ? 'true' : undefined}
                                            aria-describedby={fieldErrors.postalCode ? 'checkout-postal-code-error' : undefined}
                                        />
                                        {fieldErrors.postalCode ? (
                                            <span id="checkout-postal-code-error" role="alert" className="mt-1 block text-xs font-semibold text-rose-200">
                                                {fieldErrors.postalCode}
                                            </span>
                                        ) : null}
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-blue-100/70">Country</span>
                                        <select
                                            id="checkout-country-code"
                                            ref={countryCodeRef}
                                            name="countryCode"
                                            value={countryCode}
                                            onChange={(event) => {
                                                setCountryCode(event.target.value);
                                                clearFieldError('countryCode');
                                            }}
                                            className="input input-dark"
                                            autoComplete="country"
                                            required
                                            aria-invalid={fieldErrors.countryCode ? 'true' : undefined}
                                            aria-describedby={fieldErrors.countryCode ? 'checkout-country-code-error' : undefined}
                                        >
                                            <option value="US">United States</option>
                                            <option value="GB">United Kingdom</option>
                                            <option value="CA">Canada</option>
                                            <option value="AU">Australia</option>
                                        </select>
                                        {fieldErrors.countryCode ? (
                                            <span id="checkout-country-code-error" role="alert" className="mt-1 block text-xs font-semibold text-rose-200">
                                                {fieldErrors.countryCode}
                                            </span>
                                        ) : null}
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-white">Shipping method</h2>
                                <div className="mt-3 grid gap-2">
                                    {shippingMethods.length > 0 ? (
                                        shippingMethods.map((method) => (
                                            <label key={method.id} className="inline-flex items-start gap-2 rounded-xl border border-white/14 bg-[#081831]/55 px-3 py-2 text-sm">
                                                <input
                                                    type="radio"
                                                    name="shippingMethod"
                                                    value={method.id}
                                                    checked={shippingMethodId === method.id}
                                                    onChange={() => {
                                                        setShippingMethodId(method.id);
                                                        clearSelectionError('shippingMethodId');
                                                    }}
                                                    required
                                                />
                                                <span>
                                                    <span className="block font-semibold text-white">{method.name}</span>
                                                    <span className="block text-xs text-blue-100/70">{method.description || method.code}</span>
                                                    <span className="block text-xs font-semibold text-blue-100/85">{formatMinor(method.priceWithTax, order.currencyCode)}</span>
                                                </span>
                                            </label>
                                        ))
                                    ) : (
                                        <div className="rounded-xl border border-rose-400/45 bg-rose-950/35 px-3 py-2 text-sm text-rose-100">
                                            No eligible shipping methods available for this order yet.
                                        </div>
                                    )}
                                    {selectionErrors.shippingMethodId ? (
                                        <p role="alert" className="text-xs font-semibold text-rose-200">{selectionErrors.shippingMethodId}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-white">Payment</h2>
                                <div className="mt-3 grid gap-2">
                                    {paymentMethods.length > 0 ? (
                                        paymentMethods.map((method) => (
                                            <label key={method.code} className="inline-flex items-start gap-2 rounded-xl border border-white/14 bg-[#081831]/55 px-3 py-2 text-sm">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value={method.code}
                                                    checked={paymentMethodCode === method.code}
                                                    onChange={() => {
                                                        setPaymentMethodCode(method.code);
                                                        clearSelectionError('paymentMethodCode');
                                                    }}
                                                    required
                                                />
                                                <span>
                                                    <span className="block font-semibold text-white">{method.name}</span>
                                                    <span className="block text-xs text-blue-100/70">{method.description || method.code}</span>
                                                </span>
                                            </label>
                                        ))
                                    ) : (
                                        <div className="rounded-xl border border-rose-400/45 bg-rose-950/35 px-3 py-2 text-sm text-rose-100">
                                            No eligible payment methods available for this order.
                                        </div>
                                    )}
                                    {selectionErrors.paymentMethodCode ? (
                                        <p role="alert" className="text-xs font-semibold text-rose-200">{selectionErrors.paymentMethodCode}</p>
                                    ) : null}
                                </div>
                            </div>
                        </section>

                        <aside className="card-panel bg-panel-light h-fit p-5">
                            <h2 className="text-base font-semibold text-white">Order summary</h2>
                            <div className="mt-1 text-xs text-panel-muted">Order code: {order.code}</div>
                            <div className="mt-4 space-y-2 text-sm text-blue-100/85">
                                <div className="flex items-center justify-between">
                                    <span>Items ({order.totalQuantity})</span>
                                    <span>{totals.subTotal}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Shipping</span>
                                    <span>{totals.shipping}</span>
                                </div>
                            </div>
                            <div className="my-4 h-px bg-white/12" />
                            <div className="flex items-center justify-between text-base font-semibold text-white">
                                <span>Total</span>
                                <span>{totals.total}</span>
                            </div>

                            <div className="mt-6">
                                <label className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => {
                                            setTermsAccepted(e.target.checked);
                                            if (e.target.checked) clearSelectionError('termsAccepted' as keyof CheckoutSelectionErrors);
                                        }}
                                        className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                                    />
                                    <span className="text-xs text-panel-muted">
                                        I have read and agree to the <Link href="/terms" target="_blank" className="text-blue-400 hover:underline">Terms of Service</Link>, <Link href="/privacy" target="_blank" className="text-blue-400 hover:underline">Privacy Policy</Link>, and <Link href="/cookies" target="_blank" className="text-blue-400 hover:underline">Cookie Policy</Link>.
                                    </span>
                                </label>
                                {selectionErrors.termsAccepted ? (
                                    <p role="alert" className="mt-2 text-xs font-semibold text-rose-200">{selectionErrors.termsAccepted}</p>
                                ) : null}
                            </div>

                            <Button
                                type="submit"
                                disabled={!canSubmit}
                                variant="premium"
                                className="mt-5 w-full"
                            >
                                {isSubmitting ? 'Processing order...' : `Pay ${totals.total}`}
                            </Button>
                        </aside>
                    </form>
                ) : null}
            </div>
        </div >
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
