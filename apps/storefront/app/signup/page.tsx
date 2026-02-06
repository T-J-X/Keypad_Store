import Link from 'next/link';

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
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Name</label>
            <input className="input" type="text" placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Email</label>
            <input className="input" type="email" placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Password</label>
            <input className="input" type="password" placeholder="Create a strong password" />
          </div>
          <button className="btn-primary w-full" type="button">Create account</button>
          <div className="text-xs text-ink/50">
            By continuing you agree to our Terms and Privacy Policy.
          </div>
        </form>
      </div>
    </div>
  );
}
