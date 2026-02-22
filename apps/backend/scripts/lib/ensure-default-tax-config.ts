type GraphqlError = {
  message?: string;
};

type GraphqlResponse<TData> = {
  data?: TData;
  errors?: GraphqlError[];
};

type EnsureDefaultTaxSetupOptions = {
  log?: (message: string) => void;
};

async function adminGraphql<TData>(
  endpoint: string,
  cookie: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<TData> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as GraphqlResponse<TData>;
  if (!response.ok || (json.errors?.length ?? 0) > 0) {
    const message = json.errors?.[0]?.message ?? `HTTP ${response.status}`;
    throw new Error(message);
  }
  if (!json.data) {
    throw new Error('Missing GraphQL response data');
  }
  return json.data;
}

export async function ensureDefaultTaxSetup(
  endpoint: string,
  cookie: string,
  options?: EnsureDefaultTaxSetupOptions,
) {
  const log = options?.log ?? (() => undefined);

  const channelsData = await adminGraphql<{
    channels: {
      items: Array<{
        id: string;
        code: string;
        defaultTaxZone?: { id: string } | null;
        defaultShippingZone?: { id: string } | null;
      }>;
    };
  }>(
    endpoint,
    cookie,
    `
      query EnsureTaxChannel {
        channels(options: { take: 1 }) {
          items {
            id
            code
            defaultTaxZone { id }
            defaultShippingZone { id }
          }
        }
      }
    `,
  );

  const channel = channelsData.channels.items[0];
  if (!channel) {
    throw new Error('Could not find a channel to configure tax defaults.');
  }

  let zoneId = channel.defaultTaxZone?.id ?? channel.defaultShippingZone?.id ?? null;
  if (!zoneId) {
    const zonesData = await adminGraphql<{
      zones: {
        items: Array<{ id: string }>;
      };
    }>(
      endpoint,
      cookie,
      `
        query ExistingZones {
          zones(options: { take: 50 }) {
            items { id }
          }
        }
      `,
    );

    zoneId = zonesData.zones.items[0]?.id ?? null;
    if (!zoneId) {
      const createZoneData = await adminGraphql<{
        createZone: {
          id: string;
        };
      }>(
        endpoint,
        cookie,
        `
          mutation CreateFallbackZone($input: CreateZoneInput!) {
            createZone(input: $input) {
              id
            }
          }
        `,
        {
          input: {
            name: 'Default Zone',
            memberIds: [],
          },
        },
      );
      zoneId = createZoneData.createZone.id;
      log('Created fallback tax zone (Default Zone).');
    }
  }

  if (!zoneId) {
    throw new Error('Could not resolve a tax zone for catalog import.');
  }

  const channelNeedsDefaults = !channel.defaultTaxZone?.id || !channel.defaultShippingZone?.id;
  if (channelNeedsDefaults) {
    const updateChannelData = await adminGraphql<{
      updateChannel:
        | {
          __typename: 'Channel';
          id: string;
        }
        | {
          __typename: 'LanguageNotAvailableError';
          message: string;
        };
    }>(
      endpoint,
      cookie,
      `
        mutation EnsureChannelDefaults($input: UpdateChannelInput!) {
          updateChannel(input: $input) {
            __typename
            ... on Channel {
              id
            }
            ... on LanguageNotAvailableError {
              message
            }
          }
        }
      `,
      {
        input: {
          id: channel.id,
          defaultTaxZoneId: zoneId,
          defaultShippingZoneId: zoneId,
        },
      },
    );

    if (updateChannelData.updateChannel.__typename !== 'Channel') {
      throw new Error(updateChannelData.updateChannel.message);
    }
    log(`Configured default tax/shipping zones for channel "${channel.code}".`);
  }

  const categoriesData = await adminGraphql<{
    taxCategories: {
      items: Array<{
        id: string;
        isDefault: boolean;
      }>;
    };
  }>(
    endpoint,
    cookie,
    `
      query ExistingTaxCategories {
        taxCategories(options: { take: 50 }) {
          items {
            id
            isDefault
          }
        }
      }
    `,
  );

  let taxCategoryId =
    categoriesData.taxCategories.items.find((item) => item.isDefault)?.id ??
    categoriesData.taxCategories.items[0]?.id ??
    null;

  if (!taxCategoryId) {
    const createCategoryData = await adminGraphql<{
      createTaxCategory: {
        id: string;
      };
    }>(
      endpoint,
      cookie,
      `
        mutation CreateFallbackTaxCategory($input: CreateTaxCategoryInput!) {
          createTaxCategory(input: $input) {
            id
          }
        }
      `,
      {
        input: {
          name: 'Standard Tax',
          isDefault: true,
        },
      },
    );
    taxCategoryId = createCategoryData.createTaxCategory.id;
    log('Created fallback default tax category (Standard Tax).');
  }

  if (!taxCategoryId) {
    throw new Error('Could not resolve a tax category for catalog import.');
  }

  const ratesData = await adminGraphql<{
    taxRates: {
      items: Array<{
        id: string;
        zone: { id: string };
        category: { id: string };
      }>;
    };
  }>(
    endpoint,
    cookie,
    `
      query ExistingTaxRates {
        taxRates(options: { take: 100 }) {
          items {
            id
            zone { id }
            category { id }
          }
        }
      }
    `,
  );

  const hasMatchingRate = ratesData.taxRates.items.some((item) => {
    return item.zone.id === zoneId && item.category.id === taxCategoryId;
  });

  if (!hasMatchingRate) {
    await adminGraphql(
      endpoint,
      cookie,
      `
        mutation CreateFallbackTaxRate($input: CreateTaxRateInput!) {
          createTaxRate(input: $input) {
            id
          }
        }
      `,
      {
        input: {
          name: 'Zero Tax',
          enabled: true,
          value: 0,
          zoneId,
          categoryId: taxCategoryId,
        },
      },
    );
    log('Created fallback zero-value tax rate for import.');
  }

  return {
    channelId: channel.id,
    zoneId,
    taxCategoryId,
  };
}
