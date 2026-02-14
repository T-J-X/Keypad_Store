import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import { getSafeRelativePath } from '../../lib/googleAuth';

export const metadata: Metadata = {
  title: 'Login | Keypad Store',
  description: 'Sign in to manage keypad layouts and orders.',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: false,
    follow: false,
  },
};

type LoginSearchParams = {
  redirectTo?: string | string[];
  next?: string | string[];
};

function toStringParam(value?: string | string[]) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return '';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<LoginSearchParams>;
}) {
  return (
    <Suspense fallback={<LoginPageContent redirectTo="/account" />}>
      <LoginPageContent searchParamsPromise={searchParams} />
    </Suspense>
  );
}

async function LoginPageContent({
  searchParamsPromise,
  redirectTo: fallbackRedirectTo,
}: {
  searchParamsPromise?: Promise<LoginSearchParams>;
  redirectTo?: string;
}) {
  const resolvedSearchParams = (await searchParamsPromise) ?? {};
  const requestedRedirect = toStringParam(resolvedSearchParams.redirectTo)
    || toStringParam(resolvedSearchParams.next);
  const redirectTo = fallbackRedirectTo
    ?? getSafeRelativePath(requestedRedirect, '/account');

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-20 pt-16 lg:flex-row lg:items-center">
      <div className="flex-1 space-y-4">
        <div className="pill">Account</div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">Welcome back.</h1>
        <p className="max-w-md text-sm text-ink/60">
          Sign in to review orders, manage saved configurations, and continue building your next keypad layout.
        </p>
        <div className="card-soft p-4 text-xs text-ink/60">
          New to Keypad Store? <Link href="/signup" className="font-semibold text-moss">Create an account</Link>.
        </div>
      </div>

      <div className="card w-full flex-1 p-6">
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Email</label>
            <input className="input" type="email" placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Password</label>
            <input className="input" type="password" placeholder="********" />
          </div>
          <button className="btn-primary w-full" type="button">Sign in</button>
          <div className="relative py-1">
            <div className="h-px w-full bg-ink/10" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/45">
              Or
            </span>
          </div>
          <GoogleLoginButton redirectTo={redirectTo} />
          <div className="flex items-center justify-between text-xs text-ink/50">
            <span>Forgot your password?</span>
            <Link href="/signup" className="font-semibold text-moss">Create account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
