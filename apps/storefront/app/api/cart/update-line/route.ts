import { NextResponse } from 'next/server';
import { validateMutationRequestOrigin } from '../../../../lib/api/requestSecurity';
import { readJsonBody, SHOP_API_URL, withSessionCookie } from '../../../../lib/api/shopApi';
import {
  serializeConfiguration,
  validateAndNormalizeConfigurationInput,
} from '../../../../lib/keypadConfiguration';

const ADJUST_ORDER_LINE_MUTATION = `
  mutation AdjustOrderLine(
    $orderLineId: ID!
    $quantity: Int!
    $customFields: OrderLineCustomFieldsInput
  ) {
    adjustOrderLine(
      orderLineId: $orderLineId
      quantity: $quantity
      customFields: $customFields
    ) {
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
  const originError = validateMutationRequestOrigin(request);
  if (originError) return originError;

  const payload = await readJsonBody<{ orderLineId?: string; quantity?: number; configuration?: unknown }>(request);

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

  let customFields: { configuration: string } | undefined;
  if (payload?.configuration !== undefined && quantity > 0) {
    const validation = validateAndNormalizeConfigurationInput(payload.configuration, { requireComplete: true });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    customFields = {
      configuration: serializeConfiguration(validation.value),
    };
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const incomingCookie = request.headers.get('cookie');
  if (incomingCookie) headers.cookie = incomingCookie;

  const isRemove = quantity <= 0;

  const vendureResponse = await fetch(SHOP_API_URL, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      query: isRemove ? REMOVE_ORDER_LINE_MUTATION : ADJUST_ORDER_LINE_MUTATION,
      variables: isRemove ? { orderLineId } : { orderLineId, quantity, customFields },
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
