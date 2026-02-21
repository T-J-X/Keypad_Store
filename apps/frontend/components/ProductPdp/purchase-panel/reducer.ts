export type PurchasePanelState = {
  quantity: number;
  adding: boolean;
  pulse: boolean;
  buyingNow: boolean;
  wishlistSaving: boolean;
  errorMessage: string | null;
  showAuthPrompt: boolean;
};

export const initialPurchasePanelState: PurchasePanelState = {
  quantity: 1,
  adding: false,
  pulse: true,
  buyingNow: false,
  wishlistSaving: false,
  errorMessage: null,
  showAuthPrompt: false,
};

type PurchasePanelAction =
  | { type: 'set_quantity'; quantity: number }
  | { type: 'set_pulse'; pulse: boolean }
  | { type: 'add_start' }
  | { type: 'add_finish' }
  | { type: 'buy_start' }
  | { type: 'buy_finish' }
  | { type: 'wishlist_start' }
  | { type: 'wishlist_finish' }
  | { type: 'set_error'; message: string | null }
  | { type: 'set_auth_prompt'; open: boolean };

export function purchasePanelReducer(
  state: PurchasePanelState,
  action: PurchasePanelAction,
): PurchasePanelState {
  switch (action.type) {
    case 'set_quantity':
      return { ...state, quantity: action.quantity };
    case 'set_pulse':
      return { ...state, pulse: action.pulse };
    case 'add_start':
      return { ...state, adding: true, errorMessage: null };
    case 'add_finish':
      return { ...state, adding: false };
    case 'buy_start':
      return { ...state, buyingNow: true, errorMessage: null };
    case 'buy_finish':
      return { ...state, buyingNow: false };
    case 'wishlist_start':
      return { ...state, wishlistSaving: true, errorMessage: null };
    case 'wishlist_finish':
      return { ...state, wishlistSaving: false };
    case 'set_error':
      return { ...state, errorMessage: action.message };
    case 'set_auth_prompt':
      return { ...state, showAuthPrompt: action.open };
    default:
      return state;
  }
}
