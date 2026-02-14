import { NextResponse } from 'next/server';
import { SHOP_API_URL, withSessionCookie } from '../../../../lib/api/shopApi';

const CHECKOUT_SESSION_QUERY = `
  query CheckoutSession {
    activeOrder {
      id
      code
      state
      totalQuantity
      subTotalWithTax
      shippingWithTax
      totalWithTax
      currencyCode
      lines {
        id
        quantity
        linePriceWithTax
        customFields {
          configuration
        }
        productVariant {
          id
          name
          currencyCode
          product {
            id
            slug
            name
            featuredAsset {
              preview
              source
            }
          }
        }
      }
    }
    eligibleShippingMethods {
      id
      code
      name
      description
      priceWithTax
    }
    eligiblePaymentMethods {
      id
      code
      name
      description
      isEligible
      eligibilityMessage
    }
    activePaymentMethods {
      code
      name
      description
    }
  }
`;

type GraphResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type CheckoutSessionResponse = {
  activeOrder?: {
    id: string;
    code: string;
    state?: string | null;
    totalQuantity?: number | null;
    subTotalWithTax?: number | null;
    shippingWithTax?: number | null;
    totalWithTax?: number | null;
    currencyCode?: string | null;
    lines?: Array<{
      id: string;
      quantity?: number | null;
      linePriceWithTax?: number | null;
      customFields?: {
        configuration?: string | null;
      } | null;
      productVariant?: {
        id: string;
        name?: string | null;
        currencyCode?: string | null;
        product?: {
          id: string;
          slug?: string | null;
          name?: string | null;
          featuredAsset?: {
            preview?: string | null;
            source?: string | null;
          } | null;
        } | null;
      } | null;
    }> | null;
  } | null;
  eligibleShippingMethods?: Array<{
    id: string;
    code?: string | null;
    name?: string | null;
    description?: string | null;
    priceWithTax?: number | null;
  }> | null;
  eligiblePaymentMethods?: Array<{
    id: string;
    code?: string | null;
    name?: string | null;
    description?: string | null;
    isEligible?: boolean | null;
    eligibilityMessage?: string | null;
  }> | null;
  activePaymentMethods?: Array<{
    code?: string | null;
    name?: string | null;
    description?: string | null;
  }> | null;
};

export async function GET(request: Request) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const incomingCookie = request.headers.get('cookie');
  if (incomingCookie) headers.cookie = incomingCookie;

  const vendureResponse = await fetch(SHOP_API_URL, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({ query: CHECKOUT_SESSION_QUERY }),
  });

  const json = (await vendureResponse.json().catch(() => ({}))) as GraphResponse<CheckoutSessionResponse>;

  if (!vendureResponse.ok || json.errors?.length) {
    const message = json.errors?.[0]?.message || `Vendure error (${vendureResponse.status})`;
    return withSessionCookie(NextResponse.json({ error: message }, { status: 400 }), vendureResponse);
  }

  const order = json.data?.activeOrder;

  const eligibleShippingMethods = (json.data?.eligibleShippingMethods ?? []).map((method) => ({
    id: method.id,
    code: method.code ?? '',
    name: method.name ?? 'Shipping',
    description: method.description ?? '',
    priceWithTax: normalizeInt(method.priceWithTax),
  }));

  const eligiblePaymentMethods = (json.data?.eligiblePaymentMethods ?? [])
    .filter((method) => method.isEligible !== false)
    .map((method) => ({
      id: method.id,
      code: method.code ?? '',
      name: method.name ?? method.code ?? 'Payment method',
      description: method.description ?? method.eligibilityMessage ?? '',
      isEligible: method.isEligible !== false,
      eligibilityMessage: method.eligibilityMessage ?? null,
    }))
    .filter((method) => method.code.trim().length > 0);

  const paymentMethods = eligiblePaymentMethods.length > 0
    ? eligiblePaymentMethods
    : (json.data?.activePaymentMethods ?? [])
      .map((method, index) => ({
        id: `active-${index}`,
        code: method.code ?? '',
        name: method.name ?? method.code ?? 'Payment method',
        description: method.description ?? '',
        isEligible: true,
        eligibilityMessage: null,
      }))
      .filter((method) => method.code.trim().length > 0);

  const response = NextResponse.json({
    order: order
      ? {
          id: order.id,
          code: order.code,
          state: order.state ?? null,
          totalQuantity: normalizeInt(order.totalQuantity),
          subTotalWithTax: normalizeInt(order.subTotalWithTax),
          shippingWithTax: normalizeInt(order.shippingWithTax),
          totalWithTax: normalizeInt(order.totalWithTax),
          currencyCode: order.currencyCode ?? 'USD',
          lines: (order.lines ?? []).map((line) => ({
            id: line.id,
            quantity: normalizeInt(line.quantity),
            linePriceWithTax: normalizeInt(line.linePriceWithTax),
            customFields: line.customFields
              ? {
                  configuration: line.customFields.configuration ?? null,
                }
              : null,
            productVariant: line.productVariant
              ? {
                  id: line.productVariant.id,
                  name: line.productVariant.name ?? 'Product variant',
                  currencyCode: line.productVariant.currencyCode ?? order.currencyCode ?? 'USD',
                  product: line.productVariant.product
                    ? {
                        id: line.productVariant.product.id,
                        slug: line.productVariant.product.slug ?? null,
                        name: line.productVariant.product.name ?? null,
                        featuredAsset: line.productVariant.product.featuredAsset
                          ? {
                              preview: line.productVariant.product.featuredAsset.preview ?? null,
                              source: line.productVariant.product.featuredAsset.source ?? null,
                            }
                          : null,
                      }
                    : null,
                }
              : null,
          })),
        }
      : null,
    shippingMethods: eligibleShippingMethods,
    paymentMethods,
  });

  return withSessionCookie(response, vendureResponse);
}

function normalizeInt(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}
