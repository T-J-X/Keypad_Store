import { NextResponse } from 'next/server';
import { getSlotIdsForModel, KEYPAD_MODEL_GEOMETRIES } from '../../../../../config/layouts/geometry';
import {
  serializeConfiguration,
  validateAndNormalizeConfigurationInput,
} from '../../../../../lib/keypadConfiguration';

const SHOP_API = process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';

const SAVED_CONFIGURATION_FIELDS = `
  id
  name
  keypadModel
  configuration
  createdAt
  updatedAt
`;

const GET_SAVED_CONFIGURATION_QUERY = `
  query GetSavedConfiguration($id: ID!) {
    getSavedConfiguration(id: $id) {
      ${SAVED_CONFIGURATION_FIELDS}
    }
  }
`;

const UPDATE_SAVED_CONFIGURATION_MUTATION = `
  mutation UpdateConfiguration($id: ID!, $name: String!, $configJson: String!) {
    updateConfiguration(id: $id, name: $name, configJson: $configJson) {
      ${SAVED_CONFIGURATION_FIELDS}
    }
  }
`;

const DELETE_SAVED_CONFIGURATION_MUTATION = `
  mutation DeleteConfiguration($id: ID!) {
    deleteConfiguration(id: $id)
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

type UpdateSavedConfigurationResponse = {
  updateConfiguration: SavedConfigurationNode;
};

type DeleteSavedConfigurationResponse = {
  deleteConfiguration: boolean;
};

type PatchBody = {
  name?: unknown;
  keypadModel?: unknown;
  configuration?: unknown;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolved = await params;
  const id = resolved.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'Configuration id is required.' }, { status: 400 });
  }

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

  return withSessionCookie(
    NextResponse.json({ item: shopResponse.data?.getSavedConfiguration ?? null }),
    shopResponse.rawResponse,
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolved = await params;
  const id = resolved.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'Configuration id is required.' }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as PatchBody | null;

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const keypadModel = typeof body?.keypadModel === 'string' ? body.keypadModel.trim().toUpperCase() : '';
  if (!name) {
    return NextResponse.json({ error: 'Configuration name cannot be empty.' }, { status: 400 });
  }
  if (keypadModel && !KEYPAD_MODEL_GEOMETRIES[keypadModel]) {
    return NextResponse.json({ error: `Unsupported keypad model "${keypadModel}".` }, { status: 400 });
  }

  const configValidation = validateAndNormalizeConfigurationInput(body?.configuration, {
    requireComplete: true,
    slotIds: keypadModel ? getSlotIdsForModel(keypadModel) : undefined,
  });
  if (!configValidation.ok) {
    return NextResponse.json({ error: configValidation.error }, { status: 400 });
  }

  const configJson = serializeConfiguration(configValidation.value);

  const shopResponse = await queryShopApi<UpdateSavedConfigurationResponse>(request, {
    query: UPDATE_SAVED_CONFIGURATION_MUTATION,
    variables: {
      id,
      name,
      configJson,
    },
  });

  if (!shopResponse.ok) {
    return withSessionCookie(
      NextResponse.json({ error: shopResponse.error }, { status: shopResponse.status }),
      shopResponse.rawResponse,
    );
  }

  return withSessionCookie(
    NextResponse.json({ item: shopResponse.data?.updateConfiguration ?? null }),
    shopResponse.rawResponse,
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const resolved = await params;
  const id = resolved.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'Configuration id is required.' }, { status: 400 });
  }

  const shopResponse = await queryShopApi<DeleteSavedConfigurationResponse>(request, {
    query: DELETE_SAVED_CONFIGURATION_MUTATION,
    variables: { id },
  });

  if (!shopResponse.ok) {
    return withSessionCookie(
      NextResponse.json({ error: shopResponse.error }, { status: shopResponse.status }),
      shopResponse.rawResponse,
    );
  }

  return withSessionCookie(
    NextResponse.json({ ok: shopResponse.data?.deleteConfiguration === true }),
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
