import Link from 'next/link';
import type { FormEvent, RefObject } from 'react';
import { Button } from '../../../components/ui/button';
import type { ConfiguredIconLookup } from '../../../lib/configuredKeypadPreview';
import type { CheckoutOrder, PaymentMethodQuote, ShippingMethodQuote } from '../../../lib/checkoutTypes';
import CheckoutConfiguredLines from './CheckoutConfiguredLines';
import CheckoutFormDetailsSection from './CheckoutFormDetailsSection';
import CheckoutSummaryAside from './CheckoutSummaryAside';

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

type CheckoutViewProps = {
  isLoading: boolean;
  error: string | null;
  order: CheckoutOrder | null;
  iconLookup: ConfiguredIconLookup;
  shippingMethods: ShippingMethodQuote[];
  paymentMethods: PaymentMethodQuote[];
  shippingMethodId: string;
  paymentMethodCode: string;
  termsAccepted: boolean;
  fieldErrors: CheckoutFieldErrors;
  selectionErrors: CheckoutSelectionErrors;
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
  totals: {
    subTotal: string;
    shipping: string;
    total: string;
  };
  isSubmitting: boolean;
  canSubmit: boolean;
  emailRef: RefObject<HTMLInputElement | null>;
  firstNameRef: RefObject<HTMLInputElement | null>;
  lastNameRef: RefObject<HTMLInputElement | null>;
  streetLine1Ref: RefObject<HTMLInputElement | null>;
  cityRef: RefObject<HTMLInputElement | null>;
  postalCodeRef: RefObject<HTMLInputElement | null>;
  countryCodeRef: RefObject<HTMLSelectElement | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  updateRequiredField: (field: CheckoutField, value: string) => void;
  setInputValue: (field: CheckoutInputField, value: string) => void;
  clearSelectionError: (field: keyof CheckoutSelectionErrors) => void;
  onTermsAcceptedChange: (checked: boolean) => void;
  formatMinor: (minor: number | null | undefined, currencyCode: string) => string;
};

export default function CheckoutView({
  isLoading,
  error,
  order,
  iconLookup,
  shippingMethods,
  paymentMethods,
  shippingMethodId,
  paymentMethodCode,
  termsAccepted,
  fieldErrors,
  selectionErrors,
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
  totals,
  isSubmitting,
  canSubmit,
  emailRef,
  firstNameRef,
  lastNameRef,
  streetLine1Ref,
  cityRef,
  postalCodeRef,
  countryCodeRef,
  onSubmit,
  updateRequiredField,
  setInputValue,
  clearSelectionError,
  onTermsAcceptedChange,
  formatMinor,
}: CheckoutViewProps) {
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
              <CheckoutConfiguredLines
                order={order}
                iconLookup={iconLookup}
                formatMinor={formatMinor}
              />

              <CheckoutFormDetailsSection
                order={order}
                shippingMethods={shippingMethods}
                paymentMethods={paymentMethods}
                shippingMethodId={shippingMethodId}
                paymentMethodCode={paymentMethodCode}
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
                emailRef={emailRef}
                firstNameRef={firstNameRef}
                lastNameRef={lastNameRef}
                streetLine1Ref={streetLine1Ref}
                cityRef={cityRef}
                postalCodeRef={postalCodeRef}
                countryCodeRef={countryCodeRef}
                updateRequiredField={updateRequiredField}
                setInputValue={setInputValue}
                clearSelectionError={clearSelectionError}
                formatMinor={formatMinor}
              />
            </section>

            <CheckoutSummaryAside
              order={order}
              totals={totals}
              termsAccepted={termsAccepted}
              selectionErrors={selectionErrors}
              canSubmit={canSubmit}
              isSubmitting={isSubmitting}
              onTermsAcceptedChange={onTermsAcceptedChange}
              clearSelectionError={clearSelectionError}
            />
          </form>
        ) : null}
      </div>
    </div>
  );
}
