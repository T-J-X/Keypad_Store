import type { PaymentMethodQuote, ShippingMethodQuote } from '../../../lib/checkoutTypes';

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

type CheckoutShippingPaymentSectionProps = {
  shippingMethods: ShippingMethodQuote[];
  paymentMethods: PaymentMethodQuote[];
  shippingMethodId: string;
  paymentMethodCode: string;
  orderCurrencyCode: string;
  selectionErrors: CheckoutSelectionErrors;
  setInputValue: (field: CheckoutInputField, value: string) => void;
  clearSelectionError: (field: keyof CheckoutSelectionErrors) => void;
  formatMinor: (minor: number | null | undefined, currencyCode: string) => string;
};

export default function CheckoutShippingPaymentSection({
  shippingMethods,
  paymentMethods,
  shippingMethodId,
  paymentMethodCode,
  orderCurrencyCode,
  selectionErrors,
  setInputValue,
  clearSelectionError,
  formatMinor,
}: CheckoutShippingPaymentSectionProps) {
  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-white">Shipping method</h2>
        <div className="mt-3 grid gap-2">
          {shippingMethods.length > 0 ? (
            shippingMethods.map((method) => (
              <label
                key={method.id}
                className="inline-flex items-start gap-2 rounded-xl border border-white/14 bg-[#081831]/55 px-3 py-2 text-sm"
                aria-label={`Shipping method ${method.name}`}
              >
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.id}
                  checked={shippingMethodId === method.id}
                  onChange={() => {
                    setInputValue('shippingMethodId', method.id);
                    clearSelectionError('shippingMethodId');
                  }}
                  required
                />
                <span>
                  <span className="block font-semibold text-white">{method.name}</span>
                  <span className="block text-xs text-blue-100/70">{method.description || method.code}</span>
                  <span className="block text-xs font-semibold text-blue-100/85">{formatMinor(method.priceWithTax, orderCurrencyCode)}</span>
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
              <label
                key={method.code}
                className="inline-flex items-start gap-2 rounded-xl border border-white/14 bg-[#081831]/55 px-3 py-2 text-sm"
                aria-label={`Payment method ${method.name}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.code}
                  checked={paymentMethodCode === method.code}
                  onChange={() => {
                    setInputValue('paymentMethodCode', method.code);
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
    </>
  );
}
