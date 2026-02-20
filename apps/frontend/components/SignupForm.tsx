'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Toast from './ui/Toast';

/* ── Password-strength rules ─────────────────────────────────── */
const PASSWORD_RULES = [
    { key: 'length', label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
    { key: 'upper', label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
    { key: 'lower', label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
    { key: 'number', label: 'One number', test: (pw: string) => /\d/.test(pw) },
    {
        key: 'special',
        label: 'One special character',
        test: (pw: string) => /[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/~`\\"]/.test(pw),
    },
] as const;

export default function SignupForm() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    /* Derive rule pass/fail and overall validity */
    const ruleResults = useMemo(
        () => PASSWORD_RULES.map((rule) => ({ ...rule, pass: rule.test(password) })),
        [password],
    );
    const allRulesPass = ruleResults.every((r) => r.pass);
    const passwordsMatch = password === confirmPassword;
    const showMismatch = confirmPassword.length > 0 && !passwordsMatch;

    const handleSubmit = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            setError('Please enter your first and last name.');
            return;
        }
        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
            return;
        }
        if (!allRulesPass) {
            setError('Password does not meet all strength requirements.');
            return;
        }
        if (!passwordsMatch) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Step 1: Register
            const registerRes = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    password,
                }),
            });

            const registerData = await registerRes.json();

            if (!registerData.success) {
                setError(registerData.error || 'Registration failed. Please try again.');
                setLoading(false);
                return;
            }

            // Step 2: Auto-login
            const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const loginData = await loginRes.json();

            if (loginData.success) {
                const name = [loginData.firstName, loginData.lastName].filter(Boolean).join(' ');
                setToast(name ? `Welcome, ${name}!` : 'Account created!');
                setTimeout(() => {
                    window.location.assign('/account');
                }, 1500);
            } else {
                // Registration succeeded but auto-login failed (e.g. verification required)
                setToast('Account created! Please sign in.');
                setTimeout(() => {
                    window.location.assign('/login');
                }, 1500);
            }
        } catch {
            setError('Unable to connect. Please try again.');
        } finally {
            setLoading(false);
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
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label htmlFor="signup-first-name" className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">
                            First name <span className="text-rose-500 ml-0.5">*</span>
                        </label>
                        <input
                            id="signup-first-name"
                            name="firstName"
                            className="input input-dark"
                            type="text"
                            required
                            autoComplete="given-name"
                            placeholder="Jane"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="signup-last-name" className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">
                            Last name <span className="text-rose-500 ml-0.5">*</span>
                        </label>
                        <input
                            id="signup-last-name"
                            name="lastName"
                            className="input input-dark"
                            type="text"
                            required
                            autoComplete="family-name"
                            placeholder="Doe"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">
                        Email <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                        id="signup-email"
                        name="email"
                        className="input input-dark"
                        type="email"
                        required
                        autoComplete="email"
                        spellCheck={false}
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {/* ── Password ───────────────────────────────────────── */}
                <div className="space-y-2">
                    <label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">
                        Password <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                        id="signup-password"
                        name="password"
                        className="input input-dark"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Create a strong password…"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {/* ── Strength indicator ─────────────────────────────── */}
                {password.length > 0 && (
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {ruleResults.map((rule) => (
                            <li key={rule.key} className="flex items-center gap-1.5">
                                <span
                                    className={[
                                        'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-200',
                                        rule.pass
                                            ? 'bg-emerald-500/15 text-emerald-600'
                                            : 'bg-rose-500/15 text-rose-500',
                                    ].join(' ')}
                                >
                                    {rule.pass ? '✓' : '✗'}
                                </span>
                                <span className={rule.pass ? 'text-blue-100/60' : 'text-blue-100/40'}>
                                    {rule.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* ── Confirm password ──────────────────────────────── */}
                <div className="space-y-2">
                    <label htmlFor="signup-confirm-password" className="text-xs font-semibold uppercase tracking-wide text-blue-100/70">
                        Confirm password <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                        id="signup-confirm-password"
                        name="confirmPassword"
                        className={[
                            'input input-dark',
                            showMismatch ? 'ring-2 ring-rose-400/50' : '',
                        ].join(' ')}
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Re-enter your password…"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                    />
                    {showMismatch && (
                        <p className="text-xs text-rose-500">Passwords do not match.</p>
                    )}
                </div>

                <button
                    className="btn-glow-white w-full"
                    type="submit"
                    disabled={loading || !allRulesPass || showMismatch}
                >
                    {loading ? 'Creating account…' : 'Create account'}
                </button>
                <div className="text-xs text-blue-100/40">
                    By continuing you agree to our{' '}
                    <Link href="/terms" className="font-semibold text-blue-300 hover:text-white hover:underline">Terms</Link> and{' '}
                    <Link href="/privacy" className="font-semibold text-blue-300 hover:text-white hover:underline">Privacy Policy</Link>.
                </div>
            </form>

            {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        </>
    );
}
