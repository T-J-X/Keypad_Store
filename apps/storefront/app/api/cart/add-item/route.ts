import { NextResponse } from 'next/server';

const SHOP_API = process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';

type GraphResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type AddItemResponse = {
  addItemToOrder:
    | {
        __typename: 'Order';
        id: string;
        code: string;
      }
    | {
        __typename: string;
        errorCode?: string;
        message?: string;
      };
};

const ADD_ITEM_MUTATION = `
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      __typename
      ... on Order {
        id
        code
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { productVariantId?: string; quantity?: number }
    | null;

  const productVariantId = payload?.productVariantId?.trim();
  const quantity = Number.isInteger(payload?.quantity) && payload?.quantity && payload.quantity > 0
    ? payload.quantity
    : 1;

  if (!productVariantId) {
    return NextResponse.json({ error: 'Missing productVariantId' }, { status: 400 });
  }

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
      query: ADD_ITEM_MUTATION,
      variables: { productVariantId, quantity },
    }),
  });

  const json = (await vendureResponse.json().catch(() => ({}))) as GraphResponse<AddItemResponse>;

  if (!vendureResponse.ok || json.errors?.length) {
    const message = json.errors?.[0]?.message || `Vendure error (${vendureResponse.status})`;
    return withSessionCookie(NextResponse.json({ error: message }, { status: 400 }), vendureResponse);
  }

  const result = json.data?.addItemToOrder;
  if (!result) {
    return withSessionCookie(
      NextResponse.json({ error: 'Vendure response missing addItemToOrder result' }, { status: 400 }),
      vendureResponse,
    );
  }

  if (!('id' in result) || !('code' in result)) {
    const errorMessage = 'message' in result ? (result.message || 'Unable to add item to cart') : 'Unable to add item to cart';
    return withSessionCookie(NextResponse.json({ error: errorMessage }, { status: 400 }), vendureResponse);
  }

  return withSessionCookie(
    NextResponse.json({
      ok: true,
      orderId: result.id,
      orderCode: result.code,
    }),
    vendureResponse,
  );
}

function withSessionCookie(response: NextResponse, vendureResponse: Response) {
  const setCookie = vendureResponse.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }
  return response;
}
