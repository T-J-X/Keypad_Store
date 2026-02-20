/* eslint-disable jsx-a11y/label-has-associated-control */
'use client';

import React from 'react';
import Link from 'next/link';
import GoogleLoginButton from './GoogleLoginButton';
import Toast from './ui/Toast';

type LoginState = {
    email: string;
    password: string;
    error: string;
    loading: boolean;
    toast: string | null;
};

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
    const [state, updateState] = React.useReducer(
        (prev: LoginState, next: Partial<LoginState>) => ({ ...prev, ...next }),
        { email: '', password: '', error: '', loading: false, toast: null }
    );
    const { email, password, error, loading, toast } = state;

    const handleSubmit = async () => {
        if (!email.trim() || !password) {
            updateState({ error: 'Please enter your email and password.' });
            return;
        }

        updateState({ loading: true, error: '' });

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const data = await res.json();

            if (data.success) {
                const name = [data.firstName, data.lastName].filter(Boolean).join(' ');
                if (name) {
                    updateState({ toast: `Welcome back, ${name}` });
                    // Wait for toast to be visible before redirecting
                    setTimeout(() => {
                        window.location.assign(redirectTo);
                    }, 1500);
                } else {
                    window.location.assign(redirectTo);
                }
            } else {
                updateState({ error: data.error || 'Login failed. Please try again.' });
            }
        } catch {
            updateState({ error: 'Unable to connect. Please try again.' });
        } finally {
            updateState({ loading: false });
        }
    };

    return (
        <>
            <form
                className="space-y-4"
                action={handleSubmit}
            >
                {error && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
                        {error}
                    </div>
                )}
                <div className="space-y-2">
                    <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">
                        Email <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                        id="login-email"
                        name="email"
                        className="input input-dark"
                        type="email"
                        required
                        autoComplete="email"
                        spellCheck={false}
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => updateState({ email: e.target.value })}
                        disabled={loading}
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">
                        Password <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                        id="login-password"
                        name="password"
                        className="input input-dark"
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="Enter your password…"
                        value={password}
                        onChange={(e) => updateState({ password: e.target.value })}
                        disabled={loading}
                    />
                </div>
                <button className="btn-glow-white w-full" type="submit" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>
                <div className="relative py-1">
                    <div className="h-px w-full bg-white/10" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#060a12] px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-panel-muted">
                        Or
                    </span>
                </div>
                <GoogleLoginButton redirectTo={redirectTo} />
                <div className="flex items-center justify-between text-xs text-panel-muted">
                    <button type="button" className="hover:text-white hover:underline">Forgot your password?</button>
                    <Link href="/signup" className="font-semibold text-[#6fd0ff] hover:text-[#9dcfff]">Create account</Link>
                </div>
            </form>

            {toast && <Toast message={toast} onDismiss={() => updateState({ toast: null })} />}
        </>
    );
}
