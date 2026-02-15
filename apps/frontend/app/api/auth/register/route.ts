import { NextResponse } from 'next/server';
import { type GraphResponse, SHOP_API_URL, withSessionCookie, readJsonBody } from '../../../../lib/api/shopApi';

type RegisterBody = {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
};

type RegisterMutationResult = {
    registerCustomerAccount:
    | { __typename: 'Success'; success: boolean }
    | { __typename: 'MissingPasswordError'; message: string }
    | { __typename: 'PasswordValidationError'; message: string; validationErrorMessage: string }
    | { __typename: 'NativeAuthStrategyError'; message: string };
};

const REGISTER_MUTATION = `
  mutation RegisterCustomerAccount(
    $firstName: String!
    $lastName: String!
    $email: String!
    $password: String!
  ) {
    registerCustomerAccount(input: {
      firstName: $firstName
      lastName: $lastName
      emailAddress: $email
      password: $password
    }) {
      __typename
      ... on Success {
        success
      }
      ... on MissingPasswordError {
        message
      }
      ... on PasswordValidationError {
        message
        validationErrorMessage
      }
      ... on NativeAuthStrategyError {
        message
      }
    }
  }
`;

export async function POST(request: Request) {
    const body = await readJsonBody<RegisterBody>(request);

    if (!body?.firstName?.trim() || !body?.lastName?.trim() || !body?.email?.trim() || !body?.password) {
        return NextResponse.json(
            { success: false, error: 'First name, last name, email, and password are required.' },
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
                query: REGISTER_MUTATION,
                variables: {
                    firstName: body.firstName.trim(),
                    lastName: body.lastName.trim(),
                    email: body.email.trim(),
                    password: body.password,
                },
            }),
        });

        const json = (await vendureResponse.json().catch(() => ({}))) as GraphResponse<RegisterMutationResult>;

        if (!vendureResponse.ok || json.errors?.length) {
            const msg = json.errors?.[0]?.message || 'Registration request failed.';
            return withSessionCookie(
                NextResponse.json({ success: false, error: msg }, { status: 400 }),
                vendureResponse,
            );
        }

        const result = json.data?.registerCustomerAccount;
        if (!result) {
            return NextResponse.json(
                { success: false, error: 'No response from auth server.' },
                { status: 500 },
            );
        }

        if (result.__typename === 'Success') {
            return withSessionCookie(
                NextResponse.json({ success: true }),
                vendureResponse,
            );
        }

        // Any error type
        const errorMessage = 'message' in result ? result.message : 'Registration failed.';
        return withSessionCookie(
            NextResponse.json({ success: false, error: errorMessage }, { status: 400 }),
            vendureResponse,
        );
    } catch {
        return NextResponse.json(
            { success: false, error: 'Unable to reach the authentication server.' },
            { status: 502 },
        );
    }
}
