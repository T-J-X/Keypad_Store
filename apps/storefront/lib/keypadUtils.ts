const PKP_MODEL_FRAGMENT_PATTERN = /pkp[-_\s]?(\d{4})(?:[-_\s]?si)?/i;

function canonicalizePkpModelCode(input: string | null | undefined): string | null {
  const value = (input ?? '').trim();
  if (!value) return null;

  const match = value.match(PKP_MODEL_FRAGMENT_PATTERN);
  if (!match?.[1]) return null;
  return `PKP-${match[1]}-SI`;
}

export function resolvePkpModelCode(slug: string, name: string): string {
  const fromSlug = canonicalizePkpModelCode(slug);
  if (fromSlug) return fromSlug;

  const fromName = canonicalizePkpModelCode(name);
  if (fromName) return fromName;

  return '';
}

export function modelCodeToPkpSlug(modelCode: string): string | null {
  const canonical = canonicalizePkpModelCode(modelCode);
  if (!canonical) return null;
  return canonical.toLowerCase();
}
