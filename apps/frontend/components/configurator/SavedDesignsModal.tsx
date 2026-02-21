'use client';

import { use, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { X, Search } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

import AccessibleModal from '../ui/AccessibleModal';
import Toast from '../ui/Toast';
import GoogleLoginButton from '../GoogleLoginButton';
import { KeypadContext } from './KeypadProvider';
import type { SavedConfigurationItem } from './types';

function formatDate(isoString: string) {
    try {
        return new Date(isoString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return isoString;
    }
}

type AuthState = 'checking' | 'logged-out' | 'logged-in';
type AuthMode = 'login' | 'signup';

export default function SavedDesignsModal() {
    const context = use(KeypadContext);

    // Safe access for hooks
    const savedDesignsModalOpen = context?.state.savedDesignsModalOpen ?? false;
    const actions = context?.actions;

    const [activeTab, setActiveTab] = useState<'current' | 'all'>('current');
    const [searchQuery, setSearchQuery] = useState('');
    const [authState, setAuthState] = useState<AuthState>('checking');
    const [authMode, setAuthMode] = useState<AuthMode>('login');

    // Login form state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // Signup form state
    const [signupFirstName, setSignupFirstName] = useState('');
    const [signupLastName, setSignupLastName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupError, setSignupError] = useState('');
    const [signupLoading, setSignupLoading] = useState(false);

    // Toast
    const [toast, setToast] = useState<string | null>(null);

    const resetModalUiState = useCallback(() => {
        setSearchQuery('');
        setActiveTab('current');
        setLoginEmail('');
        setLoginPassword('');
        setLoginError('');
        setLoginLoading(false);
        setAuthMode('login');
        setSignupFirstName('');
        setSignupLastName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupError('');
        setSignupLoading(false);
        setAuthState('checking');
    }, []);

    // Check auth when modal opens
    useEffect(() => {
        if (!savedDesignsModalOpen) return;

        resetModalUiState();
    }, [savedDesignsModalOpen, resetModalUiState]);

    const { data: sessionData, error: sessionFetchError } = useSWR(
        savedDesignsModalOpen && authState === 'checking' ? '/api/session/summary' : null,
        fetcher,
        {
            revalidateOnFocus: false,
            shouldRetryOnError: false,
        }
    );

    useEffect(() => {
        if (savedDesignsModalOpen && authState === 'checking') {
            if (sessionData) {
                setAuthState(sessionData.authenticated ? 'logged-in' : 'logged-out');
            } else if (sessionFetchError) {
                setAuthState('logged-out');
            }
        }
    }, [sessionData, sessionFetchError, savedDesignsModalOpen, authState]);

    const handleLogin = useCallback(async () => {
        if (!actions) return;
        if (!loginEmail.trim() || !loginPassword.trim()) {
            setLoginError('Please enter your email and password.');
            return;
        }

        setLoginLoading(true);
        setLoginError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });

            const data = await res.json();

            if (data.success) {
                const name = [data.firstName, data.lastName].filter(Boolean).join(' ');
                if (name) setToast(`Welcome back, ${name}`);
                setAuthState('logged-in');
                actions.openSavedDesignsModal();
            } else {
                setLoginError(data.error || 'Login failed. Please try again.');
            }
        } catch {
            setLoginError('Unable to connect. Please try again.');
        } finally {
            setLoginLoading(false);
        }
    }, [loginEmail, loginPassword, actions]);

    const handleSignup = useCallback(async () => {
        if (!actions) return;
        if (!signupFirstName.trim() || !signupLastName.trim()) {
            setSignupError('Please enter your first and last name.');
            return;
        }
        if (!signupEmail.trim() || !signupPassword.trim()) {
            setSignupError('Please enter your email and password.');
            return;
        }

        setSignupLoading(true);
        setSignupError('');

        try {
            const registerRes = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    firstName: signupFirstName.trim(),
                    lastName: signupLastName.trim(),
                    email: signupEmail.trim(),
                    password: signupPassword,
                }),
            });

            const registerData = await registerRes.json();

            if (!registerData.success) {
                setSignupError(registerData.error || 'Registration failed. Please try again.');
                setSignupLoading(false);
                return;
            }

            const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: signupEmail.trim(), password: signupPassword }),
            });

            const loginData = await loginRes.json();

            if (loginData.success) {
                const name = [loginData.firstName, loginData.lastName].filter(Boolean).join(' ');
                setToast(name ? `Welcome, ${name}!` : 'Account created!');
                setAuthState('logged-in');
                actions.openSavedDesignsModal();
            } else {
                setSignupError('Account created! Please sign in.');
                setAuthMode('login');
                setLoginEmail(signupEmail);
            }
        } catch {
            setSignupError('Unable to connect. Please try again.');
        } finally {
            setSignupLoading(false);
        }
    }, [signupFirstName, signupLastName, signupEmail, signupPassword, actions]);

    if (!context) return null;
    const { state } = context;
    const { savedDesigns, savedDesignsLoading, savedDesignsError } = state;
    const { closeSavedDesignsModal } = actions!;

    const filteredDesigns = savedDesigns.filter((item) => {
        if (activeTab === 'current' && item.keypadModel !== state.modelCode) {
            return false;
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return (
                item.name.toLowerCase().includes(query) ||
                item.keypadModel.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const handleLoadDesign = (design: SavedConfigurationItem) => {
        if (design.keypadModel === state.modelCode) {
            window.location.assign(
                `/configurator/keypad/${encodeURIComponent(context.meta.keypad.slug)}?load=${encodeURIComponent(design.id)}`
            );
        } else {
            const slug = design.keypadModel.toLowerCase();
            window.location.assign(`/configurator/keypad/${slug}?load=${encodeURIComponent(design.id)}`);
        }
    };

    const overlayClass = state.isMobile
        ? 'fixed inset-0 z-[80] flex items-end bg-[#020a18]/74 px-0 py-0 backdrop-blur-[2px]'
        : 'fixed inset-0 z-[80] flex items-center justify-center bg-[#020a18]/74 px-4 py-6 backdrop-blur-[2px]';

    const panelClass = state.isMobile
        ? 'h-[74vh] w-full overflow-hidden rounded-t-3xl border border-panel-border border-b-0 bg-panel shadow-[0_-20px_80px_rgba(2,8,24,0.55)]'
        : 'h-[70vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-panel-border bg-panel shadow-[0_30px_80px_rgba(2,8,24,0.55)]';

    const tabButtonClass =
        'inline-flex min-h-9 px-4 items-center justify-center rounded-full border text-[11px] font-semibold uppercase tracking-[0.12em] transition';

    return (
        <AccessibleModal
            open={savedDesignsModalOpen}
            onClose={closeSavedDesignsModal}
            backdropClassName={overlayClass}
            panelClassName={`${panelClass} flex flex-col`}
        >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/12 px-5 py-4 sm:px-6">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-panel-muted">My Account</div>
                    <h3 className="mt-1 text-lg font-semibold text-white">Saved Designs</h3>
                </div>
                <button
                    type="button"
                    onClick={closeSavedDesignsModal}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-white/50 hover:bg-white/10"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Body — auth check → login/signup form or designs list */}
            {authState === 'checking' ? (
                <div className="flex flex-1 items-center justify-center text-sm text-panel-muted">
                    Checking account…
                </div>
            ) : authState === 'logged-out' ? (
                /* ───── Inline Login / Signup ───── */
                <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8">
                    <div className="w-full max-w-sm space-y-5">
                        {/* Auth mode tabs */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => { setAuthMode('login'); setSignupError(''); }}
                                className={`flex-1 rounded-xl py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${authMode === 'login'
                                    ? 'bg-white/10 text-white'
                                    : 'text-panel-muted hover:text-white/70'
                                    }`}
                            >
                                Sign in
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAuthMode('signup'); setLoginError(''); }}
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
                            /* ── Login Fields ── */
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
                                            onChange={(e) => setLoginEmail(e.target.value)}
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
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    void handleLogin();
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
                                    onClick={() => void handleLogin()}
                                    disabled={loginLoading}
                                    className="btn-premium w-full rounded-xl text-sm font-semibold"
                                >
                                    {loginLoading ? 'Signing in…' : 'Sign in'}
                                </button>
                            </>
                        ) : (
                            /* ── Signup Fields ── */
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
                                                onChange={(e) => setSignupFirstName(e.target.value)}
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
                                                onChange={(e) => setSignupLastName(e.target.value)}
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
                                            onChange={(e) => setSignupEmail(e.target.value)}
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
                                            onChange={(e) => setSignupPassword(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    void handleSignup();
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
                                    onClick={() => void handleSignup()}
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
                            redirectTo={typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/configurator'}
                            className="rounded-xl border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10 hover:shadow-none"
                        />
                    </div>
                </div>
            ) : (
                /* ───── Designs List (authenticated) ───── */
                <>
                    {/* Controls */}
                    <div className="shrink-0 border-b border-white/5 bg-panel/95 px-5 py-4 backdrop-blur-xl sm:px-6 space-y-4">
                        {/* Tabs */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('current')}
                                className={`${tabButtonClass} ${activeTab === 'current'
                                    ? 'border-panel-accent bg-panel-light text-white shadow-[0_0_0_1px_rgba(30,167,255,0.25)]'
                                    : 'border-white/10 bg-white/5 text-panel-muted hover:border-white/30 hover:bg-white/10'
                                    }`}
                            >
                                Current Model
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('all')}
                                className={`${tabButtonClass} ${activeTab === 'all'
                                    ? 'border-panel-accent bg-panel-light text-white shadow-[0_0_0_1px_rgba(30,167,255,0.25)]'
                                    : 'border-white/10 bg-white/5 text-panel-muted hover:border-white/30 hover:bg-white/10'
                                    }`}
                            >
                                All Designs
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-panel-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search your designs..."
                                className="input input-dark h-10 rounded-full pl-10"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                        {savedDesignsLoading ? (
                            <div className="flex h-full items-center justify-center text-sm text-panel-muted">
                                Loading designs…
                            </div>
                        ) : savedDesignsError ? (
                            <div className="flex h-full items-center justify-center text-sm text-rose-400">
                                {savedDesignsError}
                            </div>
                        ) : filteredDesigns.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-panel-muted">
                                <p className="text-sm">No saved designs found.</p>
                                {activeTab === 'current' && (
                                    <button
                                        onClick={() => setActiveTab('all')}
                                        className="text-xs text-sky hover:underline"
                                    >
                                        View all designs
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {filteredDesigns.map((design) => {
                                    const isCurrentModel = design.keypadModel === state.modelCode;
                                    return (
                                        <button
                                            key={design.id}
                                            onClick={() => handleLoadDesign(design)}
                                            className="group relative flex flex-col items-start gap-1 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/30 hover:bg-white/10"
                                        >
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <span className="font-semibold text-white group-hover:text-sky transition-colors">{design.name}</span>
                                                {isCurrentModel && (
                                                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/70">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-panel-muted">
                                                {design.keypadModel} • {formatDate(design.updatedAt)}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        </AccessibleModal>
    );
}
