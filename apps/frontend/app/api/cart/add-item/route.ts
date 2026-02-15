import { NextResponse } from 'next/server';
import { validateMutationRequestOrigin } from '../../../../lib/api/requestSecurity';
import { cartAddItemBodySchema, getRequestBodyErrorMessage } from '../../../../lib/api/schemas';
import { type GraphResponse, readJsonBody, SHOP_API_URL, withSessionCookie } from '../../../../lib/api/shopApi';
import {
  serializeConfiguration,
  validateAndNormalizeConfigurationInput,
} from '../../../../lib/keypadConfiguration';



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
  mutation AddItemToOrder(
    $productVariantId: ID!
    $quantity: Int!
    $customFields: OrderLineCustomFieldsInput
  ) {
    addItemToOrder(
      productVariantId: $productVariantId
      quantity: $quantity
      customFields: $customFields
    ) {
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
  const originError = validateMutationRequestOrigin(request);
  if (originError) return originError;

  const parsedBody = cartAddItemBodySchema.safeParse(await readJsonBody<unknown>(request));
  if (!parsedBody.success) {
    return NextResponse.json({ error: getRequestBodyErrorMessage(parsedBody.error) }, { status: 400 });
  }

  const { productVariantId, quantity, customFields: parsedCustomFields } = parsedBody.data;

  let customFields: { configuration: string } | undefined;
  const rawConfiguration = parsedCustomFields?.configuration;

  if (rawConfiguration !== undefined) {
    const validation = validateAndNormalizeConfigurationInput(rawConfiguration, { requireComplete: true });
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

  const vendureResponse = await fetch(SHOP_API_URL, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      query: ADD_ITEM_MUTATION,
      variables: { productVariantId, quantity, customFields },
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
