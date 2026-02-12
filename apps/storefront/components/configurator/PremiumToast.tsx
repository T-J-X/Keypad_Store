'use client';

import Link from 'next/link';
import { CheckCircle2, X } from 'lucide-react';

export type ToastPayload = {
  message: string;
  ctaHref: string;
  ctaLabel: string;
  visible?: boolean;
};

export default function PremiumToast({
  toast,
  onClose,
  offsetBottom = false,
}: {
  toast: ToastPayload | null;
  onClose: () => void;
  offsetBottom?: boolean;
}) {
  if (!toast) return null;

  return (
    <div
      className={[
        'fixed right-4 z-[95] w-[min(92vw,380px)] rounded-2xl border border-[#c9d4e8] bg-white/[0.98] p-4 text-ink shadow-[0_20px_60px_rgba(6,22,47,0.28)] backdrop-blur',
        offsetBottom ? 'bottom-24 lg:bottom-6' : 'bottom-6',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink">{toast.message}</div>
          <Link
            href={toast.ctaHref}
            className="mt-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#0b4ea2] transition-colors hover:bg-blue-50/70 hover:text-[#083f84] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b4ea2]/35"
          >
            {toast.ctaLabel}
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d5dbe8] text-[#53607a] transition hover:bg-[#f2f6ff]"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
