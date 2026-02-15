const DEV_FALLBACK_SITE_URL = 'http://localhost:3001';
const PROD_FALLBACK_SITE_URL = 'https://keypad-store.invalid';

function normalizeUrl(raw?: string | null) {
  const value = raw?.trim();
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function fromVercelUrl() {
  const raw = normalizeUrl(process.env.VERCEL_URL);
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw}`;
}

export function resolvePublicSiteUrl() {
  return (
    normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    fromVercelUrl() ||
    (process.env.NODE_ENV === 'production' ? PROD_FALLBACK_SITE_URL : DEV_FALLBACK_SITE_URL)
  );
}

export function resolveMetadataBase() {
  return new URL(resolvePublicSiteUrl());
}
