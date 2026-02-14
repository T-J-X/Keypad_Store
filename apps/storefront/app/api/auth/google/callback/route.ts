import { NextRequest, NextResponse } from 'next/server';
import {
  GOOGLE_AUTH_NEXT_COOKIE,
  GOOGLE_AUTH_STATE_COOKIE,
  getGoogleRedirectUri,
  getSafeRelativePath,
} from '../../../../../lib/googleAuth';
import { type GraphResponse, SHOP_API_URL, withSessionCookie } from '../../../../../lib/api/shopApi';

const AUTHENTICATE_WITH_GOOGLE_MUTATION = `
  mutation AuthenticateWithGoogle($token: String, $code: String, $redirectUri: String) {
    authenticate(input: { google: { token: $token, code: $code, redirectUri: $redirectUri } }) {
      __typename
      ... on CurrentUser {
        id
      }
      ... on ErrorResult {
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
  }
  | {
    __typename: string;
    message?: string;
  };
};

export async function GET(request: NextRequest) {
  const stateFromQuery = request.nextUrl.searchParams.get('state')?.trim() || '';
  const stateFromCookie = request.cookies.get(GOOGLE_AUTH_STATE_COOKIE)?.value || '';

  const nextPath = getSafeRelativePath(request.cookies.get(GOOGLE_AUTH_NEXT_COOKIE)?.value, '/account');

  const redirectToLogin = (errorCode: string) => {
    const response = NextResponse.redirect(new URL(`/login?authError=${encodeURIComponent(errorCode)}`, request.nextUrl.origin));
    clearOauthCookies(response);
    return response;
  };

  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    return redirectToLogin('google_state_mismatch');
  }

  const oauthError = request.nextUrl.searchParams.get('error')?.trim();
  if (oauthError) {
    return redirectToLogin(`google_${oauthError}`);
  }

  const code = request.nextUrl.searchParams.get('code')?.trim() || null;
  const token = request.nextUrl.searchParams.get('credential')?.trim()
    || request.nextUrl.searchParams.get('token')?.trim()
    || null;

  if (!code && !token) {
    return redirectToLogin('google_missing_code');
  }

  const redirectUri = getGoogleRedirectUri(request.nextUrl.origin);

  const vendureResponse = await authenticateWithVendure(request, {
    code,
    token,
    redirectUri,
  });

  const json = (await vendureResponse.json().catch(() => ({}))) as GraphResponse<AuthenticateWithGoogleResponse>;

  if (!vendureResponse.ok || json.errors?.length) {
    return redirectToLogin('google_authenticate_failed');
  }

  const result = json.data?.authenticate;
  if (!result || !('id' in result)) {
    return redirectToLogin('google_authenticate_denied');
  }

  const response = NextResponse.redirect(new URL(nextPath, request.nextUrl.origin));
  clearOauthCookies(response);
  return withSessionCookie(response, vendureResponse);
}

function authenticateWithVendure(
  request: NextRequest,
  input: { token: string | null; code: string | null; redirectUri: string },
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

function clearOauthCookies(response: NextResponse) {
  response.cookies.delete(GOOGLE_AUTH_STATE_COOKIE);
  response.cookies.delete(GOOGLE_AUTH_NEXT_COOKIE);
}
