'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { getCookieConsent, setCookieConsent } from '../lib/consent';

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        if (getCookieConsent()) {
            setShowBanner(false);
            return;
        }

        const timer = setTimeout(() => setShowBanner(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleAccept = () => {
        setCookieConsent('accepted');
        setShowBanner(false);
    };

    const handleReject = () => {
        setCookieConsent('rejected');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-5xl md:bottom-8 md:left-8 md:right-8">
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-[#060a12]/95 p-6 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:gap-8">
                <div className="flex-1 space-y-2">
                    <h3 className="text-sm font-semibold text-white">We value your privacy</h3>
                    <p className="text-sm text-panel-muted">
                        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                        By clicking "Accept", you consent to our use of cookies.
                        Read our <Link href="/cookies" className="text-blue-400 hover:text-blue-300 hover:underline">Cookie Policy</Link>.
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                    <Button variant="ghost" onClick={handleReject} className="w-full justify-center md:w-auto">
                        Reject
                    </Button>
                    <Button variant="premium" onClick={handleAccept} className="w-full justify-center md:w-auto">
                        Accept
                    </Button>
                </div>
            </div>
        </div>
    );
}
