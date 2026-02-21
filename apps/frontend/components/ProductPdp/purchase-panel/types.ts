import type { ReactNode } from 'react';

export type StockSummary = {
  label: string;
  quantityLeft: number | null;
  available: boolean;
};

export type CategoryItem = {
  slug: string;
  label: string;
};

export type PurchasePanelProps = {
  productName: string;
  productTypeLabel: string;
  iconId: string;
  categories: string[];
  compatibilityLinkHref: string;
  productSlug: string;
  priceExVatLabel: string;
  priceWithVatLabel?: string | null;
  productVariantId?: string;
  stock: StockSummary;
  priceAndStockSlot?: ReactNode;
};
