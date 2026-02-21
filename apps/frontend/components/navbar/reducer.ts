import type { NavbarState } from './types';

type NavbarAction =
  | { type: 'patch'; patch: Partial<NavbarState> };

export function navbarReducer(state: NavbarState, action: NavbarAction): NavbarState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    default:
      return state;
  }
}
