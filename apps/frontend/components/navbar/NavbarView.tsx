import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, Search, Settings2, ShoppingBag, Store, UserRound, X } from 'lucide-react';
import type { RefObject } from 'react';
import type { SessionSummary } from './types';
import NavPill from './NavPill';

const SearchModal = dynamic(() => import('../ui/SearchModal'), { ssr: false });
const MobileMenu = dynamic(() => import('../ui/MobileMenu'), { ssr: false });
const MiniCart = dynamic(() => import('../MiniCart'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-white/10 bg-[#0b1221] p-4 text-xs text-white/65">
      Loading cart...
    </div>
  ),
});

const shopCollectionLinks = [
  {
    href: '/shop?section=button-inserts',
    label: 'Button Inserts',
    description: 'Curated insert icons organized by discipline.',
  },
  {
    href: '/shop?section=keypads',
    label: 'Keypads',
    description: 'Hardware families and layout options.',
  },
  {
    href: '/shop?section=all',
    label: 'All Products',
    description: 'Unified view across inserts and keypads.',
  },
] as const;

type NavbarViewProps = {
  pathname: string | null;
  isScrolled: boolean;
  isVisible: boolean;
  isMenuOpen: boolean;
  isShopMenuOpen: boolean;
  isCartMenuOpen: boolean;
  isSearchOpen: boolean;
  isAccountMenuOpen: boolean;
  isLoggingOut: boolean;
  sessionSummary: SessionSummary;
  isAuthenticated: boolean;
  cartQuantity: number;
  customerLabel: string;
  desktopPanelClass: string;
  accountMenuRef: RefObject<HTMLDivElement | null>;
  accountButtonRef: RefObject<HTMLButtonElement | null>;
  shopMenuRef: RefObject<HTMLDivElement | null>;
  cartMenuRef: RefObject<HTMLDivElement | null>;
  onToggleMenu: () => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onCloseMenu: () => void;
  onOpenShopMenu: () => void;
  onScheduleCloseShopMenu: () => void;
  onCloseShopMenu: () => void;
  onToggleAccountMenu: () => void;
  onCloseAccountMenu: () => void;
  onToggleCartMenu: () => void;
  onCloseCartMenu: () => void;
  onLogout: () => void;
};

