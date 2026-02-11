'use client';

import { useEffect, useState } from 'react';
import { notifyCartUpdated } from '../lib/cartEvents';

export default function PdpAddToCartButton({
  productVariantId,
}: {
  productVariantId?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const onAddToCart = async () => {
    if (!productVariantId || adding) return;
    setAdding(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/cart/add-item', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productVariantId, quantity: 1 }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Could not add this button insert to cart.');
      }

      notifyCartUpdated();
      setFeedback({ message: 'Added to cart', type: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not add this button insert to cart.';
      setFeedback({ message, type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setPulse(false), 4500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (feedback?.type !== 'success') return;
    const timer = window.setTimeout(() => {
      setFeedback((current) => (current?.type === 'success' ? null : current));
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onAddToCart}
        disabled={!productVariantId || adding}
        className={[
          'group relative isolate inline-flex w-full items-center justify-center gap-2 rounded-full border border-transparent px-6 py-4 text-sm font-medium text-white',
          'bg-[linear-gradient(90deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#203f7a_0%,#2f5da8_55%,#4b7fca_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box]',
          'transition-[background,box-shadow,transform] duration-300',
          'hover:bg-[linear-gradient(270deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#24497d_0%,#39629a_55%,#537bb0_100%)] hover:shadow-[0_0_0_1px_rgba(72,116,194,0.56),0_10px_24px_rgba(4,15,46,0.29)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29457A]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
          pulse ? 'animate-soft-pulse' : '',
          'disabled:cursor-not-allowed disabled:opacity-50',
        ].join(' ')}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(270deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.08)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-45" />
        <span className="pointer-events-none absolute -inset-[1px] -z-10 rounded-full bg-[linear-gradient(90deg,rgba(11,27,58,0.44)_0%,rgba(27,52,95,0.30)_55%,rgba(58,116,198,0.30)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-55" />
        {adding ? (
          <span className="relative z-10">Adding...</span>
        ) : (
          <span className="relative z-10">Add to cart</span>
        )}
      </button>
      {feedback && (
        <p
          className={feedback.type === 'success' ? 'text-sm font-bold text-ink' : 'text-sm font-semibold text-rose-700'}
          aria-live="polite"
        >
          {feedback.message}
        </p>
      )}
      {!productVariantId && <p className="text-xs text-ink/50">This product is currently unavailable for checkout.</p>}
    </div>
  );
}
