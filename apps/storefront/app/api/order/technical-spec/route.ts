import { NextResponse } from 'next/server';
import {
  validateAndNormalizeConfigurationInput,
  type KeypadConfigurationDraft,
} from '../../../../lib/keypadConfiguration';

const SHOP_API = process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';

const ORDER_EXPORT_QUERY = `
  query OrderPdfExportData($orderCode: String!) {
    orderPdfExportData(orderCode: $orderCode) {
      orderCode
      orderDate
      customerEmail
      customerName
      lines {
        lineId
        quantity
        variantId
        variantName
        variantSku
        configuration
      }
    }
  }
`;

type GraphResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type OrderExportResponse = {
  orderPdfExportData?: {
    orderCode: string;
    orderDate: string;
    customerEmail?: string | null;
    customerName?: string | null;
    lines?: Array<{
      lineId: string;
      quantity: number;
      variantId: string;
      variantName: string;
      variantSku: string;
      configuration: string;
    }>;
  } | null;
};

type TechnicalSpecLine = {
  lineId: string;
  quantity: number;
  variantId: string;
  variantName: string;
  variantSku: string;
  configuration: KeypadConfigurationDraft;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderCode = (url.searchParams.get('orderCode') || '').trim();

  if (!orderCode) {
    return NextResponse.json({ error: 'orderCode is required.' }, { status: 400 });
  }

  const response = await queryShopApi<OrderExportResponse>(request, {
    query: ORDER_EXPORT_QUERY,
    variables: { orderCode },
  });

  if (!response.ok) {
    const normalizedError = response.error.toLowerCase();
    const requiresAuth = normalizedError.includes('forbidden') || normalizedError.includes('not currently authorized');
    const message = requiresAuth
      ? 'Sign in with the account that placed this order to view its technical specification.'
      : response.error;

    return withSessionCookie(
      NextResponse.json({ error: message }, { status: requiresAuth ? 401 : response.status }),
      response.rawResponse,
    );
  }

  const payload = response.data.orderPdfExportData;
  if (!payload) {
    return withSessionCookie(
      NextResponse.json({ error: 'No export data found for this order.' }, { status: 404 }),
      response.rawResponse,
    );
  }

  const lines: TechnicalSpecLine[] = [];

  for (const line of payload.lines ?? []) {
    const parsed = validateAndNormalizeConfigurationInput(line.configuration, { requireComplete: true });
    if (!parsed.ok) {
      continue;
    }

    lines.push({
      lineId: line.lineId,
      quantity: Math.max(1, Math.trunc(line.quantity || 1)),
      variantId: line.variantId,
      variantName: line.variantName,
      variantSku: line.variantSku,
      configuration: parsed.value,
    });
  }

  if (lines.length === 0) {
    return withSessionCookie(
      NextResponse.json({ error: 'No valid configured lines are available for technical specification.' }, { status: 404 }),
      response.rawResponse,
    );
  }

  return withSessionCookie(
    NextResponse.json({
      orderCode: payload.orderCode,
      orderDate: payload.orderDate,
      customerName: payload.customerName ?? payload.customerEmail ?? null,
      lines,
    }),
    response.rawResponse,
  );
}

async function queryShopApi<T>(
  request: Request,
  input: {
    query: string;
    variables?: Record<string, unknown>;
  },
): Promise<
  | {
      ok: true;
      data: T;
      rawResponse: Response;
    }
  | {
      ok: false;
      status: number;
      error: string;
      rawResponse: Response;
    }
> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const incomingCookie = request.headers.get('cookie');
  if (incomingCookie) headers.cookie = incomingCookie;

  const rawResponse = await fetch(SHOP_API, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      query: input.query,
      variables: input.variables,
    }),
  });

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

function withSessionCookie(response: NextResponse, vendureResponse: Response) {
  const setCookie = vendureResponse.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }
  return response;
}
