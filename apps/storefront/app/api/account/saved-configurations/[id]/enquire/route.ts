import { NextResponse } from 'next/server';

const SHOP_API = process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';
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

type GraphResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

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

  const body = (await request.json().catch(() => null)) as { note?: unknown } | null;
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

async function queryShopApi<T>(
  request: Request,
  input: {
    query: string;
    variables?: Record<string, unknown>;
  },
): Promise<
  | {
      ok: true;
      data: T;
      rawResponse: Response;
    }
  | {
      ok: false;
      status: number;
      error: string;
      rawResponse: Response;
    }
> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const incomingCookie = request.headers.get('cookie');
  if (incomingCookie) headers.cookie = incomingCookie;

  const rawResponse = await fetch(SHOP_API, {
    method: 'POST',
    headers,
    cache: 'no-store',
    body: JSON.stringify({
      query: input.query,
      variables: input.variables,
    }),
  });

  const json = (await rawResponse.json().catch(() => ({}))) as GraphResponse<T>;

  if (!rawResponse.ok || json.errors?.length || !json.data) {
    const message = json.errors?.[0]?.message || `Vendure error (${rawResponse.status})`;
    return {
      ok: false,
      status: rawResponse.ok ? 400 : rawResponse.status,
      error: message,
      rawResponse,
    };
  }

  return {
    ok: true,
    data: json.data,
    rawResponse,
  };
}

function withSessionCookie(response: NextResponse, vendureResponse: Response) {
  const setCookie = vendureResponse.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }
  return response;
}
