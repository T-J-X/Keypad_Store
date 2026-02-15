import { NextResponse } from 'next/server';
import { getSlotIdsForModel, KEYPAD_MODEL_GEOMETRIES } from '../../../../../config/layouts/geometry';
import { validateMutationRequestOrigin } from '../../../../../lib/api/requestSecurity';
import {
  getRequestBodyErrorMessage,
  savedConfigurationUpdateBodySchema,
} from '../../../../../lib/api/schemas';
import { queryShopApi, readJsonBody, withSessionCookie } from '../../../../../lib/api/shopApi';
import {
  type SavedConfigurationNode,
  SAVED_CONFIGURATION_FIELDS,
} from '../../../../../lib/api/savedConfigurationTypes';
import {
  serializeConfiguration,
  validateAndNormalizeConfigurationInput,
} from '../../../../../lib/keypadConfiguration';



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


type GetSavedConfigurationResponse = {
  getSavedConfiguration: SavedConfigurationNode;
};

type UpdateSavedConfigurationResponse = {
  updateConfiguration: SavedConfigurationNode;
};

type DeleteSavedConfigurationResponse = {
  deleteConfiguration: boolean;
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
  const originError = validateMutationRequestOrigin(request);
  if (originError) return originError;

  const resolved = await params;
  const id = resolved.id?.trim();

  if (!id) {
    return NextResponse.json({ error: 'Configuration id is required.' }, { status: 400 });
  }

  const parsedBody = savedConfigurationUpdateBodySchema.safeParse(await readJsonBody<unknown>(request));
  if (!parsedBody.success) {
    return NextResponse.json({ error: getRequestBodyErrorMessage(parsedBody.error) }, { status: 400 });
  }

  const name = parsedBody.data.name;
  const keypadModel = (parsedBody.data.keypadModel || '').toUpperCase();

  if (keypadModel && !KEYPAD_MODEL_GEOMETRIES[keypadModel]) {
    return NextResponse.json({ error: `Unsupported keypad model "${keypadModel}".` }, { status: 400 });
  }

  const configValidation = validateAndNormalizeConfigurationInput(parsedBody.data.configuration, {
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
  const originError = validateMutationRequestOrigin(request);
  if (originError) return originError;

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
