import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import SignupForm from '../../components/SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up | VCT',
  description: 'Create a VCT account to save and manage keypad configurations.',
  alternates: {
    canonical: '/signup',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupPage() {
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
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Join Vehicle Control Technologies</h1>
              <p className="text-base text-blue-100/70 leading-relaxed">
                Create an account to save your Keypad configurations, track orders, and get the latest news first.
              </p>
            </div>

            <div className="mt-12 rounded-2xl bg-blue-500/10 p-6 backdrop-blur-sm border border-blue-400/10">
              <h3 className="mb-2 font-semibold text-blue-200">Already have an account?</h3>
              <p className="mb-4 text-sm text-blue-100/60">Sign in to access your saved configurations and order history.</p>
              <Link
                href="/login"
                className="inline-flex items-center text-sm font-semibold text-white hover:text-blue-200 transition-colors"
              >
                Sign in <span aria-hidden="true" className="ml-1">→</span>
              </Link>
            </div>
          </div>

          {/* Right Panel (Signup Form) */}
          <div className="flex w-full flex-col justify-center bg-[#020916] p-8 lg:w-7/12 lg:p-16">
            <div className="mx-auto w-full max-w-md space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Create your account</h2>
                <p className="mt-2 text-sm text-panel-muted">
                  Enter your details below to get started.
                </p>
              </div>

              <SignupForm />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
