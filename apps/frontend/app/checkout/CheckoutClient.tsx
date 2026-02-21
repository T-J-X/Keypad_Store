'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useReducer, useRef, useState } from 'react';
import { notifyCartUpdated } from '../../lib/cartEvents';
import {
    buildConfiguredIconLookupFromPayload,
    type ConfiguredIconLookup,
} from '../../lib/configuredKeypadPreview';
import type { CheckoutOrder, ShippingMethodQuote, PaymentMethodQuote } from '../../lib/checkoutTypes';
import CheckoutView from './components/CheckoutView';

type CheckoutField = 'email' | 'firstName' | 'lastName' | 'streetLine1' | 'city' | 'postalCode' | 'countryCode';

type CheckoutFieldErrors = Partial<Record<CheckoutField, string>>;

type CheckoutSelectionErrors = {
    shippingMethodId?: string;
    paymentMethodCode?: string;
    termsAccepted?: string;
};

type CheckoutInputField =
    | 'email'
    | 'firstName'
    | 'lastName'
    | 'phoneNumber'
    | 'streetLine1'
    | 'streetLine2'
    | 'city'
    | 'province'
    | 'postalCode'
    | 'countryCode'
    | 'shippingMethodId'
    | 'paymentMethodCode';

type CheckoutFormState = {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    streetLine1: string;
    streetLine2: string;
    city: string;
    province: string;
    postalCode: string;
    countryCode: string;
    shippingMethodId: string;
    paymentMethodCode: string;
    termsAccepted: boolean;
    fieldErrors: CheckoutFieldErrors;
    selectionErrors: CheckoutSelectionErrors;
};

type CheckoutFormAction =
    | { type: 'setValue'; field: CheckoutInputField; value: string }
    | { type: 'setTermsAccepted'; value: boolean }
    | { type: 'clearFieldError'; field: CheckoutField }
    | { type: 'clearSelectionError'; field: keyof CheckoutSelectionErrors }
    | { type: 'setValidationErrors'; fieldErrors: CheckoutFieldErrors; selectionErrors: CheckoutSelectionErrors }
    | { type: 'clearAllErrors' };

const REQUIRED_FIELD_ORDER: CheckoutField[] = [
    'email',
    'firstName',
    'lastName',
    'streetLine1',
    'city',
    'postalCode',
    'countryCode',
];

function createInitialCheckoutFormState({
    initialShippingMethods,
    initialPaymentMethods,
}: {
    initialShippingMethods: ShippingMethodQuote[];
    initialPaymentMethods: PaymentMethodQuote[];
}): CheckoutFormState {
    return {
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        streetLine1: '',
        streetLine2: '',
        city: '',
        province: '',
        postalCode: '',
        countryCode: 'US',
        shippingMethodId: initialShippingMethods[0]?.id ?? '',
        paymentMethodCode: initialPaymentMethods[0]?.code ?? '',
        termsAccepted: false,
        fieldErrors: {},
        selectionErrors: {},
    };
}

function checkoutFormReducer(state: CheckoutFormState, action: CheckoutFormAction): CheckoutFormState {
    switch (action.type) {
        case 'setValue':
            return state[action.field] === action.value
                ? state
                : { ...state, [action.field]: action.value };
        case 'setTermsAccepted':
            return state.termsAccepted === action.value
                ? state
                : { ...state, termsAccepted: action.value };
        case 'clearFieldError': {
            if (!state.fieldErrors[action.field]) return state;
            const nextFieldErrors = { ...state.fieldErrors };
            delete nextFieldErrors[action.field];
            return { ...state, fieldErrors: nextFieldErrors };
        }
        case 'clearSelectionError': {
            if (!state.selectionErrors[action.field]) return state;
            const nextSelectionErrors = { ...state.selectionErrors };
            delete nextSelectionErrors[action.field];
            return { ...state, selectionErrors: nextSelectionErrors };
        }
        case 'setValidationErrors':
            return {
                ...state,
                fieldErrors: action.fieldErrors,
                selectionErrors: action.selectionErrors,
            };
        case 'clearAllErrors':
            if (Object.keys(state.fieldErrors).length === 0 && Object.keys(state.selectionErrors).length === 0) {
                return state;
            }
            return { ...state, fieldErrors: {}, selectionErrors: {} };
        default:
            return state;
    }
}

