import { NextResponse } from 'next/server';
import { type GraphResponse, normalizeInt, SHOP_API_URL, withSessionCookie } from '../../../../lib/api/shopApi';



type SessionSummaryResponse = {
  activeOrder?: {
    id: string;
    totalQuantity?: number | null;
    totalWithTax?: number;
    currencyCode?: string;
    lines?: Array<{
      id: string;
      quantity: number;
      linePriceWithTax: number;
      productVariant?: {
        id: string;
        name?: string;
        product?: {
          id: string;
          name?: string;
          slug?: string;
          featuredAsset?: {
            preview: string | null;
            source: string | null;
          } | null;
        } | null;
      } | null;
    }>;
  } | null;
  activeCustomer?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddress?: string | null;
  } | null;
};

const SESSION_SUMMARY_QUERY = `
  query SessionSummary {
    activeOrder {
      id
      totalQuantity
      totalWithTax
      currencyCode
      lines {
        id
        quantity
        linePriceWithTax
        productVariant {
          id
          name
          product {
            id
            name
            slug
            featuredAsset {
              preview
              source
            }
          }
        }
      }
    }
    activeCustomer {
      id
      firstName
      lastName
      emailAddress
    }
  }
`;

export async function GET(request: Request) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const incomingCookie = request.headers.get('cookie');
  if (incomingCookie) headers.cookie = incomingCookie;

  try {
    const vendureResponse = await fetch(SHOP_API_URL, {
      method: 'POST',
      headers,
      cache: 'no-store',
      body: JSON.stringify({
        query: SESSION_SUMMARY_QUERY,
      }),
    });

    const json = (await vendureResponse.json().catch(() => ({}))) as GraphResponse<SessionSummaryResponse>;

    if (!vendureResponse.ok || json.errors?.length) {
      const fallback = NextResponse.json({
        authenticated: false,
        totalQuantity: 0,
        customer: null,
        cart: null,
      });
      return withSessionCookie(fallback, vendureResponse);
    }

    const customer = json.data?.activeCustomer ?? null;
    const order = json.data?.activeOrder;

    const response = NextResponse.json({
      authenticated: Boolean(customer?.id),
      totalQuantity: normalizeInt(order?.totalQuantity),
      customer: customer
        ? {
          id: customer.id,
          firstName: customer.firstName ?? null,
          lastName: customer.lastName ?? null,
          emailAddress: customer.emailAddress ?? null,
        }
        : null,
      cart: order
        ? {
          totalWithTax: order.totalWithTax,
          currencyCode: order.currencyCode,
          lines: order.lines?.map((line) => ({
            id: line.id,
            quantity: line.quantity,
            linePriceWithTax: line.linePriceWithTax,
            productVariant: {
              name: line.productVariant?.name,
              product: {
                name: line.productVariant?.product?.name,
                slug: line.productVariant?.product?.slug,
                featuredAsset: line.productVariant?.product?.featuredAsset,
              },
            },
          })) ?? [],
        }
        : null,
    });

    return withSessionCookie(response, vendureResponse);
  } catch {
    return NextResponse.json({
      authenticated: false,
      totalQuantity: 0,
      customer: null,
      cart: null,
    });
  }
}
