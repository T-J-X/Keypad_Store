import { NextResponse } from 'next/server';
import { validateMutationRequestOrigin } from '../../../../lib/api/requestSecurity';
import { withSessionCookie } from '../../../../lib/api/shopApi';

const SHOP_API = process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';

type GraphResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type LogoutResponse = {
  logout?: boolean | null;
};

const LOGOUT_MUTATION = `
  mutation Logout {
    logout
  }
`;

export async function POST(request: Request) {
  const originError = validateMutationRequestOrigin(request);
  if (originError) return originError;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const incomingCookie = request.headers.get('cookie');
  if (incomingCookie) headers.cookie = incomingCookie;

  const vendureResponse = await fetch(SHOP_API, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      query: LOGOUT_MUTATION,
    }),
  });

  const json = (await vendureResponse.json().catch(() => ({}))) as GraphResponse<LogoutResponse>;

  if (!vendureResponse.ok || json.errors?.length) {
    const message = json.errors?.[0]?.message || `Vendure error (${vendureResponse.status})`;
    return withSessionCookie(NextResponse.json({ error: message }, { status: 400 }), vendureResponse);
  }

  return withSessionCookie(NextResponse.json({ ok: true }), vendureResponse);
}
