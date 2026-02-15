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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-20 pt-16 sm:px-6 lg:flex-row lg:items-start lg:gap-20 lg:px-8">
      <div className="flex-1 space-y-6 pt-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Welcome back.</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-panel-muted">
            Sign in to review orders, manage saved configurations, and continue building your next keypad layout.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
          </div>
          <div className="text-sm">
            <div className="font-medium text-white">New to VCT?</div>
            <Link href="/signup" className="text-blue-300 hover:text-blue-200 hover:underline">Create an account</Link> to get started.
          </div>
        </div>
      </div>

      <div className="card-panel w-full flex-1 p-6 sm:p-8">
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
