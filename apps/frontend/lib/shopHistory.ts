export const SHOP_HUB_HREF = '/shop?section=all';

type HistoryState = Record<string, unknown>;

function toHistoryState(value: unknown): HistoryState {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as HistoryState;
  }
  return {};
}

export function ensureShopHubAnchor(currentHref: string, hubHref = SHOP_HUB_HREF): void {
  if (typeof window === 'undefined') return;
  if (!currentHref || currentHref === hubHref) return;

  const state = toHistoryState(window.history.state);
  if (state.__kpShopHubSpoke === true) return;

  window.history.replaceState(
    {
      ...state,
      __kpShopHubAnchor: true,
      __kpShopHubHref: hubHref,
    },
    '',
    hubHref,
  );

  window.history.pushState(
    {
      ...state,
      __kpShopHubSpoke: true,
      __kpShopHubHref: hubHref,
    },
    '',
    currentHref,
  );
}
