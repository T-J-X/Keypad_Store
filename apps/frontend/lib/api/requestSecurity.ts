import { NextResponse } from 'next/server';

function firstHeaderValue(value: string | null) {
  if (!value) return '';
  return value.split(',')[0]?.trim() ?? '';
}

function expectedOriginForRequest(request: Request) {
  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
  const host = forwardedHost || firstHeaderValue(request.headers.get('host'));
  if (!host) return '';

  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'));
  const protocol = forwardedProto || new URL(request.url).protocol.replace(':', '');
  if (!protocol) return '';

  return `${protocol}://${host}`;
}

function originFromRequest(request: Request) {
  const origin = firstHeaderValue(request.headers.get('origin'));
  if (origin) return origin;

  const referer = firstHeaderValue(request.headers.get('referer'));
  if (!referer) return '';

  try {
    return new URL(referer).origin;
  } catch {
    return '';
  }
}

export function validateMutationRequestOrigin(request: Request) {
  const secFetchSite = firstHeaderValue(request.headers.get('sec-fetch-site')).toLowerCase();
  if (secFetchSite === 'cross-site') {
    return NextResponse.json({ error: 'Cross-site requests are not allowed for this endpoint.' }, { status: 403 });
  }

  const expectedOrigin = expectedOriginForRequest(request);
  const requestOrigin = originFromRequest(request);

  // If we cannot resolve both sides (non-browser clients), do not hard-fail.
  if (!expectedOrigin || !requestOrigin) return null;
  if (expectedOrigin === requestOrigin) return null;

  return NextResponse.json({ error: 'Request origin is not allowed for this endpoint.' }, { status: 403 });
}
