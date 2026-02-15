import { NextResponse } from 'next/server';
import { type GraphResponse, SHOP_API_URL, withSessionCookie, readJsonBody } from '../../../../lib/api/shopApi';

type LoginBody = {
    email?: string;
    password?: string;
};

type LoginMutationResult = {
    login:
    | { __typename: 'CurrentUser'; id: string }
    | { __typename: 'InvalidCredentialsError'; message: string; authenticationError: string }
    | { __typename: 'NativeAuthStrategyError'; message: string }
    | { __typename: 'NotVerifiedError'; message: string };
};

type ActiveCustomerResult = {
    activeCustomer?: {
        id: string;
        firstName?: string | null;
        lastName?: string | null;
    } | null;
};

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(username: $email, password: $password) {
      __typename
      ... on CurrentUser {
        id
      }
      ... on InvalidCredentialsError {
        message
        authenticationError
      }
      ... on NativeAuthStrategyError {
        message
      }
      ... on NotVerifiedError {
        message
      }
    }
  }
`;

const ACTIVE_CUSTOMER_QUERY = `
  query ActiveCustomer {
    activeCustomer {
      id
      firstName
      lastName
    }
  }
`;

export async function POST(request: Request) {
    const body = await readJsonBody<LoginBody>(request);
    if (!body?.email || !body?.password) {
        return NextResponse.json(
            { success: false, error: 'Email and password are required.' },
            { status: 400 },
        );
    }

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
                query: LOGIN_MUTATION,
                variables: { email: body.email, password: body.password },
            }),
        });

        const json = (await vendureResponse.json().catch(() => ({}))) as GraphResponse<LoginMutationResult>;

        if (!vendureResponse.ok || json.errors?.length) {
            const msg = json.errors?.[0]?.message || 'Login request failed.';
            return withSessionCookie(
                NextResponse.json({ success: false, error: msg }, { status: 400 }),
                vendureResponse,
            );
        }

        const result = json.data?.login;
        if (!result) {
            return NextResponse.json({ success: false, error: 'No response from auth server.' }, { status: 500 });
        }

        if (result.__typename === 'CurrentUser') {
            // Fetch customer profile using the freshly-issued session cookie
            let firstName: string | null = null;
            let lastName: string | null = null;
            try {
                const sessionCookie = vendureResponse.headers.get('set-cookie');
                const customerHeaders: Record<string, string> = {
                    'content-type': 'application/json',
                };
                // Forward both the original cookie and any new session cookie from login
                const cookieParts: string[] = [];
                if (incomingCookie) cookieParts.push(incomingCookie);
                if (sessionCookie) {
                    // Extract just the cookie value from the Set-Cookie header
                    const cookieValue = sessionCookie.split(';')[0];
                    if (cookieValue) cookieParts.push(cookieValue);
                }
                if (cookieParts.length > 0) customerHeaders.cookie = cookieParts.join('; ');

                const customerResponse = await fetch(SHOP_API_URL, {
                    method: 'POST',
                    headers: customerHeaders,
                    cache: 'no-store',
                    body: JSON.stringify({ query: ACTIVE_CUSTOMER_QUERY }),
                });
                const customerJson = (await customerResponse.json().catch(() => ({}))) as GraphResponse<ActiveCustomerResult>;
                firstName = customerJson.data?.activeCustomer?.firstName ?? null;
                lastName = customerJson.data?.activeCustomer?.lastName ?? null;
            } catch {
                // Non-critical — welcome message just won't have a name
            }

            return withSessionCookie(
                NextResponse.json({ success: true, userId: result.id, firstName, lastName }),
                vendureResponse,
            );
        }

        // Any error type
        const errorMessage = 'message' in result ? result.message : 'Authentication failed.';
        return withSessionCookie(
            NextResponse.json({ success: false, error: errorMessage }, { status: 401 }),
            vendureResponse,
        );
    } catch {
        return NextResponse.json(
            { success: false, error: 'Unable to reach the authentication server.' },
            { status: 502 },
        );
    }
}
