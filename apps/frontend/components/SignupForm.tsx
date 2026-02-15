'use client';

import { useState } from 'react';
import Link from 'next/link';
import Toast from './ui/Toast';

export default function SignupForm() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            setError('Please enter your first and last name.');
            return;
        }
        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
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
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmit();
                }}
            >
                {error && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
                        {error}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label htmlFor="signup-first-name" className="text-xs font-semibold uppercase tracking-wide text-ink/50">First name</label>
                        <input
                            id="signup-first-name"
                            name="firstName"
                            className="input"
                            type="text"
                            autoComplete="given-name"
                            placeholder="Jane"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="signup-last-name" className="text-xs font-semibold uppercase tracking-wide text-ink/50">Last name</label>
                        <input
                            id="signup-last-name"
                            name="lastName"
                            className="input"
                            type="text"
                            autoComplete="family-name"
                            placeholder="Doe"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-wide text-ink/50">Email</label>
                    <input
                        id="signup-email"
                        name="email"
                        className="input"
                        type="email"
                        autoComplete="email"
                        spellCheck={false}
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-wide text-ink/50">Password</label>
                    <input
                        id="signup-password"
                        name="password"
                        className="input"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a strong password…"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <button className="btn-primary w-full" type="submit" disabled={loading}>
                    {loading ? 'Creating account…' : 'Create account'}
                </button>
                <div className="text-xs text-ink/50">
                    By continuing you agree to our{' '}
                    <Link href="/terms" className="font-semibold text-moss hover:underline">Terms</Link> and{' '}
                    <Link href="/privacy" className="font-semibold text-moss hover:underline">Privacy Policy</Link>.
                </div>
            </form>

            {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        </>
    );
}
