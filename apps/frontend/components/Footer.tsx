import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
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

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#040e21] via-[#06152e] to-[#020a18] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(30,100,180,0.12),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-12 pt-16 lg:px-8">

        {/* Top Section: Newsletter & Intro */}
        <div className="mb-16 grid gap-12 lg:grid-cols-[1fr_400px]">
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

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-8 gap-y-10 md:grid-cols-4 lg:gap-8">
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

        {/* Bottom Section */}
        <div className="relative mt-16 pt-8">
          <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_2px_rgba(96,165,250,0.6)]" />
          <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-panel-muted">
              &copy; <Suspense fallback={<span>----</span>}><CopyrightYear /></Suspense> Vehicle Control Technologies
            </p>

            <div className="flex flex-wrap gap-6 text-xs text-panel-muted">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookie Settings</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
