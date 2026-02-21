'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CopyrightYear from './CopyrightYear';

const footerGroups = [
    {
        title: 'Shop',
        links: [
            { label: 'All Products', href: '/shop' },
            { label: 'Button Inserts', href: '/shop?section=button-inserts' },
            { label: 'Keypads', href: '/shop?section=keypads' },
            { label: 'Quick Order', href: '/quick-order' },
        ],
    },
    {
        title: 'Configure',
        links: [
            { label: 'Build a Keypad', href: '/configurator' },
            { label: 'Saved Designs', href: '/account' },
        ],
    },
    {
        title: 'Support',
        links: [
            { label: 'Documentation', href: '/docs' },
            { label: 'Install Guides', href: '/guides' },
            { label: 'Contact Sales', href: '/contact' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About VCT', href: '/about' },
            { label: 'Partners', href: '/partners' },
            { label: 'Careers', href: '/careers' },
        ],
    },
];

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export default function AnimatedFooterLayout({ children }: { children: ReactNode }) {
    const footerWrapperRef = useRef<HTMLElement | null>(null);
    const footerParallaxRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let frameId: number | null = null;

        const updateParallax = () => {
            frameId = null;
            const footerElement = footerWrapperRef.current;
            const parallaxElement = footerParallaxRef.current;
            if (!footerElement || !parallaxElement) return;

            const rect = footerElement.getBoundingClientRect();
            const footerHeight = Math.max(rect.height, 1);
            const viewportHeight = window.innerHeight || 1;

            // Match the old "start end -> end end" offset behavior.
            const progress = clamp((viewportHeight - rect.top) / footerHeight, 0, 1);
            const startOffsetPx = footerHeight * 0.25;
            const y = -startOffsetPx * (1 - progress);

            parallaxElement.style.transform = `translate3d(0, ${y}px, 0)`;
        };

        const requestTick = () => {
            if (frameId !== null) return;
            frameId = window.requestAnimationFrame(updateParallax);
        };

        requestTick();
        window.addEventListener('scroll', requestTick, { passive: true });
        window.addEventListener('resize', requestTick);

        return () => {
            window.removeEventListener('scroll', requestTick);
            window.removeEventListener('resize', requestTick);
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId);
            }
        };
    }, []);

    return (
        <div className="bg-[#020a18] min-h-screen">
            <main
                className="relative z-10 bg-white flex flex-col min-h-screen rounded-b-2xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)] pb-8"
            >
                {children}
            </main>

            <footer ref={footerWrapperRef} className="relative z-0 overflow-hidden w-full bg-[#020a18]">
                <div
                    ref={footerParallaxRef}
                    className="w-full pt-20 pb-12 px-6 lg:px-8 text-white bg-gradient-to-b from-[#040e21] via-[#06152e] to-[#020a18] will-change-transform"
                    style={{ transform: 'translate3d(0, 0, 0)' }}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(30,100,180,0.12),transparent_60%)] pointer-events-none" />

                    <div className="relative z-10 mx-auto w-full max-w-7xl">
                        <div className="flex flex-col gap-12">
                            <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
                                <div className="max-w-md space-y-4">
                                    <Image
                                        src="/vct-logo.png"
                                        alt="Vehicle Control Technologies"
                                        width={240}
                                        height={80}
                                        className="h-16 w-auto brightness-0 invert"
                                    />
                                    <p className="text-sm leading-relaxed text-white/80">
                                        Engineering-grade vehicle control interfaces for demanding environments.
                                        Configure, customize, and order technical keypads with ease.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Stay updated</h3>
                                    <form className="relative flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            className="w-full rounded-xl border border-panel-ring bg-panel-input px-4 py-3 text-sm text-white placeholder:text-panel-muted focus:border-sky/50 focus:outline-none focus:ring-2 focus:ring-sky/20"
                                            aria-label="Email address for newsletter"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-1.5 top-1.5 flex h-[calc(100%-12px)] items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-ink transition hover:bg-white/90"
                                        >
                                            Subscribe
                                        </button>
                                    </form>
                                    <p className="text-xs text-panel-muted">
                                        Updates on new hardware families and software features.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 gap-y-10 md:grid-cols-4 lg:gap-8 mt-4">
                                {footerGroups.map((group) => (
                                    <div key={group.title} className="space-y-4">
                                        <div className="font-mono text-xs font-bold uppercase tracking-widest text-white/90">
                                            {group.title}
                                        </div>
                                        <ul className="space-y-3">
                                            {group.links.map((item) => (
                                                <li key={`${group.title}-${item.label}`}>
                                                    <Link
                                                        href={item.href}
                                                        className="block text-sm text-white/70 transition-colors hover:text-white"
                                                    >
                                                        {item.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            <div className="relative mt-8 pt-8">
                                <div
                                    className="absolute top-0 left-0 h-[1px] w-full shadow-[0_0_15px_1px_rgba(96,165,250,0.6)]"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.1) 10%, rgba(96,165,250,0.8) 35%, rgba(96,165,250,1) 50%, rgba(96,165,250,0.8) 65%, rgba(96,165,250,0.1) 90%, transparent 100%)'
                                    }}
                                />
                                <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 h-[2px] w-1/3 bg-transparent shadow-[0_0_20px_3px_rgba(96,165,250,0.8)] rounded-full blur-[1px]" />
                                <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
                                    <p className="text-xs text-panel-muted">
                                        &copy; <CopyrightYear /> Vehicle Control Technologies
                                    </p>

                                    <div className="flex flex-wrap gap-6 text-xs text-panel-muted">
                                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                                        <Link href="/cookies" className="hover:text-white transition-colors">Cookie Settings</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
