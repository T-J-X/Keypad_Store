import type { KeypadConfigurationDraft } from '../../../lib/keypadConfiguration';

export type TechnicalSpecLine = {
  lineId: string;
  quantity: number;
  variantId: string;
  variantName: string;
  variantSku: string;
  configuration: KeypadConfigurationDraft;
};

export type TechnicalSpecPayload = {
  orderCode: string;
  orderDate: string;
  customerName: string | null;
  lines: TechnicalSpecLine[];
};

export type IconCatalogPayload = {
  icons?: Array<{
    iconId: string;
    name?: string;
    matteAssetPath: string | null;
    categories: string[];
  }>;
};
