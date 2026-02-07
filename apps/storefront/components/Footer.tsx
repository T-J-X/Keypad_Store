import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/15 bg-black text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="text-lg font-semibold tracking-tight">Keypad Store</div>
          <p className="text-sm text-white/70">
            Premium keypads and button insert systems designed for tactile workflows. Configure, save, and ship the exact layout
            your team needs.
          </p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
              Made for builders
            </span>
            <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
              Dev ready
            </span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/45">Store</div>
          <Link href="/shop" className="block text-white/75 transition hover:text-white/90">Shop button inserts</Link>
          <Link href="/configurator" className="block text-white/75 transition hover:text-white/90">Configure keypads</Link>
          <Link href="/account" className="block text-white/75 transition hover:text-white/90">Order history</Link>
          <Link href="/signup" className="block text-white/75 transition hover:text-white/90">Create account</Link>
        </div>

        <div className="space-y-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/45">Support</div>
          <span className="block text-white/75">Support@keypad.store</span>
          <span className="block text-white/75">Mon-Fri - 9am-6pm PT</span>
          <span className="block text-white/75">Quick start guides</span>
          <span className="block text-white/75">Shipping + returns</span>
        </div>

        <div className="space-y-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/45">Stay in the loop</div>
          <p className="text-white/70">Monthly drops, new button insert packs, and configurator previews.</p>
          <form className="flex gap-2">
            <input
              className="input border-white/35 bg-white text-black placeholder:text-black/60"
              placeholder="Email address"
              aria-label="Email address"
            />
            <button
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-wide text-black transition hover:bg-white/85"
              type="button"
            >
              Join
            </button>
          </form>
          <div className="text-xs text-white/45">By subscribing you agree to our privacy policy.</div>
        </div>
      </div>

      <div className="border-t border-white/15 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <span>(c) 2026 Keypad Store. All rights reserved.</span>
          <div className="flex flex-wrap gap-4">
            <span className="transition hover:text-white/75">Privacy</span>
            <span className="transition hover:text-white/75">Terms</span>
            <span className="transition hover:text-white/75">Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
