import { NextResponse } from 'next/server';
import { resolvePkpModelCode } from '../../../../lib/keypadUtils';
import { getSlotIdsForModel, KEYPAD_MODEL_GEOMETRIES } from '../../../../config/layouts/geometry';
import { validateMutationRequestOrigin } from '../../../../lib/api/requestSecurity';
import {
  getRequestBodyErrorMessage,
  savedConfigurationCreateBodySchema,
} from '../../../../lib/api/schemas';
import { queryShopApi, readJsonBody, withSessionCookie } from '../../../../lib/api/shopApi';
import {
  serializeConfiguration,
  validateAndNormalizeConfigurationInput,
} from '../../../../lib/keypadConfiguration';

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

export async function GET(request: Request) {
  const [savedConfigsResponse, keypadsResponse] = await Promise.all([
    queryShopApi<ListSavedConfigurationsResponse>(request, {
      query: LIST_SAVED_CONFIGURATIONS_QUERY,
    }),
    queryShopApi<KeypadProductListResponse>(request, {
      query: LIST_KEYPADS_QUERY,
      variables: {
        options: {
          take: 100,
          filter: {
            isKeypadProduct: { eq: true },
          },
        },
      },
    }),
  ]);

  if (!savedConfigsResponse.ok) {
    return withSessionCookie(
      NextResponse.json({ error: savedConfigsResponse.error }, { status: savedConfigsResponse.status }),
      savedConfigsResponse.rawResponse,
    );
  }

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
  const originError = validateMutationRequestOrigin(request);
  if (originError) return originError;

  const parsedBody = savedConfigurationCreateBodySchema.safeParse(await readJsonBody<unknown>(request));
  if (!parsedBody.success) {
    return NextResponse.json({ error: getRequestBodyErrorMessage(parsedBody.error) }, { status: 400 });
  }

  const name = parsedBody.data.name;
  const keypadModel = parsedBody.data.keypadModel.toUpperCase();

  if (!KEYPAD_MODEL_GEOMETRIES[keypadModel]) {
    return NextResponse.json({ error: `Unsupported keypad model "${keypadModel}".` }, { status: 400 });
  }

  const configValidation = validateAndNormalizeConfigurationInput(parsedBody.data.configuration, {
    requireComplete: true,
    slotIds: getSlotIdsForModel(keypadModel),
  });
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

function buildKeypadVariantMap(
  products: Array<{ slug?: string | null; name?: string | null; variants?: Array<{ id: string }> | null }>,
) {
  const map = new Map<string, string>();

  for (const product of products) {
    const modelCode = resolvePkpModelCode(product.slug ?? '', product.name ?? '');
    const variantId = product.variants?.[0]?.id ?? null;
    if (!modelCode || !variantId) continue;
    map.set(modelCode, variantId);
  }

  return map;
}
