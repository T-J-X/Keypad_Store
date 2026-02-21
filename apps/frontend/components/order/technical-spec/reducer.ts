import type { ConfiguredIconLookup } from '../../../lib/configuredKeypadPreview';
import type { TechnicalSpecPayload } from './types';

type TechnicalSpecState = {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  downloadError: string | null;
  activeLineId: string | null;
  specData: TechnicalSpecPayload | null;
  iconLookup: ConfiguredIconLookup;
  downloadingLineId: string | null;
};

export const initialTechnicalSpecState: TechnicalSpecState = {
  isOpen: false,
  isLoading: false,
  error: null,
  downloadError: null,
  activeLineId: null,
  specData: null,
  iconLookup: new Map(),
  downloadingLineId: null,
};

type TechnicalSpecAction =
  | { type: 'set_open'; open: boolean }
  | { type: 'load_start' }
  | {
    type: 'load_success';
    specData: TechnicalSpecPayload;
    iconLookup: ConfiguredIconLookup;
  }
  | { type: 'load_error'; message: string }
  | { type: 'set_active_line_id'; lineId: string | null }
  | { type: 'download_start'; lineId: string }
  | { type: 'download_success' }
  | { type: 'download_error'; message: string };

export function technicalSpecReducer(
  state: TechnicalSpecState,
  action: TechnicalSpecAction,
): TechnicalSpecState {
  switch (action.type) {
    case 'set_open':
      return { ...state, isOpen: action.open };
    case 'load_start':
      return { ...state, isLoading: true, error: null };
    case 'load_success':
      return {
        ...state,
        isLoading: false,
        error: null,
        specData: action.specData,
        activeLineId: action.specData.lines[0]?.lineId ?? null,
        iconLookup: action.iconLookup,
      };
    case 'load_error':
      return { ...state, isLoading: false, error: action.message };
    case 'set_active_line_id':
      return { ...state, activeLineId: action.lineId };
    case 'download_start':
      return { ...state, downloadingLineId: action.lineId, downloadError: null };
    case 'download_success':
      return { ...state, downloadingLineId: null };
    case 'download_error':
      return { ...state, downloadingLineId: null, downloadError: action.message };
    default:
      return state;
  }
}
