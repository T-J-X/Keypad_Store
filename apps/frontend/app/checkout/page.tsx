import { fetchCheckoutSession } from '../../lib/vendure.server';
import { fetchIconCatalog } from '../../lib/configurator.server';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const [session, iconCatalog] = await Promise.all([
    fetchCheckoutSession(),
    fetchIconCatalog(),
  ]);

  return (
    <CheckoutClient
      initialOrder={session.order}
      initialShippingMethods={session.shippingMethods}
      initialPaymentMethods={session.paymentMethods}
      iconCatalog={iconCatalog}
    />
  );
}
