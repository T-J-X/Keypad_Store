export const CART_UPDATED_EVENT = 'kp:cart-updated';

export function notifyCartUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}
