import { NextResponse } from 'next/server';
import { validateMutationRequestOrigin } from '../../../../../../lib/api/requestSecurity';
import { queryShopApi, readJsonBody, withSessionCookie } from '../../../../../../lib/api/shopApi';

const NTFY_TOPIC_URL = process.env.NTFY_TOPIC_URL?.trim() || '';
const NTFY_AUTH_HEADER = process.env.NTFY_AUTH_HEADER?.trim() || '';

const GET_SAVED_CONFIGURATION_QUERY = `
  query GetSavedConfiguration($id: ID!) {
    getSavedConfiguration(id: $id) {
      id
      name
      keypadModel
      configuration
      createdAt
      updatedAt
    }
  }
`;

type SavedConfigurationNode = {
  id: string;
  name: string;
  keypadModel: string;
  configuration: string;
  createdAt: string;
  updatedAt: string;
};

type GetSavedConfigurationResponse = {
  getSavedConfiguration: SavedConfigurationNode;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const originError = validateMutationRequestOrigin(request);
  if (originError) return originError;

  if (!NTFY_TOPIC_URL) {
    return NextResponse.json(
      { error: 'Enquiry service is not configured. Set NTFY_TOPIC_URL to enable this action.' },
      { status: 503 },
    );
  }

  const resolved = await params;
  const id = resolved.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'Configuration id is required.' }, { status: 400 });
  }

  const body = await readJsonBody<{ note?: unknown }>(request);
  const note = typeof body?.note === 'string' ? body.note.trim() : '';

  const shopResponse = await queryShopApi<GetSavedConfigurationResponse>(request, {
    query: GET_SAVED_CONFIGURATION_QUERY,
    variables: { id },
  });

  if (!shopResponse.ok) {
    return withSessionCookie(
      NextResponse.json({ error: shopResponse.error }, { status: shopResponse.status }),
      shopResponse.rawResponse,
    );
  }

  const saved = shopResponse.data.getSavedConfiguration;
  const message = [
    'Saved keypad enquiry',
    `Configuration ID: ${saved.id}`,
    `Name: ${saved.name}`,
    `Model: ${saved.keypadModel}`,
    `Updated: ${saved.updatedAt}`,
    note ? `Customer note: ${note}` : null,
    'Configuration JSON:',
    saved.configuration,
  ].filter(Boolean).join('\n');

  const ntfyHeaders: Record<string, string> = {
    'content-type': 'text/plain; charset=utf-8',
    title: `Keypad Enquiry: ${saved.name}`,
    tags: 'keypad,config,enquiry',
    priority: 'default',
  };

  if (NTFY_AUTH_HEADER) {
    ntfyHeaders.authorization = NTFY_AUTH_HEADER;
  }

  const ntfyResponse = await fetch(NTFY_TOPIC_URL, {
    method: 'POST',
    headers: ntfyHeaders,
    body: message,
  });

  if (!ntfyResponse.ok) {
    const detail = await ntfyResponse.text().catch(() => '');
    return withSessionCookie(
      NextResponse.json(
        { error: `Failed to send enquiry notification (${ntfyResponse.status}). ${detail}`.trim() },
        { status: 502 },
      ),
      shopResponse.rawResponse,
    );
  }

  return withSessionCookie(
    NextResponse.json({ ok: true }),
    shopResponse.rawResponse,
  );
}
