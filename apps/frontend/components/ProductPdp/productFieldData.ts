import { type CatalogProduct, assetUrl } from '../../lib/vendure';

export type ProductDownload = {
  id: string;
  label: string;
  href: string;
  source: 'customField' | 'asset';
};

export type ProductSpecItem = {
  label: string;
  value: string;
};

export function resolveProductDownloads(product: CatalogProduct): ProductDownload[] {
  const entries = new Map<string, ProductDownload>();
  const customFieldValue = product.customFields?.downloads;

  if (Array.isArray(customFieldValue)) {
    for (const [index, item] of customFieldValue.entries()) {
      const parsed = parseDownloadEntry(item);
      if (!parsed) continue;
      if (entries.has(parsed.href)) continue;
      entries.set(parsed.href, {
        id: `custom-${index}`,
        href: parsed.href,
        label: parsed.label,
        source: 'customField',
      });
    }
  }

  const assets = product.assets ?? [];
  for (const asset of assets) {
    const rawHref = asset.source ?? asset.preview ?? '';
    const href = normalizeHref(rawHref);
    if (!href || !looksLikeDownloadAsset(asset.name, href)) continue;
    if (entries.has(href)) continue;

    entries.set(href, {
      id: `asset-${asset.id}`,
      href,
      label: cleanAssetLabel(asset.name || labelFromHref(href)),
      source: 'asset',
    });
  }

  return Array.from(entries.values());
}

export function resolveInTheBoxItems(product: CatalogProduct): string[] {
  const value = product.customFields?.whatsInTheBox;
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeSpecValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    const formatted = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
    return formatted.length > 0 ? formatted.join(', ') : null;
  }
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

export function resolveAdditionalSpecs(product: CatalogProduct): ProductSpecItem[] {
  const rawSpecs = product.customFields?.additionalSpecs;
  if (!Array.isArray(rawSpecs)) return [];

  const out: ProductSpecItem[] = [];
  for (const item of rawSpecs) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const [labelPart, ...rest] = trimmed.split(':');
      if (rest.length > 0) {
        const label = labelPart.trim() || 'Spec';
        const value = rest.join(':').trim();
        if (value) out.push({ label, value });
        continue;
      }
      out.push({ label: 'Spec', value: trimmed });
      continue;
    }

    if (!isRecord(item)) continue;

    const label = firstNonEmptyString(item.label, item.name, item.key, item.title) || 'Spec';
    const value = normalizeSpecValue(item.value ?? item.text);
    if (!value) continue;
    out.push({ label, value });
  }

  return out;
}

function parseDownloadEntry(value: unknown): { href: string; label: string } | null {
  if (typeof value === 'string') {
    const href = normalizeHref(value);
    if (!href) return null;
    return { href, label: labelFromHref(href) };
  }

  if (!isRecord(value)) return null;

  const relationHref = firstNonEmptyString(value.source, value.preview);
  if (relationHref) {
    const href = normalizeHref(relationHref);
    if (!href) return null;
    return {
      href,
      label: firstNonEmptyString(value.label, value.name, value.title) || labelFromHref(href),
    };
  }

  const rawHref = firstNonEmptyString(value.href, value.url, value.link);
  if (!rawHref) return null;
  const href = normalizeHref(rawHref);
  if (!href) return null;
  return {
    href,
    label: firstNonEmptyString(value.label, value.name, value.title) || labelFromHref(href),
  };
}

function normalizeHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return assetUrl(trimmed);
}

function looksLikeDownloadAsset(name?: string, href?: string) {
  const source = `${name ?? ''} ${href ?? ''}`.toLowerCase();
  return (
    /\.(pdf|zip|dxf|dwg|step|stp|iges|igs|doc|docx|xls|xlsx)(\?|$)/.test(source) ||
    /download|manual|datasheet|guide|spec|schematic|drawing/.test(source)
  );
}

function labelFromHref(href: string) {
  const clean = href.split('?')[0] || href;
  const segment = clean.split('/').filter(Boolean).pop() || 'Download';
  return cleanAssetLabel(segment);
}

function cleanAssetLabel(value: string) {
  return value
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim() || 'Download';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function firstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}
