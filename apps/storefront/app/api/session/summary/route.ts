import { NextResponse } from 'next/server';
import { withSessionCookie } from '../../../../lib/api/shopApi';

const SHOP_API = process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';

type GraphResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type SessionSummaryResponse = {
  activeOrder?: {
    id: string;
    totalQuantity?: number | null;
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
    const vendureResponse = await fetch(SHOP_API, {
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
      });
      return withSessionCookie(fallback, vendureResponse);
    }

    const totalQuantity = Number(json.data?.activeOrder?.totalQuantity ?? 0);
    const customer = json.data?.activeCustomer ?? null;

    const response = NextResponse.json({
      authenticated: Boolean(customer?.id),
      totalQuantity: Number.isFinite(totalQuantity) ? Math.max(0, Math.floor(totalQuantity)) : 0,
      customer: customer
        ? {
          id: customer.id,
          firstName: customer.firstName ?? null,
          lastName: customer.lastName ?? null,
          emailAddress: customer.emailAddress ?? null,
        }
        : null,
    });

    return withSessionCookie(response, vendureResponse);
  } catch {
    return NextResponse.json({
      authenticated: false,
      totalQuantity: 0,
      customer: null,
    });
  }
}
