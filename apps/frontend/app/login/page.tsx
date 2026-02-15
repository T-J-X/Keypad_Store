import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center px-4 py-12 lg:py-32 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-5xl rounded-[32px] p-[1px] shadow-[0_20px_60px_-15px_rgba(30,64,175,0.6)]">
        {/* Gradient Border Background */}
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-blue-500/20" />

        {/* Main Card Container */}
        <div className="relative flex min-h-[600px] w-full flex-col overflow-hidden rounded-[31px] bg-[#020916] lg:flex-row">

          {/* Left Panel (Info) */}
          <div className="flex w-full flex-col justify-between bg-[#081831] p-8 text-white lg:w-5/12 lg:p-12">
            <div className="space-y-6">
              <Image
                src="/vct-logo.png"
                alt="Vehicle Control Technologies"
                width={200}
                height={64}
                className="h-16 w-auto brightness-0 invert lg:h-20"
                priority
              />
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Welcome to Vehicle Control Technologies</h1>
              <p className="text-base text-blue-100/70 leading-relaxed">
                Log in to access your account. Track order progress, Manage & edit Keypad configurations and more!
              </p>
            </div>

            <div className="mt-12 rounded-2xl bg-blue-500/10 p-6 backdrop-blur-sm border border-blue-400/10">
              <h3 className="mb-2 font-semibold text-blue-200">New Customer?</h3>
              <p className="mb-4 text-sm text-blue-100/60">Create an account to save your designs and speed up checkout.</p>
              <Link
                href="/signup"
                className="inline-flex items-center text-sm font-semibold text-white hover:text-blue-200 transition-colors"
              >
                Create an account <span aria-hidden="true" className="ml-1">→</span>
              </Link>
            </div>
          </div>

          {/* Right Panel (Login Form) */}
          <div className="flex w-full flex-col justify-center bg-[#020916] p-8 lg:w-7/12 lg:p-16">
            <div className="mx-auto w-full max-w-md space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to your account</h2>
                <p className="mt-2 text-sm text-panel-muted">
                  Enter your details below to continue.
                </p>
              </div>

              <LoginForm redirectTo={redirectTo} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
