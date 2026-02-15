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
            return withSessionCookie(
                NextResponse.json({ success: true, userId: result.id }),
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
