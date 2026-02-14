/** Shared types and GraphQL fragments for saved-configuration API routes. */

export type SavedConfigurationNode = {
    id: string;
    name: string;
    keypadModel: string;
    configuration: string;
    createdAt: string;
    updatedAt: string;
};

export const SAVED_CONFIGURATION_FIELDS = `
  id
  name
  keypadModel
  configuration
  createdAt
  updatedAt
`;
