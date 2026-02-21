import type { RefObject } from 'react';
import type { PaymentMethodQuote, ShippingMethodQuote, CheckoutOrder } from '../../../lib/checkoutTypes';
import CheckoutContactAddressSection from './CheckoutContactAddressSection';
import CheckoutShippingPaymentSection from './CheckoutShippingPaymentSection';

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

type CheckoutFormDetailsSectionProps = {
  order: CheckoutOrder;
  shippingMethods: ShippingMethodQuote[];
  paymentMethods: PaymentMethodQuote[];
  shippingMethodId: string;
  paymentMethodCode: string;
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
  emailRef: RefObject<HTMLInputElement | null>;
  firstNameRef: RefObject<HTMLInputElement | null>;
  lastNameRef: RefObject<HTMLInputElement | null>;
  streetLine1Ref: RefObject<HTMLInputElement | null>;
  cityRef: RefObject<HTMLInputElement | null>;
  postalCodeRef: RefObject<HTMLInputElement | null>;
  countryCodeRef: RefObject<HTMLSelectElement | null>;
  updateRequiredField: (field: CheckoutField, value: string) => void;
  setInputValue: (field: CheckoutInputField, value: string) => void;
  clearSelectionError: (field: keyof CheckoutSelectionErrors) => void;
  formatMinor: (minor: number | null | undefined, currencyCode: string) => string;
};

export default function CheckoutFormDetailsSection({
  order,
  shippingMethods,
  paymentMethods,
  shippingMethodId,
  paymentMethodCode,
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
  emailRef,
  firstNameRef,
  lastNameRef,
  streetLine1Ref,
  cityRef,
  postalCodeRef,
  countryCodeRef,
  updateRequiredField,
  setInputValue,
  clearSelectionError,
  formatMinor,
}: CheckoutFormDetailsSectionProps) {
  return (
    <>
      <CheckoutContactAddressSection
        fieldErrors={fieldErrors}
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
      />

      <CheckoutShippingPaymentSection
        shippingMethods={shippingMethods}
        paymentMethods={paymentMethods}
        shippingMethodId={shippingMethodId}
        paymentMethodCode={paymentMethodCode}
        orderCurrencyCode={order.currencyCode}
        selectionErrors={selectionErrors}
        setInputValue={setInputValue}
        clearSelectionError={clearSelectionError}
        formatMinor={formatMinor}
      />
    </>
  );
}
