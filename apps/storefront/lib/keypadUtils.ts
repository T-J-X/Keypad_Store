const MODEL_CODE_FROM_SLUG_PATTERN = /pkp-\d{4}-si/i;
const MODEL_CODE_FROM_NAME_PATTERN = /pkp[\s-]?(\d{4})[\s-]?si/i;
const PKP_MODEL_CODE_PATTERN = /^PKP-\d{4}-SI$/;

export function resolvePkpModelCode(slug: string, name: string): string {
  const slugMatch = slug.match(MODEL_CODE_FROM_SLUG_PATTERN);
  if (slugMatch) return slugMatch[0].toUpperCase();

  const nameMatch = name.match(MODEL_CODE_FROM_NAME_PATTERN);
  if (nameMatch) return `PKP-${nameMatch[1]}-SI`;

  return '';
}

export function modelCodeToPkpSlug(modelCode: string): string | null {
  const normalized = modelCode.trim().toUpperCase();
  if (!normalized) return null;
  if (!PKP_MODEL_CODE_PATTERN.test(normalized)) return null;
  return normalized.toLowerCase();
}
