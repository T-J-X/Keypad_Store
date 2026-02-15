'use client';

import { useMemo, useState } from 'react';

export default function GoogleLoginButton({
  redirectTo = '/account',
  className = '',
}: {
  redirectTo?: string;
  className?: string;
}) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const href = useMemo(() => `/api/auth/google?next=${encodeURIComponent(redirectTo)}`, [redirectTo]);

  const onClick = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    window.location.assign(href);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isRedirecting}
      className={[
        'group inline-flex min-h-[44px] w-full items-center justify-center gap-3 rounded-2xl border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink whitespace-nowrap transition-[transform,box-shadow,border-color,background-color] duration-200',
        'hover:-translate-y-px hover:border-ink/25 hover:shadow-[0_10px_24px_rgba(14,17,26,0.10)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29457A]/40 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      ].join(' ')}
      aria-label="Continue with Google"
    >
      <GoogleIcon />
      <span>{isRedirecting ? 'Redirecting…' : 'Continue with Google'}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" role="img">
      <path d="M21.6 12.23c0-.71-.06-1.4-.2-2.06H12v3.9h5.38a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 2.99-4.28 2.99-7.36z" fill="#4285F4" />
      <path d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.22-2.5c-.9.6-2.04.95-3.4.95-2.6 0-4.8-1.76-5.58-4.12H3.1v2.58A10 10 0 0 0 12 22z" fill="#34A853" />
      <path d="M6.42 13.9A6 6 0 0 1 6.1 12c0-.66.11-1.3.32-1.9V7.52H3.1A10 10 0 0 0 2 12c0 1.62.39 3.15 1.1 4.48l3.32-2.58z" fill="#FBBC05" />
      <path d="M12 5.97c1.46 0 2.77.5 3.8 1.5l2.86-2.86A9.95 9.95 0 0 0 12 2 10 10 0 0 0 3.1 7.52l3.32 2.58C7.2 7.73 9.4 5.97 12 5.97z" fill="#EA4335" />
    </svg>
  );
}
