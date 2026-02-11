import Link from 'next/link';

const footerGroups = [
  {
    title: 'Shop',
    links: [
      { href: '/shop?section=button-inserts', label: 'Button Inserts' },
      { href: '/shop?section=keypads', label: 'Keypads' },
      { href: '/shop?section=all', label: 'All Products' },
      { href: '/cart', label: 'Cart' },
    ],
  },
  {
    title: 'Configure',
    links: [
      { href: '/configurator', label: 'Configurator' },
      { href: '/shop?section=keypads', label: 'Model Selection' },
      { href: '/account', label: 'Saved Layouts' },
      { href: '/order/TEST-CODE', label: 'Order Tracking' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/login', label: 'Account Help' },
      { href: '/signup', label: 'Create Account' },
      { href: '/shop', label: 'Catalog Guide' },
      { href: '/checkout', label: 'Checkout Help' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/', label: 'About Keypad Co.' },
      { href: '/', label: 'Shipping Policy' },
      { href: '/', label: 'Returns Policy' },
      { href: '/', label: 'Privacy' },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-6 pb-10 pt-14 lg:px-8">
        <div className="mb-10 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Keypad Co.</div>
              <div className="mt-2 text-xl font-semibold tracking-tight">Precision hardware for demanding control systems.</div>
            </div>
            <div className="text-sm text-white/70">Frontend `:3001` • Vendure `:3000`</div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-5">
          {footerGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/45">{group.title}</div>
              <div className="space-y-2.5 text-sm">
                {group.links.map((item) => (
                  <Link
                    key={`${group.title}-${item.label}`}
                    href={item.href}
                    className="block text-white/80 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/45">Newsletter</div>
            <p className="text-sm text-white/70">
              Stay in the loop on new keypad launches, insert drops, and configurator updates.
            </p>
            <form className="rounded-full border border-white/18 bg-white/[0.04] p-1">
              <div className="flex items-center gap-2">
                <input
                  className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/45"
                  placeholder="you@company.com"
                  aria-label="Email address"
                />
                <button
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-white/85"
                  type="button"
                >
                  Join
                </button>
              </div>
            </form>
            <div className="text-xs text-white/45">No spam. One concise update per month.</div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>(c) 2026 Keypad Co. All rights reserved.</span>
          <div className="flex flex-wrap gap-4">
            <span>Terms</span>
            <span>Privacy</span>
            <span>Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
