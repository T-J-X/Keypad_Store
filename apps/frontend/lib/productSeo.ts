import type { CatalogProduct } from './vendure';

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(input: string, maxLength: number) {
  if (input.length <= maxLength) return input;
  return `${input.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

export function resolveSeoDescription(product: CatalogProduct) {
  const seoDescription = toTrimmedString(product.customFields?.seoDescription);
  if (seoDescription) return seoDescription;
  const productDescription = stripHtml(product.description ?? '');
  if (productDescription) return truncate(productDescription, 160);
  return `Explore ${product.name} at VCT.`;
}
