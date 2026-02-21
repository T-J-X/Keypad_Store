export type SessionSummary = {
  authenticated: boolean;
  totalQuantity: number;
  customer: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddress?: string | null;
  } | null;
  cart: {
    totalWithTax: number;
    currencyCode: string;
    lines: Array<any>;
  } | null;
};

export const EMPTY_SESSION_SUMMARY: SessionSummary = {
  authenticated: false,
  totalQuantity: 0,
  customer: null,
  cart: null,
};

export type NavbarState = {
  isScrolled: boolean;
  isVisible: boolean;
  isMenuOpen: boolean;
  isShopMenuOpen: boolean;
  isCartMenuOpen: boolean;
  isSearchOpen: boolean;
  isAccountMenuOpen: boolean;
  isLoggingOut: boolean;
  sessionSummary: SessionSummary;
};

export function createInitialNavbarState(): NavbarState {
  return {
    isScrolled: false,
    isVisible: true,
    isMenuOpen: false,
    isShopMenuOpen: false,
    isCartMenuOpen: false,
    isSearchOpen: false,
    isAccountMenuOpen: false,
    isLoggingOut: false,
    sessionSummary: EMPTY_SESSION_SUMMARY,
  };
}

export function normalizeQuantity(input: unknown) {
  if (typeof input !== 'number' || !Number.isFinite(input)) return 0;
  return Math.max(0, Math.floor(input));
}
