export type AuthState = 'checking' | 'logged-out' | 'logged-in';
export type AuthMode = 'login' | 'signup';

export type SavedDesignsModalUiState = {
  activeTab: 'current' | 'all';
  searchQuery: string;
  authState: AuthState;
  authMode: AuthMode;
  loginEmail: string;
  loginPassword: string;
  loginError: string;
  loginLoading: boolean;
  signupFirstName: string;
  signupLastName: string;
  signupEmail: string;
  signupPassword: string;
  signupError: string;
  signupLoading: boolean;
  toast: string | null;
};

export function createInitialSavedDesignsModalUiState(): SavedDesignsModalUiState {
  return {
    activeTab: 'current',
    searchQuery: '',
    authState: 'checking',
    authMode: 'login',
    loginEmail: '',
    loginPassword: '',
    loginError: '',
    loginLoading: false,
    signupFirstName: '',
    signupLastName: '',
    signupEmail: '',
    signupPassword: '',
    signupError: '',
    signupLoading: false,
    toast: null,
  };
}
