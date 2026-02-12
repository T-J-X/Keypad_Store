import { useMemo } from 'react';

export type FuzzyIndexEntry<T> = {
  item: T;
  tokens: string[];
};

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenizeSearchText(value: string) {
  const normalized = normalizeSearchText(value);
  return normalized ? normalized.split(/\s+/g).filter(Boolean) : [];
}

function isSubsequence(term: string, token: string) {
  let termIndex = 0;
  for (let i = 0; i < token.length && termIndex < term.length; i += 1) {
    if (token[i] === term[termIndex]) termIndex += 1;
  }
  return termIndex === term.length;
}

function boundedLevenshtein(a: string, b: string, maxDistance: number) {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    const swap = prev;
    prev = curr;
    curr = swap;
  }

  return prev[b.length];
}

function tokenFuzzyMatch(term: string, token: string) {
  if (token.includes(term) || token.startsWith(term)) return true;
  if (term.length >= 3 && isSubsequence(term, token)) return true;
  if (term.length < 3) return false;
  const maxDistance = term.length >= 6 ? 2 : 1;
  return boundedLevenshtein(term, token, maxDistance) <= maxDistance;
}

export function matchesSearchTerms(tokens: string[], queryTerms: string[]) {
  if (queryTerms.length === 0) return true;
  return queryTerms.every((term) => tokens.some((token) => tokenFuzzyMatch(term, token)));
}

export function useFuzzySearch<T>({
  items,
  query,
  getSearchText,
}: {
  items: T[];
  query: string;
  getSearchText: (item: T) => string;
}) {
  const queryTerms = useMemo(() => tokenizeSearchText(query), [query]);

  const index = useMemo<FuzzyIndexEntry<T>[]>(() => {
    return items.map((item) => ({
      item,
      tokens: tokenizeSearchText(getSearchText(item)),
    }));
  }, [getSearchText, items]);

  const filteredItems = useMemo(
    () => index.filter(({ tokens }) => matchesSearchTerms(tokens, queryTerms)).map(({ item }) => item),
    [index, queryTerms],
  );

  return {
    queryTerms,
    index,
    filteredItems,
  };
}
