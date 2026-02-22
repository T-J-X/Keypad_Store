import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import SparkDivider from './ui/SparkDivider';
import FooterParallaxEnhancer from './layout/FooterParallaxEnhancer';

const footerGroups = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', href: '/shop' },
      { label: 'Button Inserts', href: '/shop?section=button-inserts' },
      { label: 'Keypads', href: '/shop?section=keypads' },
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
      { label: 'Careers', href: '/careers' },
    ],
  },
] as const;

const CURRENT_YEAR = 2026;

export default function AnimatedFooterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#020a18] min-h-screen">
      <main
        className="relative z-10 bg-white flex flex-col min-h-screen rounded-b-2xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)] pb-8"
      >
        {children}
      </main>

      <footer id="site-footer" className="relative z-0 overflow-hidden w-full bg-[#020a18]">
        <div
          id="site-footer-parallax"
          className="w-full origin-top pt-20 pb-12 px-6 text-white bg-gradient-to-b from-[#040e21] via-[#06152e] to-[#020a18] will-change-transform lg:px-8"
          style={{
            transform:
              'translate3d(0, var(--footer-parallax-y, 0px), 0) scale(var(--footer-parallax-scale, 1))',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(30,100,180,0.42),transparent_62%)]"
            style={{ opacity: 'var(--footer-glow-opacity, 0.2)' }}
          />
          <div
            className="pointer-events-none absolute -top-16 left-[6%] h-44 w-44 rounded-full bg-sky-500/18 blur-3xl"
            style={{ transform: 'translate3d(0, calc(var(--footer-parallax-y, 0px) * -0.35), 0)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 right-[8%] h-56 w-56 rounded-full bg-indigo-500/16 blur-3xl"
            style={{ transform: 'translate3d(0, calc(var(--footer-parallax-y, 0px) * 0.22), 0)' }}
          />

          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <div className="staggered flex flex-col gap-12">
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
                    <Button
                      type="button"
                      variant="premium"
                      size="sm"
                      className="absolute right-1.5 top-1.5 h-[calc(100%-12px)] rounded-lg px-3 text-[11px] uppercase tracking-[0.11em]"
                    >
                      Subscribe
                    </Button>
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
                <SparkDivider />
                <div className="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs text-panel-muted">
                    &copy; {CURRENT_YEAR} Vehicle Control Technologies
                  </p>

                  <div className="flex flex-wrap gap-6 text-xs text-panel-muted">
                    <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <FooterParallaxEnhancer footerId="site-footer" parallaxId="site-footer-parallax" />
    </div>
  );
}
