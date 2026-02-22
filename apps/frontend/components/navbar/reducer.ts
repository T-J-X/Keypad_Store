import type { NavbarState } from './types';

type NavbarAction =
  | { type: 'patch'; patch: Partial<NavbarState> };

export function navbarReducer(state: NavbarState, action: NavbarAction): NavbarState {
  switch (action.type) {
    case 'patch': {
      const keys = Object.keys(action.patch) as Array<keyof NavbarState>;
      if (keys.length === 0) return state;

      let changed = false;
      const nextState: NavbarState = { ...state };

      for (const key of keys) {
        const value = action.patch[key];
        if (state[key] === value) continue;
        changed = true;
        (nextState as Record<keyof NavbarState, NavbarState[keyof NavbarState]>)[key] = value as NavbarState[keyof NavbarState];
      }

      return changed ? nextState : state;
    }
    default:
      return state;
  }
}
