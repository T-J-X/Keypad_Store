import { X } from 'lucide-react';
import AccessibleModal from '../../ui/AccessibleModal';
import Toast from '../../ui/Toast';
import type { SavedConfigurationItem } from '../types';
import type { AuthMode, AuthState } from './types';
import AuthPanel from './subcomponents/AuthPanel';
import DesignsPanel from './subcomponents/DesignsPanel';

type SavedDesignsModalViewProps = {
  isOpen: boolean;
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
  activeTab: 'current' | 'all';
  searchQuery: string;
  savedDesignsLoading: boolean;
  savedDesignsError: string | null;
  filteredDesigns: SavedConfigurationItem[];
  currentModelCode: string;
  isMobile: boolean;
  toast: string | null;
  googleRedirectTo: string;
  onClose: () => void;
  onSwitchAuthMode: (mode: AuthMode) => void;
  onLoginEmailChange: (value: string) => void;
  onLoginPasswordChange: (value: string) => void;
  onSignupFirstNameChange: (value: string) => void;
  onSignupLastNameChange: (value: string) => void;
  onSignupEmailChange: (value: string) => void;
  onSignupPasswordChange: (value: string) => void;
  onLogin: () => void;
  onSignup: () => void;
  onSetActiveTab: (tab: 'current' | 'all') => void;
  onSearchQueryChange: (value: string) => void;
  onLoadDesign: (design: SavedConfigurationItem) => void;
  onDismissToast: () => void;
};

export default function SavedDesignsModalView({
  isOpen,
  authState,
  authMode,
  loginEmail,
  loginPassword,
  loginError,
  loginLoading,
  signupFirstName,
  signupLastName,
  signupEmail,
  signupPassword,
  signupError,
  signupLoading,
  activeTab,
  searchQuery,
  savedDesignsLoading,
  savedDesignsError,
  filteredDesigns,
  currentModelCode,
  isMobile,
  toast,
  googleRedirectTo,
  onClose,
  onSwitchAuthMode,
  onLoginEmailChange,
  onLoginPasswordChange,
  onSignupFirstNameChange,
  onSignupLastNameChange,
  onSignupEmailChange,
  onSignupPasswordChange,
  onLogin,
  onSignup,
  onSetActiveTab,
  onSearchQueryChange,
  onLoadDesign,
  onDismissToast,
}: SavedDesignsModalViewProps) {
  const overlayClass = isMobile
    ? 'fixed inset-0 z-[80] flex items-end bg-[#020a18]/74 px-0 py-0 backdrop-blur-[2px]'
    : 'fixed inset-0 z-[80] flex items-center justify-center bg-[#020a18]/74 px-4 py-6 backdrop-blur-[2px]';

  const panelClass = isMobile
    ? 'h-[74vh] w-full overflow-hidden rounded-t-3xl border border-panel-border border-b-0 bg-panel shadow-[0_-20px_80px_rgba(2,8,24,0.55)]'
    : 'h-[70vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-panel-border bg-panel shadow-[0_30px_80px_rgba(2,8,24,0.55)]';

  return (
    <AccessibleModal
      open={isOpen}
      onClose={onClose}
      backdropClassName={overlayClass}
      panelClassName={`${panelClass} flex flex-col`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/12 px-5 py-4 sm:px-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-panel-muted">My Account</div>
          <h3 className="mt-1 text-lg font-semibold text-white">Saved Designs</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/50 hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {authState === 'checking' ? (
        <div className="flex flex-1 items-center justify-center text-sm text-panel-muted">
          Checking account…
        </div>
      ) : authState === 'logged-out' ? (
        <AuthPanel
          authMode={authMode}
          loginEmail={loginEmail}
          loginPassword={loginPassword}
          loginError={loginError}
          loginLoading={loginLoading}
          signupFirstName={signupFirstName}
          signupLastName={signupLastName}
          signupEmail={signupEmail}
          signupPassword={signupPassword}
          signupError={signupError}
          signupLoading={signupLoading}
          onSwitchAuthMode={onSwitchAuthMode}
          onLoginEmailChange={onLoginEmailChange}
          onLoginPasswordChange={onLoginPasswordChange}
          onSignupFirstNameChange={onSignupFirstNameChange}
          onSignupLastNameChange={onSignupLastNameChange}
          onSignupEmailChange={onSignupEmailChange}
          onSignupPasswordChange={onSignupPasswordChange}
          onLogin={onLogin}
          onSignup={onSignup}
          redirectTo={googleRedirectTo}
        />
      ) : (
        <DesignsPanel
          activeTab={activeTab}
          searchQuery={searchQuery}
          savedDesignsLoading={savedDesignsLoading}
          savedDesignsError={savedDesignsError}
          filteredDesigns={filteredDesigns}
          currentModelCode={currentModelCode}
          onSetActiveTab={onSetActiveTab}
          onSearchQueryChange={onSearchQueryChange}
          onLoadDesign={onLoadDesign}
        />
      )}

      {toast ? <Toast message={toast} onDismiss={onDismissToast} /> : null}
    </AccessibleModal>
  );
}
