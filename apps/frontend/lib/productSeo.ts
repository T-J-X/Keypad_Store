import type { CatalogProduct } from './vendure';

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => toTrimmedString(item))
      .filter(Boolean);
  }

  const single = toTrimmedString(value);
  return single
    ? single
        .split(/[,;|]+/g)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function splitKeywordField(input: string) {
  return input
    .split(/[,\n;|]+/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function resolveAdditionalSpecKeywords(input: unknown) {
  if (!Array.isArray(input)) return [];

  const keywords: string[] = [];
  for (const item of input) {
    if (typeof item === 'string') {
      const value = item.trim();
      if (value) keywords.push(value);
      continue;
    }

    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const label = toTrimmedString(
      record.label ?? record.name ?? record.key ?? record.title,
    );
    const value = toTrimmedString(record.value ?? record.text);

    if (label && value) {
      keywords.push(`${label} ${value}`);
    } else if (label) {
      keywords.push(label);
    } else if (value) {
      keywords.push(value);
    }
  }

  return keywords.slice(0, 8);
}

function dedupeKeywords(values: string[], maxKeywords: number) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const keyword = value.replace(/\s+/g, ' ').trim();
    if (!keyword) continue;

    const normalized = keyword.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(keyword);

    if (output.length >= maxKeywords) break;
  }

  return output;
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

export function resolveSeoKeywords(product: CatalogProduct, maxKeywords = 18) {
  const productName = toTrimmedString(product.name);
  const iconId = toTrimmedString(product.customFields?.iconId);
  const categories = toStringArray(product.customFields?.iconCategories);
  const applications = toStringArray(product.customFields?.application);
  const colour = toTrimmedString(product.customFields?.colour);
  const size = toTrimmedString(product.customFields?.size);
  const additionalSpecs = resolveAdditionalSpecKeywords(product.customFields?.additionalSpecs);
  const customKeywordField = toTrimmedString(product.customFields?.seoKeywords);
  const customKeywords = customKeywordField ? splitKeywordField(customKeywordField) : [];

  const typeKeywords =
    product.customFields?.isIconProduct === true
      ? [
          'button insert',
          'keypad icon insert',
          'control panel icon',
          'button insert catalog',
        ]
      : product.customFields?.isKeypadProduct === true
        ? [
            'programmable keypad',
            'vehicle control keypad',
            'CAN keypad',
            'J1939 keypad',
          ]
        : ['control panel component', 'vehicle interface hardware'];

  const categoryIntentKeywords = categories.flatMap((category) => [
    `${category} button insert`,
    `${category} keypad icon`,
    `${category} control panel icon`,
    `${category} icon category`,
    `${category} icon class`,
  ]);

  const applicationIntentKeywords = applications.flatMap((application) => [
    `${application} keypad`,
    `${application} control keypad`,
    `${application} control panel interface`,
  ]);

  const productIntentKeywords = productName
    ? [
        productName,
        `${productName} price`,
        `${productName} specifications`,
        `${productName} datasheet`,
        `buy ${productName}`,
      ]
    : [];

  const keywords = dedupeKeywords(
    [
      ...productIntentKeywords,
      iconId,
      ...categories,
      ...applications,
      colour ? `${colour} ${product.customFields?.isIconProduct ? 'button insert' : 'keypad'}` : '',
      size ? `${size} ${product.customFields?.isIconProduct ? 'button insert' : 'keypad'}` : '',
      ...additionalSpecs,
      ...typeKeywords,
      ...categoryIntentKeywords,
      ...applicationIntentKeywords,
      ...customKeywords,
    ],
    maxKeywords,
  );

  return keywords;
}
