import { NextResponse } from 'next/server';
import {
  serializeConfiguration,
  validateAndNormalizeConfigurationInput,
} from '../../../../lib/keypadConfiguration';

const SHOP_API = process.env.VENDURE_SHOP_API_URL || 'http://localhost:3000/shop-api';

const SAVED_CONFIGURATION_FIELDS = `
  id
  name
  keypadModel
  configuration
  createdAt
  updatedAt
`;

const LIST_SAVED_CONFIGURATIONS_QUERY = `
  query GetSavedConfigurations {
    getSavedConfigurations {
      ${SAVED_CONFIGURATION_FIELDS}
    }
  }
`;

const LIST_KEYPADS_QUERY = `
  query KeypadProductsForSavedConfigurations($options: ProductListOptions) {
    products(options: $options) {
      items {
        slug
        name
        variants {
          id
        }
      }
    }
  }
`;

const SAVE_CONFIGURATION_MUTATION = `
  mutation SaveConfiguration($name: String!, $keypadModel: String!, $configJson: String!) {
    saveConfiguration(name: $name, keypadModel: $keypadModel, configJson: $configJson) {
      ${SAVED_CONFIGURATION_FIELDS}
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

type KeypadProductListResponse = {
  products: {
    items: Array<{
      slug?: string | null;
      name?: string | null;
      variants?: Array<{ id: string }> | null;
    }>;
  };
};

type ListSavedConfigurationsResponse = {
  getSavedConfigurations: SavedConfigurationNode[];
};

type SaveConfigurationResponse = {
  saveConfiguration: SavedConfigurationNode;
};

type SavedConfigurationRequestBody = {
  name?: unknown;
  keypadModel?: unknown;
  configuration?: unknown;
};

export async function GET(request: Request) {
  const savedConfigsResponse = await queryShopApi<ListSavedConfigurationsResponse>(request, {
    query: LIST_SAVED_CONFIGURATIONS_QUERY,
  });

  if (!savedConfigsResponse.ok) {
    return withSessionCookie(
      NextResponse.json({ error: savedConfigsResponse.error }, { status: savedConfigsResponse.status }),
      savedConfigsResponse.rawResponse,
    );
  }

  const keypadsResponse = await queryShopApi<KeypadProductListResponse>(request, {
    query: LIST_KEYPADS_QUERY,
    variables: {
      options: {
        take: 100,
        filter: {
          isKeypadProduct: { eq: true },
        },
      },
    },
  });

  const keypadVariantByModel = buildKeypadVariantMap(
    keypadsResponse.ok ? keypadsResponse.data.products.items ?? [] : [],
  );

  const items = (savedConfigsResponse.data?.getSavedConfigurations ?? []).map((item) => ({
    ...item,
    keypadVariantId: keypadVariantByModel.get(item.keypadModel) ?? null,
  }));

  return withSessionCookie(
    NextResponse.json({ items }),
    savedConfigsResponse.rawResponse,
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SavedConfigurationRequestBody | null;

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const keypadModel = typeof body?.keypadModel === 'string' ? body.keypadModel.trim().toUpperCase() : '';

  if (!name) {
    return NextResponse.json({ error: 'Configuration name cannot be empty.' }, { status: 400 });
  }
  if (!keypadModel) {
    return NextResponse.json({ error: 'Keypad model is required.' }, { status: 400 });
  }

  const configValidation = validateAndNormalizeConfigurationInput(body?.configuration, { requireComplete: true });
  if (!configValidation.ok) {
    return NextResponse.json({ error: configValidation.error }, { status: 400 });
  }

  const configJson = serializeConfiguration(configValidation.value);

  const shopResponse = await queryShopApi<SaveConfigurationResponse>(request, {
    query: SAVE_CONFIGURATION_MUTATION,
    variables: {
      name,
      keypadModel,
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
    NextResponse.json({ item: shopResponse.data?.saveConfiguration ?? null }),
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

function buildKeypadVariantMap(
  products: Array<{ slug?: string | null; name?: string | null; variants?: Array<{ id: string }> | null }>,
) {
  const map = new Map<string, string>();

  for (const product of products) {
    const modelCode = resolveModelCode(product.slug ?? '', product.name ?? '');
    const variantId = product.variants?.[0]?.id ?? null;
    if (!modelCode || !variantId) continue;
    map.set(modelCode, variantId);
  }

  return map;
}

function resolveModelCode(slug: string, name: string) {
  const slugMatch = slug.match(/pkp-\d{4}-si/i);
  if (slugMatch) return slugMatch[0].toUpperCase();

  const nameMatch = name.match(/pkp[\s-]?(\d{4})[\s-]?si/i);
  if (nameMatch) return `PKP-${nameMatch[1]}-SI`;

  return '';
}
