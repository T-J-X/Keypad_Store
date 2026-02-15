import { NextResponse } from 'next/server';
import { validateMutationRequestOrigin } from '../../../../lib/api/requestSecurity';
import { checkoutSubmitBodySchema, getRequestBodyErrorMessage } from '../../../../lib/api/schemas';
import { type GraphResponse, readJsonBody, SHOP_API_URL } from '../../../../lib/api/shopApi';
const PREFERRED_PAYMENT_CODES = ['standard-payment', 'test-card-processor', 'dummy-payment-handler'] as const;

const SET_CUSTOMER_FOR_ORDER_MUTATION = `
  mutation SetCustomerForOrder($input: CreateCustomerInput!) {
    setCustomerForOrder(input: $input) {
      __typename
      ... on Order {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const SET_ORDER_SHIPPING_ADDRESS_MUTATION = `
  mutation SetOrderShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      __typename
      ... on Order {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const SET_ORDER_BILLING_ADDRESS_MUTATION = `
  mutation SetOrderBillingAddress($input: CreateAddressInput!) {
    setOrderBillingAddress(input: $input) {
      __typename
      ... on Order {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const ELIGIBLE_SHIPPING_METHODS_QUERY = `
  query EligibleShippingMethods {
    eligibleShippingMethods {
      id
      code
      name
    }
  }
`;

const SET_ORDER_SHIPPING_METHOD_MUTATION = `
  mutation SetOrderShippingMethod($shippingMethodId: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      __typename
      ... on Order {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const ELIGIBLE_PAYMENT_METHODS_QUERY = `
  query EligiblePaymentMethods {
    eligiblePaymentMethods {
      code
      name
      isEligible
      eligibilityMessage
    }
  }
`;

const NEXT_ORDER_STATES_QUERY = `
  query NextOrderStates {
    nextOrderStates
  }
`;

const TRANSITION_ORDER_TO_STATE_MUTATION = `
  mutation TransitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      __typename
      ... on Order {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

const ADD_PAYMENT_TO_ORDER_MUTATION = `
  mutation AddPaymentToOrder($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      __typename
      ... on Order {
        id
        code
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;


type ErrorResultLike = {
  __typename: string;
  errorCode?: string | null;
  message?: string | null;
};

type OrderLike = {
  __typename: 'Order';
  id?: string;
  code?: string;
  state?: string | null;
};

class CheckoutStepError extends Error {
  constructor(
    public readonly step: string,
    message: string,
    public readonly errorCode?: string,
  ) {
    super(message);
  }
}

export async function POST(request: Request) {
  const originError = validateMutationRequestOrigin(request);
  if (originError) return originError;

  const parsedBody = checkoutSubmitBodySchema.safeParse(await readJsonBody<unknown>(request));
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: getRequestBodyErrorMessage(
          parsedBody.error,
          'Missing required checkout fields (contact and shipping address).',
        ),
        errorCode: 'CHECKOUT_VALIDATION_ERROR',
        step: 'validation',
      },
      { status: 400 },
    );
  }

  const emailAddress = parsedBody.data.emailAddress.toLowerCase();
  const firstName = parsedBody.data.firstName;
  const lastName = parsedBody.data.lastName;
  const phoneNumber = parsedBody.data.phoneNumber || '';
  const streetLine1 = parsedBody.data.streetLine1;
  const streetLine2 = parsedBody.data.streetLine2 || '';
  const city = parsedBody.data.city;
  const province = parsedBody.data.province || '';
  const postalCode = parsedBody.data.postalCode;
  const countryCode = parsedBody.data.countryCode.toUpperCase();
  const requestedShippingMethodId = parsedBody.data.shippingMethodId || '';
  const requestedPaymentMethodCode = parsedBody.data.paymentMethodCode || '';

  const cookieJar = parseCookieHeader(request.headers.get('cookie'));
  let latestSetCookie: string | null = null;

  const run = async <T>(query: string, variables?: Record<string, unknown>) => {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    const cookieHeader = serializeCookieHeader(cookieJar);
    if (cookieHeader) headers.cookie = cookieHeader;

    const vendureResponse = await fetch(SHOP_API_URL, {
      method: 'POST',
      headers,
      cache: 'no-store',
      body: JSON.stringify({ query, variables }),
    });

    const setCookie = vendureResponse.headers.get('set-cookie');
    if (setCookie) {
      latestSetCookie = setCookie;
      applySetCookie(cookieJar, setCookie);
    }

    const json = (await vendureResponse.json().catch(() => ({}))) as GraphResponse<T>;

    if (!vendureResponse.ok || json.errors?.length) {
      throw new CheckoutStepError(
        'vendure-request',
        json.errors?.[0]?.message || `Vendure error (${vendureResponse.status})`,
        'VENDURE_REQUEST_ERROR',
      );
    }

    return json.data;
  };

  try {
    const setCustomer = await run<{ setCustomerForOrder?: OrderLike | ErrorResultLike }>(
      SET_CUSTOMER_FOR_ORDER_MUTATION,
      {
        input: {
          emailAddress,
          firstName,
          lastName,
          phoneNumber: phoneNumber || null,
        },
      },
    );

    assertSuccessOrAllowed(
      setCustomer?.setCustomerForOrder,
      'set-customer',
      ['AlreadyLoggedInError'],
      'Could not set customer details for order.',
    );

    const addressInput = {
      fullName: `${firstName} ${lastName}`.trim(),
      streetLine1,
      streetLine2: streetLine2 || null,
      city,
      province: province || null,
      postalCode,
      countryCode,
      phoneNumber: phoneNumber || null,
    };

    const shippingAddress = await run<{ setOrderShippingAddress?: OrderLike | ErrorResultLike }>(
      SET_ORDER_SHIPPING_ADDRESS_MUTATION,
      { input: addressInput },
    );

    assertSuccess(shippingAddress?.setOrderShippingAddress, 'set-shipping-address', 'Could not set shipping address.');

    const billingAddress = await run<{ setOrderBillingAddress?: OrderLike | ErrorResultLike }>(
      SET_ORDER_BILLING_ADDRESS_MUTATION,
      { input: addressInput },
    );

    assertSuccess(billingAddress?.setOrderBillingAddress, 'set-billing-address', 'Could not set billing address.');

    const eligibleShipping = await run<{
      eligibleShippingMethods?: Array<{ id?: string | null; code?: string | null; name?: string | null }>;
    }>(ELIGIBLE_SHIPPING_METHODS_QUERY);

    const shippingMethods = (eligibleShipping?.eligibleShippingMethods ?? [])
      .map((method) => ({
        id: normalizeString(method.id),
        code: normalizeString(method.code),
        name: normalizeString(method.name),
      }))
      .filter((method) => method.id.length > 0);

    if (shippingMethods.length === 0) {
      throw new CheckoutStepError('set-shipping-method', 'No eligible shipping methods are available for this order.', 'NO_ELIGIBLE_SHIPPING_METHODS');
    }

    const selectedShippingMethodId = resolveShippingMethodId(
      shippingMethods.map((method) => method.id),
      requestedShippingMethodId,
    );

    const setShippingMethod = await run<{ setOrderShippingMethod?: OrderLike | ErrorResultLike }>(
      SET_ORDER_SHIPPING_METHOD_MUTATION,
      { shippingMethodId: [selectedShippingMethodId] },
    );

    assertSuccess(setShippingMethod?.setOrderShippingMethod, 'set-shipping-method', 'Could not set shipping method.');

    const eligiblePayment = await run<{
      eligiblePaymentMethods?: Array<{ code?: string | null; isEligible?: boolean | null; eligibilityMessage?: string | null }>;
    }>(ELIGIBLE_PAYMENT_METHODS_QUERY);

    const eligiblePaymentCodes = (eligiblePayment?.eligiblePaymentMethods ?? [])
      .filter((method) => method.isEligible !== false)
      .map((method) => normalizeString(method.code))
      .filter(Boolean);

    if (eligiblePaymentCodes.length === 0) {
      throw new CheckoutStepError('add-payment', 'No eligible payment methods are available for this order.', 'NO_ELIGIBLE_PAYMENT_METHODS');
    }

    const selectedPaymentMethodCode = resolvePaymentMethodCode(eligiblePaymentCodes, requestedPaymentMethodCode);

    const nextStates = await run<{ nextOrderStates?: string[] }>(NEXT_ORDER_STATES_QUERY);
    if ((nextStates?.nextOrderStates ?? []).includes('ArrangingPayment')) {
      const transition = await run<{ transitionOrderToState?: OrderLike | ErrorResultLike }>(
        TRANSITION_ORDER_TO_STATE_MUTATION,
        { state: 'ArrangingPayment' },
      );
      assertSuccess(transition?.transitionOrderToState, 'transition-order-state', 'Could not transition order to payment state.');
    }

    const paymentResult = await run<{
      addPaymentToOrder?: (OrderLike & { code?: string }) | ErrorResultLike;
    }>(ADD_PAYMENT_TO_ORDER_MUTATION, {
      input: {
        method: selectedPaymentMethodCode,
        metadata: {
          strategy: 'standard-payment',
          source: 'frontend-checkout',
          emailAddress,
          timestamp: new Date().toISOString(),
        },
      },
    });

    const paymentOrder = assertSuccess(paymentResult?.addPaymentToOrder, 'add-payment', 'Payment could not be applied to order.');

    if (!paymentOrder.code) {
      throw new CheckoutStepError('add-payment', 'Payment was accepted but order code is missing.', 'MISSING_ORDER_CODE');
    }

    const response = NextResponse.json({
      ok: true,
      orderCode: paymentOrder.code,
      paymentMethodCode: selectedPaymentMethodCode,
      orderState: paymentOrder.state || null,
      shippingMethodId: selectedShippingMethodId,
    });

    return withSessionCookie(response, latestSetCookie);
  } catch (error) {
    const stepError = error instanceof CheckoutStepError
      ? error
      : new CheckoutStepError('checkout', error instanceof Error ? error.message : 'Checkout could not be completed.', 'CHECKOUT_ERROR');

    const response = NextResponse.json(
      {
        error: stepError.message,
        errorCode: stepError.errorCode || 'CHECKOUT_ERROR',
        step: stepError.step,
      },
      { status: 400 },
    );

    return withSessionCookie(response, latestSetCookie);
  }
}

function assertSuccess<T extends OrderLike>(
  result: T | ErrorResultLike | null | undefined,
  step: string,
  fallbackMessage: string,
) {
  if (result && result.__typename === 'Order') {
    return result as T;
  }

  throw toCheckoutStepError(step, result, fallbackMessage);
}

function assertSuccessOrAllowed(
  result: OrderLike | ErrorResultLike | null | undefined,
  step: string,
  allowedTypenames: string[],
  fallbackMessage: string,
) {
  if (!result) {
    throw new CheckoutStepError(step, fallbackMessage, 'EMPTY_RESULT');
  }

  if (result.__typename === 'Order' || allowedTypenames.includes(result.__typename)) {
    return result;
  }

  throw toCheckoutStepError(step, result, fallbackMessage);
}

function toCheckoutStepError(
  step: string,
  result: ErrorResultLike | { __typename?: string } | null | undefined,
  fallbackMessage: string,
) {
  const errorCode = normalizeString((result as ErrorResultLike | null | undefined)?.errorCode)
    || normalizeString(result?.__typename)
    || 'VENDURE_ERROR';
  const message = normalizeString((result as ErrorResultLike | null | undefined)?.message) || fallbackMessage;

  return new CheckoutStepError(step, message, errorCode);
}

function resolvePaymentMethodCode(eligibleCodes: string[], requestedCode: string) {
  if (requestedCode && eligibleCodes.includes(requestedCode)) {
    return requestedCode;
  }

  for (const preferredCode of PREFERRED_PAYMENT_CODES) {
    if (eligibleCodes.includes(preferredCode)) {
      return preferredCode;
    }
  }

  return eligibleCodes[0];
}

function resolveShippingMethodId(eligibleIds: string[], requestedId: string) {
  if (requestedId && eligibleIds.includes(requestedId)) {
    return requestedId;
  }

  if (requestedId) {
    throw new CheckoutStepError(
      'set-shipping-method',
      'Selected shipping method is not available for this order.',
      'INVALID_SHIPPING_METHOD',
    );
  }

  return eligibleIds[0];
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseCookieHeader(header: string | null) {
  const map = new Map<string, string>();
  if (!header) return map;

  for (const part of header.split(';')) {
    const [name, ...valueParts] = part.split('=');
    const key = (name || '').trim();
    if (!key) continue;
    map.set(key, valueParts.join('=').trim());
  }

  return map;
}

function serializeCookieHeader(cookieJar: Map<string, string>) {
  if (cookieJar.size === 0) return '';
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function applySetCookie(cookieJar: Map<string, string>, setCookieHeader: string) {
  const firstCookie = setCookieHeader.split(';')[0];
  const [rawName, ...rawValueParts] = firstCookie.split('=');
  const name = (rawName || '').trim();
  if (!name) return;

  cookieJar.set(name, rawValueParts.join('=').trim());
}

/**
 * Local variant of `withSessionCookie` that accepts a raw set-cookie header
 * string (accumulated from the multi-step cookie jar) rather than a Response
 * object. This differs from the shared `shopApi.withSessionCookie` signature.
 */
function withSessionCookie(response: NextResponse, setCookieHeader: string | null) {
  if (setCookieHeader) {
    response.headers.set('set-cookie', setCookieHeader);
  }
  return response;
}
