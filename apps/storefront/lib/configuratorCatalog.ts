export type IconCatalogItem = {
  id: string;
  productId: string;
  variantId: string;
  iconId: string;
  name: string;
  sku: string | null;
  categories: string[];
  sizeMm: number | null;
  glossyAssetPath: string | null;
  matteAssetPath: string | null;
};

export type RingGlowOption = {
  label: string;
  value: string | null;
};

export const RING_GLOW_OPTIONS: RingGlowOption[] = [
  { label: 'No glow', value: null },
  { label: 'Blue', value: '#1EA7FF' },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Red', value: '#FF3B30' },
  { label: 'Amber', value: '#FFB000' },
  { label: 'Green', value: '#34C759' },
  { label: 'Purple', value: '#A855F7' },
  { label: 'Cyan', value: '#00E5FF' },
  { label: 'Pink', value: '#FF2D55' },
];
