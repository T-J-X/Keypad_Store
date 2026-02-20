import { NextResponse } from 'next/server';

const DEFAULT_SHOP_API_URL = 'http://localhost:3000/shop-api';

export const SHOP_API_URL = process.env.VENDURE_SHOP_API_URL || DEFAULT_SHOP_API_URL;

export type GraphResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type ShopApiResult<T> =
  | {
    ok: true;
    data: T;
    rawResponse: Response;
  }
  | {
    ok: false;
    status: number;
    error: string;
    rawResponse: Response | null;
  };

type ShopApiInput = {
  query: string;
  variables?: Record<string, unknown>;
};

export async function queryShopApi<T>(request: Request, input: ShopApiInput): Promise<ShopApiResult<T>> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const incomingCookie = request.headers.get('cookie');
  if (incomingCookie) headers.cookie = incomingCookie;

  let rawResponse: Response;
  try {
    rawResponse = await fetch(SHOP_API_URL, {
      method: 'POST',
      headers,
      cache: 'no-store',
      body: JSON.stringify({
        query: input.query,
        variables: input.variables,
      }),
    });
  } catch {
    return {
      ok: false,
      status: 502,
      error: 'Unable to reach the commerce backend.',
      rawResponse: null,
    };
  }

  const json = (await rawResponse.json().catch(() => ({}))) as GraphResponse<T>;

  if (!rawResponse.ok || json.errors?.length || !json.data) {
    const message = json.errors?.[0]?.message || `Vendure error (${rawResponse.status})`;
    return {
      ok: false,
      status: rawResponse.ok ? 400 : rawResponse.status,
      error: message,
      rawResponse,
    };
  }

  return {
    ok: true,
    data: json.data,
    rawResponse,
  };
}

export function withSessionCookie(response: NextResponse, vendureResponse: Response | null | undefined) {
  if (!vendureResponse) return response;

  const setCookie = vendureResponse.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }
  return response;
}

export async function readJsonBody<T>(request: Request) {
  return (await request.json().catch(() => null)) as T | null;
}

/** Clamp an unknown value to a non-negative integer (defaults to 0). */
export function normalizeInt(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}
