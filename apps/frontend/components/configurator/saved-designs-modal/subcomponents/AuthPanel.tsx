import GoogleLoginButton from '../../../GoogleLoginButton';
import type { AuthMode } from '../types';

type AuthPanelProps = {
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
  onSwitchAuthMode: (mode: AuthMode) => void;
  onLoginEmailChange: (value: string) => void;
  onLoginPasswordChange: (value: string) => void;
  onSignupFirstNameChange: (value: string) => void;
  onSignupLastNameChange: (value: string) => void;
  onSignupEmailChange: (value: string) => void;
  onSignupPasswordChange: (value: string) => void;
  onLogin: () => void;
  onSignup: () => void;
  redirectTo: string;
};

export default function AuthPanel({
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
  onSwitchAuthMode,
  onLoginEmailChange,
  onLoginPasswordChange,
  onSignupFirstNameChange,
  onSignupLastNameChange,
  onSignupEmailChange,
  onSignupPasswordChange,
  onLogin,
  onSignup,
  redirectTo,
}: AuthPanelProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSwitchAuthMode('login')}
            className={`flex-1 rounded-xl py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${authMode === 'login'
              ? 'bg-white/10 text-white'
              : 'text-panel-muted hover:text-white/70'
              }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => onSwitchAuthMode('signup')}
            className={`flex-1 rounded-xl py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${authMode === 'signup'
              ? 'bg-white/10 text-white'
              : 'text-panel-muted hover:text-white/70'
              }`}
          >
            Create account
          </button>
        </div>

        <div className="text-center space-y-2">
          <h4 className="text-xl font-semibold text-white">
            {authMode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </h4>
          <p className="text-sm text-panel-muted">
            {authMode === 'login'
              ? 'Log in to view and load your saved keypad designs.'
              : 'Save layouts, track orders, and manage your configurations.'}
          </p>
        </div>

        {authMode === 'login' ? (
          <>
            {loginError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {loginError}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="sd-login-email" className="text-[11px] font-semibold uppercase tracking-wider text-panel-muted">
                  Email
                </label>
                <input
                  id="sd-login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(event) => onLoginEmailChange(event.target.value)}
                  className="input input-dark h-11 rounded-xl"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="you@company.com"
                  disabled={loginLoading}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="sd-login-password" className="text-[11px] font-semibold uppercase tracking-wider text-panel-muted">
                  Password
                </label>
                <input
                  id="sd-login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(event) => onLoginPasswordChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onLogin();
                    }
                  }}
                  className="input input-dark h-11 rounded-xl"
                  autoComplete="current-password"
                  placeholder="Enter your password…"
                  disabled={loginLoading}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onLogin}
              disabled={loginLoading}
              className="btn-premium w-full rounded-xl text-sm font-semibold"
            >
              {loginLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </>
        ) : (
          <>
            {signupError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {signupError}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="sd-signup-first" className="text-[11px] font-semibold uppercase tracking-wider text-panel-muted">
                    First name
                  </label>
                  <input
                    id="sd-signup-first"
                    type="text"
                    value={signupFirstName}
                    onChange={(event) => onSignupFirstNameChange(event.target.value)}
                    className="input input-dark h-11 rounded-xl"
                    autoComplete="given-name"
                    placeholder="Jane"
                    disabled={signupLoading}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sd-signup-last" className="text-[11px] font-semibold uppercase tracking-wider text-panel-muted">
                    Last name
                  </label>
                  <input
                    id="sd-signup-last"
                    type="text"
                    value={signupLastName}
                    onChange={(event) => onSignupLastNameChange(event.target.value)}
                    className="input input-dark h-11 rounded-xl"
                    autoComplete="family-name"
                    placeholder="Doe"
                    disabled={signupLoading}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="sd-signup-email" className="text-[11px] font-semibold uppercase tracking-wider text-panel-muted">
                  Email
                </label>
                <input
                  id="sd-signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(event) => onSignupEmailChange(event.target.value)}
                  className="input input-dark h-11 rounded-xl"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="you@company.com"
                  disabled={signupLoading}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="sd-signup-password" className="text-[11px] font-semibold uppercase tracking-wider text-panel-muted">
                  Password
                </label>
                <input
                  id="sd-signup-password"
                  type="password"
                  value={signupPassword}
                  onChange={(event) => onSignupPasswordChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onSignup();
                    }
                  }}
                  className="input input-dark h-11 rounded-xl"
                  autoComplete="new-password"
                  placeholder="Create a strong password…"
                  disabled={signupLoading}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onSignup}
              disabled={signupLoading}
              className="btn-premium w-full rounded-xl text-sm font-semibold"
            >
              {signupLoading ? 'Creating account…' : 'Create account'}
            </button>
          </>
        )}

        <div className="relative py-1">
          <div className="h-px w-full bg-white/10" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-panel px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-panel-muted">
            Or
          </span>
        </div>

        <GoogleLoginButton
          redirectTo={redirectTo}
          className="rounded-xl border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10 hover:shadow-none"
        />
      </div>
    </div>
  );
}
