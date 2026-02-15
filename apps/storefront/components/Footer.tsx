import Link from 'next/link';

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
      { label: 'About Keypad Co.', href: '/about' },
      { label: 'Partners', href: '/partners' },
      { label: 'Careers', href: '/careers' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-panel-border bg-panel text-white overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,theme(colors.panel.DEFAULT),theme(colors.panel.light))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_70%)] opacity-40 pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-12 pt-16 lg:px-8">

        {/* Top Section: Newsletter & Intro */}
        <div className="mb-16 grid gap-12 lg:grid-cols-[1fr_400px]">
          <div className="max-w-md space-y-4">
            <h2 className="text-lg font-bold tracking-tight">Keypad Co.</h2>
            <p className="text-sm leading-relaxed text-white/80">
              Engineering-grade control interfaces for demanding environments.
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
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 lg:gap-8">
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
        <div className="mt-16 border-t border-white/5 pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-panel-muted">
              &copy; 2026 Keypad Co. All rights reserved.
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