interface CheckoutClientProps {
    initialOrder: CheckoutOrder | null;
    initialShippingMethods: ShippingMethodQuote[];
    initialPaymentMethods: PaymentMethodQuote[];
    iconCatalog: Array<{
        iconId: string;
        name?: string;
        matteAssetPath: string | null;
        categories: string[];
    }>;
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

    const isLoading = false;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const iconLookup = useMemo<ConfiguredIconLookup>(() => {
        return buildConfiguredIconLookupFromPayload(iconCatalog);
    }, [iconCatalog]);
    const [formState, dispatchForm] = useReducer(
        checkoutFormReducer,
        { initialShippingMethods, initialPaymentMethods },
        createInitialCheckoutFormState,
    );
    const {
        email,
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
        termsAccepted,
        fieldErrors,
        selectionErrors,
    } = formState;

    const emailRef = useRef<HTMLInputElement | null>(null);
    const firstNameRef = useRef<HTMLInputElement | null>(null);
    const lastNameRef = useRef<HTMLInputElement | null>(null);
    const streetLine1Ref = useRef<HTMLInputElement | null>(null);
    const cityRef = useRef<HTMLInputElement | null>(null);
    const postalCodeRef = useRef<HTMLInputElement | null>(null);
    const countryCodeRef = useRef<HTMLSelectElement | null>(null);

    const clearFieldError = (field: CheckoutField) => {
        dispatchForm({ type: 'clearFieldError', field });
    };

    const clearSelectionError = (field: keyof CheckoutSelectionErrors) => {
        dispatchForm({ type: 'clearSelectionError', field });
    };

    const setInputValue = (field: CheckoutInputField, value: string) => {
        dispatchForm({ type: 'setValue', field, value });
    };

    const updateRequiredField = (field: CheckoutField, value: string) => {
        setInputValue(field, value);
        clearFieldError(field);
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
            dispatchForm({
                type: 'setValidationErrors',
                fieldErrors: nextFieldErrors,
                selectionErrors: nextSelectionErrors,
            });
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

        dispatchForm({ type: 'clearAllErrors' });
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
        <CheckoutView
            isLoading={isLoading}
            error={error}
            order={order}
            iconLookup={iconLookup}
            shippingMethods={shippingMethods}
            paymentMethods={paymentMethods}
            shippingMethodId={shippingMethodId}
            paymentMethodCode={paymentMethodCode}
            termsAccepted={termsAccepted}
            fieldErrors={fieldErrors}
            selectionErrors={selectionErrors}
            email={email}
            firstName={firstName}
            lastName={lastName}
            phoneNumber={phoneNumber}
            streetLine1={streetLine1}
            streetLine2={streetLine2}
            city={city}
            province={province}
            postalCode={postalCode}
            countryCode={countryCode}
            totals={totals}
            isSubmitting={isSubmitting}
            canSubmit={canSubmit}
            emailRef={emailRef}
            firstNameRef={firstNameRef}
            lastNameRef={lastNameRef}
            streetLine1Ref={streetLine1Ref}
            cityRef={cityRef}
            postalCodeRef={postalCodeRef}
            countryCodeRef={countryCodeRef}
            onSubmit={onSubmit}
            updateRequiredField={updateRequiredField}
            setInputValue={setInputValue}
            clearSelectionError={clearSelectionError}
            onTermsAcceptedChange={(checked) => dispatchForm({ type: 'setTermsAccepted', value: checked })}
            formatMinor={formatMinor}
        />
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
