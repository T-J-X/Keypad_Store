import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  GOOGLE_AUTH_NEXT_COOKIE,
  GOOGLE_AUTH_STATE_COOKIE,
  getGoogleRedirectUri,
  getSafeRelativePath,
} from '../../../../lib/googleAuth';
import { validateMutationRequestOrigin } from '../../../../lib/api/requestSecurity';
import { getRequestBodyErrorMessage, googleAuthBodySchema } from '../../../../lib/api/schemas';
import { type GraphResponse, readJsonBody, SHOP_API_URL, withSessionCookie } from '../../../../lib/api/shopApi';
const STATE_MAX_AGE_SECONDS = 10 * 60;

const AUTHENTICATE_WITH_GOOGLE_MUTATION = `
  mutation AuthenticateWithGoogle($token: String, $code: String, $redirectUri: String) {
    authenticate(input: { google: { token: $token, code: $code, redirectUri: $redirectUri } }) {
      __typename
      ... on CurrentUser {
        id
        identifier
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;



type AuthenticateWithGoogleResponse = {
  authenticate:
  | {
    __typename: 'CurrentUser';
    id: string;
    identifier?: string | null;
  }
  | {
    __typename: string;
    errorCode?: string;
    message?: string;
  };
};

export async function GET(request: NextRequest) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (!googleClientId) {
    return NextResponse.redirect(new URL('/login?authError=google_not_configured', request.nextUrl.origin));
  }

  const nextPath = getSafeRelativePath(request.nextUrl.searchParams.get('next'), '/account');
  const state = randomUUID();
  const redirectUri = getGoogleRedirectUri(request.nextUrl.origin);

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', googleClientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(authUrl);

  const secureCookie = request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production';
  const cookieBase = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: secureCookie,
    maxAge: STATE_MAX_AGE_SECONDS,
  };

  response.cookies.set(GOOGLE_AUTH_STATE_COOKIE, state, cookieBase);
  response.cookies.set(GOOGLE_AUTH_NEXT_COOKIE, nextPath, cookieBase);

  return response;
}

export async function POST(request: Request) {
  const originError = validateMutationRequestOrigin(request);
  if (originError) return originError;

  const parsedBody = googleAuthBodySchema.safeParse(await readJsonBody<unknown>(request));
  if (!parsedBody.success) {
    return NextResponse.json({ error: getRequestBodyErrorMessage(parsedBody.error) }, { status: 400 });
  }

  const token = parsedBody.data.token || null;
  const code = parsedBody.data.code || null;
  const redirectUri = parsedBody.data.redirectUri || null;

  const vendureResponse = await authenticateWithVendure(request, { token, code, redirectUri });
  const json = (await vendureResponse.json().catch(() => ({}))) as GraphResponse<AuthenticateWithGoogleResponse>;

  if (!vendureResponse.ok || json.errors?.length) {
    const message = json.errors?.[0]?.message || `Vendure error (${vendureResponse.status})`;
    return withSessionCookie(NextResponse.json({ error: message }, { status: 400 }), vendureResponse);
  }

  const result = json.data?.authenticate;
  if (!result) {
    return withSessionCookie(
      NextResponse.json({ error: 'Vendure response missing authenticate result' }, { status: 400 }),
      vendureResponse,
    );
  }

  if (!('id' in result)) {
    const message = 'message' in result ? (result.message || 'Google sign-in failed') : 'Google sign-in failed';
    return withSessionCookie(NextResponse.json({ error: message }, { status: 400 }), vendureResponse);
  }

  return withSessionCookie(
    NextResponse.json({ ok: true, customerId: result.id, identifier: result.identifier ?? null }),
    vendureResponse,
  );
}

function authenticateWithVendure(
  request: Request,
  input: { token: string | null; code: string | null; redirectUri: string | null },
) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const incomingCookie = request.headers.get('cookie');
  if (incomingCookie) headers.cookie = incomingCookie;

  return fetch(SHOP_API_URL, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      query: AUTHENTICATE_WITH_GOOGLE_MUTATION,
      variables: {
        token: input.token,
        code: input.code,
        redirectUri: input.redirectUri,
      },
    }),
  });
}
