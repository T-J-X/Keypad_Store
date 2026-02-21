export type SearchParamValue = string | string[] | undefined;

export function toStringParam(value: SearchParamValue) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return '';
}

export function toPositiveInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function toAllowedPageSize(
  value: string,
  allowedValues: readonly number[],
  fallback: number,
) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return allowedValues.includes(parsed) ? parsed : fallback;
}

export function parseUniqueCsvSlugs(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}
