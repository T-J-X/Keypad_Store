import { NextResponse } from 'next/server';

const SHOP_API = process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';

const ADJUST_ORDER_LINE_MUTATION = `
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      __typename
      ... on Order {
        id
        code
        totalQuantity
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const REMOVE_ORDER_LINE_MUTATION = `
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      __typename
      ... on Order {
        id
        code
        totalQuantity
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

type GraphResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type OrderSuccessResult = {
  __typename: 'Order';
  id: string;
  code: string;
  totalQuantity?: number | null;
};

type OrderErrorResult = {
  __typename: string;
  errorCode?: string;
  message?: string;
};

type AdjustOrderLineResponse = {
  adjustOrderLine: OrderSuccessResult | OrderErrorResult;
};

type RemoveOrderLineResponse = {
  removeOrderLine: OrderSuccessResult | OrderErrorResult;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { orderLineId?: string; quantity?: number }
    | null;

  const orderLineId = payload?.orderLineId?.trim();
  const quantity = typeof payload?.quantity === 'number' && Number.isFinite(payload.quantity)
    ? Math.floor(payload.quantity)
    : NaN;

  if (!orderLineId) {
    return NextResponse.json({ error: 'Missing orderLineId' }, { status: 400 });
  }

  if (!Number.isInteger(quantity)) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const incomingCookie = request.headers.get('cookie');
  if (incomingCookie) headers.cookie = incomingCookie;

  const isRemove = quantity <= 0;

  const vendureResponse = await fetch(SHOP_API, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      query: isRemove ? REMOVE_ORDER_LINE_MUTATION : ADJUST_ORDER_LINE_MUTATION,
      variables: isRemove ? { orderLineId } : { orderLineId, quantity },
    }),
  });

  const json = (await vendureResponse.json().catch(() => ({}))) as GraphResponse<
    AdjustOrderLineResponse | RemoveOrderLineResponse
  >;

  if (!vendureResponse.ok || json.errors?.length) {
    const message = json.errors?.[0]?.message || `Vendure error (${vendureResponse.status})`;
    return withSessionCookie(NextResponse.json({ error: message }, { status: 400 }), vendureResponse);
  }

  const result = isRemove
    ? (json.data as RemoveOrderLineResponse | undefined)?.removeOrderLine
    : (json.data as AdjustOrderLineResponse | undefined)?.adjustOrderLine;

  if (!result) {
    return withSessionCookie(
      NextResponse.json({ error: 'Vendure response missing order line update result' }, { status: 400 }),
      vendureResponse,
    );
  }

  if (!('id' in result) || !('code' in result)) {
    const message = 'message' in result ? (result.message || 'Unable to update cart line') : 'Unable to update cart line';
    return withSessionCookie(NextResponse.json({ error: message }, { status: 400 }), vendureResponse);
  }

  return withSessionCookie(
    NextResponse.json({
      ok: true,
      orderId: result.id,
      orderCode: result.code,
      totalQuantity: normalizeInt(result.totalQuantity),
    }),
    vendureResponse,
  );
}

function normalizeInt(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function withSessionCookie(response: NextResponse, vendureResponse: Response) {
  const setCookie = vendureResponse.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }
  return response;
}
