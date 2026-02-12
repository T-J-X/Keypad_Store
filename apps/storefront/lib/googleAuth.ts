export const GOOGLE_AUTH_STATE_COOKIE = 'kp_google_oauth_state';
export const GOOGLE_AUTH_NEXT_COOKIE = 'kp_google_oauth_next';
export const GOOGLE_AUTH_CALLBACK_PATH = '/api/auth/google/callback';

export function getSafeRelativePath(input: string | null | undefined, fallback = '/account') {
  if (!input) return fallback;

  try {
    const parsed = new URL(input, 'http://localhost');
    if (parsed.origin !== 'http://localhost') return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function getGoogleRedirectUri(origin: string) {
  const configured = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (configured) return configured;
  return `${origin}${GOOGLE_AUTH_CALLBACK_PATH}`;
}
