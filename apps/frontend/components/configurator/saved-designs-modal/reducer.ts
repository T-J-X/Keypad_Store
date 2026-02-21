import {
  createInitialSavedDesignsModalUiState,
  type SavedDesignsModalUiState,
} from './types';

type SavedDesignsModalAction =
  | { type: 'patch'; patch: Partial<SavedDesignsModalUiState> }
  | { type: 'reset_modal_ui' };

export function savedDesignsModalReducer(
  state: SavedDesignsModalUiState,
  action: SavedDesignsModalAction,
): SavedDesignsModalUiState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'reset_modal_ui':
      return createInitialSavedDesignsModalUiState();
    default:
      return state;
  }
}
