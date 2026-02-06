import Link from 'next/link';
import HeaderSearch from './HeaderSearch';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
            Keypad Store
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-ink/70 md:flex">
            <Link href="/shop" className="transition hover:text-ink">Shop</Link>
            <Link href="/configurator" className="transition hover:text-ink">Configurator</Link>
            <Link href="/account" className="transition hover:text-ink">Account</Link>
          </nav>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="md:hidden">
            <nav className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wide text-ink/60">
              <Link href="/shop" className="transition hover:text-ink">Shop</Link>
              <Link href="/configurator" className="transition hover:text-ink">Configurator</Link>
              <Link href="/account" className="transition hover:text-ink">Account</Link>
            </nav>
          </div>
          <HeaderSearch />
          <Link
            href="/login"
            className="hidden rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30 md:inline-flex"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
