import type { RefObject } from 'react';

type CheckoutField = 'email' | 'firstName' | 'lastName' | 'streetLine1' | 'city' | 'postalCode' | 'countryCode';
type CheckoutFieldErrors = Partial<Record<CheckoutField, string>>;
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

type CheckoutContactAddressSectionProps = {
  fieldErrors: CheckoutFieldErrors;
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
  emailRef: RefObject<HTMLInputElement | null>;
  firstNameRef: RefObject<HTMLInputElement | null>;
  lastNameRef: RefObject<HTMLInputElement | null>;
  streetLine1Ref: RefObject<HTMLInputElement | null>;
  cityRef: RefObject<HTMLInputElement | null>;
  postalCodeRef: RefObject<HTMLInputElement | null>;
  countryCodeRef: RefObject<HTMLSelectElement | null>;
  updateRequiredField: (field: CheckoutField, value: string) => void;
  setInputValue: (field: CheckoutInputField, value: string) => void;
};

export default function CheckoutContactAddressSection({
  fieldErrors,
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
  emailRef,
  firstNameRef,
  lastNameRef,
  streetLine1Ref,
  cityRef,
  postalCodeRef,
  countryCodeRef,
  updateRequiredField,
  setInputValue,
}: CheckoutContactAddressSectionProps) {
  return (
    <>
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
                updateRequiredField('email', event.target.value);
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
                updateRequiredField('firstName', event.target.value);
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
                updateRequiredField('lastName', event.target.value);
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
              onChange={(event) => setInputValue('phoneNumber', event.target.value)}
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
                updateRequiredField('streetLine1', event.target.value);
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
              onChange={(event) => setInputValue('streetLine2', event.target.value)}
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
                updateRequiredField('city', event.target.value);
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
              onChange={(event) => setInputValue('province', event.target.value)}
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
                updateRequiredField('postalCode', event.target.value);
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
                updateRequiredField('countryCode', event.target.value);
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
    </>
  );
}
