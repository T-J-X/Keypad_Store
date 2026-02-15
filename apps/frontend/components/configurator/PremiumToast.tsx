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
        'fixed right-4 z-[95] w-[min(92vw,380px)] rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl',
        offsetBottom ? 'bottom-24 lg:bottom-6' : 'bottom-6',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">{toast.message}</div>
          <Link
            href={toast.ctaHref}
            className="mt-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-blue-400 transition-colors hover:bg-white/5 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/35"
          >
            {toast.ctaLabel}
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-blue-100/80 transition hover:bg-white/10"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
