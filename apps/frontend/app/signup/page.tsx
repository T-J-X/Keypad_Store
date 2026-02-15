import type { Metadata } from 'next';
import Link from 'next/link';
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-20 pt-16 lg:flex-row lg:items-center">
      <div className="flex-1 space-y-4">
        <div className="pill">Create account</div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">Start building today.</h1>
        <p className="max-w-md text-sm text-ink/60">
          Save layouts, track orders, and share configurations with teammates. We will keep everything ready for your
          next build.
        </p>
        <div className="card-soft p-4 text-xs text-ink/60">
          Already have an account? <Link href="/login" className="font-semibold text-moss">Sign in</Link>.
        </div>
      </div>

      <div className="card w-full flex-1 p-6">
        <SignupForm />
      </div>
    </div>
  );
}
