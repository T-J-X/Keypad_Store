export type StatusMessage = {
  type: 'success' | 'error';
  message: string;
};

export type SavedConfigurationItem = {
  id: string;
  name: string;
  keypadModel: string;
  configuration: string;
  createdAt: string;
  updatedAt: string;
};

export type PilotKeypadProduct = {
  id: string;
  slug: string;
  name: string;
  modelCode: string;
  description?: string | null;
  shellAssetPath: string | null;
  productVariantId: string | null;
};
