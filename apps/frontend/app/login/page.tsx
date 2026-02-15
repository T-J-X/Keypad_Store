import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import LoginForm from '../../components/LoginForm';
import { getSafeRelativePath } from '../../lib/googleAuth';

export const metadata: Metadata = {
  title: 'Login | VCT',
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
          New to VCT? <Link href="/signup" className="font-semibold text-moss">Create an account</Link>.
        </div>
      </div>

      <div className="card w-full flex-1 p-6">
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
