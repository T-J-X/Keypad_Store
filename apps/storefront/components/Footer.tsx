import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="text-lg font-semibold tracking-tight">Keypad Store</div>
          <p className="text-sm text-ink/60">
            Premium keypads and icon systems designed for tactile workflows. Configure, save, and ship the exact layout
            your team needs.
          </p>
          <div className="flex items-center gap-3">
            <span className="pill">Made for builders</span>
            <span className="pill" style={{ background: 'rgba(74, 164, 255, 0.15)', color: '#1c4d7a' }}>
              Dev ready
            </span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">Store</div>
          <Link href="/shop" className="block text-ink/70 transition hover:text-ink">Shop icons</Link>
          <Link href="/configurator" className="block text-ink/70 transition hover:text-ink">Configure keypads</Link>
          <Link href="/account" className="block text-ink/70 transition hover:text-ink">Order history</Link>
          <Link href="/signup" className="block text-ink/70 transition hover:text-ink">Create account</Link>
        </div>

        <div className="space-y-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">Support</div>
          <span className="block text-ink/70">Support@keypad.store</span>
          <span className="block text-ink/70">Mon-Fri - 9am-6pm PT</span>
          <span className="block text-ink/70">Quick start guides</span>
          <span className="block text-ink/70">Shipping + returns</span>
        </div>

        <div className="space-y-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">Stay in the loop</div>
          <p className="text-ink/60">Monthly drops, new icon packs, and configurator previews.</p>
          <form className="flex gap-2">
            <input className="input" placeholder="Email address" aria-label="Email address" />
            <button className="btn-primary" type="button">Join</button>
          </form>
          <div className="text-xs text-ink/40">By subscribing you agree to our privacy policy.</div>
        </div>
      </div>

      <div className="border-t border-black/5 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 text-xs text-ink/45 md:flex-row md:items-center md:justify-between">
          <span>(c) 2026 Keypad Store. All rights reserved.</span>
          <div className="flex flex-wrap gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