export default function NavbarView({
  pathname,
  isScrolled,
  isVisible,
  isMenuOpen,
  isShopMenuOpen,
  isCartMenuOpen,
  isSearchOpen,
  isAccountMenuOpen,
  isLoggingOut,
  sessionSummary,
  isAuthenticated,
  cartQuantity,
  customerLabel,
  desktopPanelClass,
  accountMenuRef,
  accountButtonRef,
  shopMenuRef,
  cartMenuRef,
  onToggleMenu,
  onOpenSearch,
  onCloseSearch,
  onCloseMenu,
  onOpenShopMenu,
  onScheduleCloseShopMenu,
  onCloseShopMenu,
  onToggleAccountMenu,
  onCloseAccountMenu,
  onToggleCartMenu,
  onCloseCartMenu,
  onLogout,
}: NavbarViewProps) {
  return (
    <>
      <SearchModal isOpen={isSearchOpen} onClose={onCloseSearch} />
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={onCloseMenu}
        isAuthenticated={isAuthenticated}
        cartQuantity={cartQuantity}
        onLogout={onLogout}
        onOpenSearch={onOpenSearch}
      />

      <header
        className={[
          'sticky top-0 z-50 transition-all duration-500 ease-in-out will-change-[transform,height,background-color]',
          isVisible ? 'translate-y-0' : '-translate-y-full',
          isScrolled
            ? 'h-[76px] border-b border-white/10 bg-[#020a18]/90 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl lg:h-[80px]'
            : 'h-20 border-b border-transparent bg-transparent shadow-[0_4px_24px_rgba(0,0,0,0.25)] lg:h-[84px]',
        ].join(' ')}
      >
        <div className="relative mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 lg:gap-8">
            <button
              type="button"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              onClick={onToggleMenu}
              className={[
                'inline-flex h-11 w-11 items-center justify-center rounded-full border transition lg:hidden',
                isScrolled
                  ? 'border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.14]'
                  : 'border-ink/15 bg-ink/[0.06] text-ink hover:bg-ink/[0.12]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40',
              ].join(' ')}
            >
              {isMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>

            <Link
              href="/"
              aria-label="Go to homepage"
              className={[
                'absolute left-1/2 -translate-x-1/2 transition-all duration-300 hover:opacity-85',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40',
                'lg:static lg:translate-x-0',
              ].join(' ')}
            >
              <Image
                src="/vct-logo.png"
                alt="Vehicle Control Technologies"
                width={200}
                height={64}
                className={[
                  'w-auto transition-all duration-500',
                  'h-14',
                  isScrolled ? 'brightness-0 invert' : '',
                ].join(' ')}
                priority
              />
            </Link>

            <nav className="hidden items-center gap-3 lg:flex" aria-label="Primary navigation">
              <div
                ref={shopMenuRef}
                className="relative"
                onMouseEnter={onOpenShopMenu}
                onMouseLeave={onScheduleCloseShopMenu}
              >
                <NavPill
                  href="/shop"
                  label="Shop"
                  icon={Store}
                  onClick={onCloseShopMenu}
                  inverse={isScrolled}
                  active={pathname === '/shop' || pathname?.startsWith('/shop/') || isShopMenuOpen}
                  as="link"
                  showLabel
                />

                <div
                  role="menu"
                  aria-label="Shop collections"
                  onMouseEnter={onOpenShopMenu}
                  onMouseLeave={onScheduleCloseShopMenu}
                  className={[
                    'absolute left-0 top-[calc(100%+8px)] z-30 w-[480px] rounded-3xl p-4 transition-all duration-200',
                    desktopPanelClass,
                    isShopMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
                  ].join(' ')}
                >
                  <div className="flex flex-col gap-1">
                    {shopCollectionLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={onCloseShopMenu}
                        className={[
                          'relative flex flex-col rounded-xl px-4 py-3 transition-all duration-200',
                          'text-white/80 hover:bg-white/[0.08] hover:text-white hover:pl-5',
                        ].join(' ')}
                      >
                        <div className="text-sm font-semibold tracking-wide text-white">{item.label}</div>
                        <div className="mt-0.5 text-xs text-white/50 group-hover:text-white/70">
                          {item.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <NavPill
                href="/configurator"
                label="Configurator"
                icon={Settings2}
                inverse={isScrolled}
                active={pathname === '/configurator' || pathname?.startsWith('/configurator/')}
                showLabel
              />
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden lg:block">
              <NavPill
                label="Search"
                icon={Search}
                onClick={onOpenSearch}
                inverse={isScrolled}
                as="button"
              />
            </div>

            {isAuthenticated ? (
              <div className="relative hidden lg:block" ref={accountMenuRef}>
                <NavPill
                  label={isAccountMenuOpen ? 'Close Menu' : 'Account'}
                  icon={UserRound}
                  buttonRef={accountButtonRef}
                  onClick={onToggleAccountMenu}
                  inverse={isScrolled}
                  active={pathname === '/account' || pathname?.startsWith('/account/') || isAccountMenuOpen}
                  as="button"
                />

                <div
                  role="menu"
                  aria-label="Account menu"
                  className={[
                    'absolute right-0 top-[calc(100%+8px)] z-20 min-w-[220px] rounded-3xl p-2 transition-all duration-200',
                    desktopPanelClass,
                    isAccountMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
                  ].join(' ')}
                >
                  <div className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-wider text-white/70">Account</div>
                  <Link
                    role="menuitem"
                    href="/account"
                    onClick={onCloseAccountMenu}
                    className={[
                      'block rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45',
                      'text-white/80 hover:bg-white/[0.08] hover:text-white',
                    ].join(' ')}
                  >
                    Profile
                  </Link>
                  <Link
                    role="menuitem"
                    href="/account?tab=orders"
                    onClick={onCloseAccountMenu}
                    className={[
                      'block rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45',
                      'text-white/80 hover:bg-white/[0.08] hover:text-white',
                    ].join(' ')}
                  >
                    Orders
                  </Link>
                  <Link
                    role="menuitem"
                    href="/account?tab=saved"
                    onClick={onCloseAccountMenu}
                    className={[
                      'block rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45',
                      'text-white/80 hover:bg-white/[0.08] hover:text-white',
                    ].join(' ')}
                  >
                    Saved Configurations
                  </Link>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className={[
                      'mt-1 block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45',
                      'text-white/80 hover:bg-white/[0.08] hover:text-white',
                    ].join(' ')}
                  >
                    {isLoggingOut ? 'Logging out...' : 'Log out'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden lg:block">
                <NavPill
                  href="/login"
                  label="Sign in"
                  icon={UserRound}
                  inverse={isScrolled}
                  active={pathname === '/login'}
                  showLabel
                />
              </div>
            )}

            <div className="relative" ref={cartMenuRef}>
              <NavPill
                href="/cart"
                label="View Cart"
                icon={ShoppingBag}
                badge={cartQuantity > 0 ? cartQuantity : undefined}
                inverse={isScrolled}
                active={pathname === '/cart' || isCartMenuOpen}
                showLabel={isCartMenuOpen}
                as="button"
                prefetch={false}
                onClick={onToggleCartMenu}
              />

              <div
                className={[
                  'absolute right-0 top-[calc(100%+8px)] z-20 w-[340px] rounded-3xl p-3 transition-all duration-300',
                  desktopPanelClass,
                  isCartMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
                ].join(' ')}
              >
                <MiniCart
                  lines={sessionSummary.cart?.lines || []}
                  currencyCode={sessionSummary.cart?.currencyCode || 'USD'}
                  totalWithTax={sessionSummary.cart?.totalWithTax || 0}
                  onClose={onCloseCartMenu}
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
