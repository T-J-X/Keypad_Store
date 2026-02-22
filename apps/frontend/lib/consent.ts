export const COOKIE_CONSENT_KEY = 'cookie-consent';
export const COOKIE_CONSENT_UPDATED_EVENT = 'kp:cookie-consent-updated';

export type CookieConsent = 'accepted' | 'rejected' | null;

function normalizeConsent(value: string | null): CookieConsent {
  if (value === 'accepted') return 'accepted';
  if (value === 'rejected') return 'rejected';
  return null;
}

function emitConsentUpdated(consent: CookieConsent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, {
      detail: { consent },
    }),
  );
}

export function getCookieConsent(): CookieConsent {
  if (typeof window === 'undefined') return null;
  return normalizeConsent(window.localStorage.getItem(COOKIE_CONSENT_KEY));
}

export function setCookieConsent(consent: Exclude<CookieConsent, null>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COOKIE_CONSENT_KEY, consent);
  emitConsentUpdated(consent);
}

export function clearCookieConsent() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(COOKIE_CONSENT_KEY);
  emitConsentUpdated(null);
}
