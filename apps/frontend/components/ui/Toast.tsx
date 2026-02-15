'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastProps = {
    message: string;
    duration?: number;
    onDismiss?: () => void;
};

export default function Toast({ message, duration = 4000, onDismiss }: ToastProps) {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);

    const dismiss = useCallback(() => {
        setExiting(true);
        setTimeout(() => {
            setVisible(false);
            onDismiss?.();
        }, 300);
    }, [onDismiss]);

    useEffect(() => {
        // Trigger enter animation on next frame
        requestAnimationFrame(() => setVisible(true));
        const timer = setTimeout(dismiss, duration);
        return () => clearTimeout(timer);
    }, [duration, dismiss]);

    if (typeof window === 'undefined') return null;

    const toast = (
        <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 transition-all duration-300 ${visible && !exiting
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }`}
        >
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#0c1526]/95 px-5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span className="text-sm font-medium text-white">{message}</span>
                <button
                    type="button"
                    onClick={dismiss}
                    className="ml-1 shrink-0 text-white/40 transition hover:text-white/80"
                    aria-label="Dismiss"
                >
                    ✕
                </button>
            </div>
        </div>
    );

    return createPortal(toast, document.body);
}
