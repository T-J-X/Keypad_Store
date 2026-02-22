import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import type { CheckoutOrder } from '../../../lib/checkoutTypes';

type CheckoutSelectionErrors = {
  shippingMethodId?: string;
  paymentMethodCode?: string;
  termsAccepted?: string;
};

type CheckoutSummaryAsideProps = {
  order: CheckoutOrder;
  totals: {
    subTotal: string;
    shipping: string;
    total: string;
  };
  termsAccepted: boolean;
  selectionErrors: CheckoutSelectionErrors;
  canSubmit: boolean;
  isSubmitting: boolean;
  onTermsAcceptedChange: (checked: boolean) => void;
  clearSelectionError: (field: keyof CheckoutSelectionErrors) => void;
};

export default function CheckoutSummaryAside({
  order,
  totals,
  termsAccepted,
  selectionErrors,
  canSubmit,
  isSubmitting,
  onTermsAcceptedChange,
  clearSelectionError,
}: CheckoutSummaryAsideProps) {
  return (
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
            onChange={(event) => {
              onTermsAcceptedChange(event.target.checked);
              if (event.target.checked) clearSelectionError('termsAccepted');
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
  );
}
