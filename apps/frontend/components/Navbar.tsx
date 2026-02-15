'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X, Settings2, Store } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import { usePathname } from 'next/navigation';
import { CART_UPDATED_EVENT, notifyCartUpdated } from '../lib/cartEvents';
import SearchModal from './ui/SearchModal';
import MobileMenu from './ui/MobileMenu';
import MiniCart from './MiniCart';

const primaryLinks = [{ href: '/configurator', label: 'Configurator' }] as const;

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

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

type SessionSummary = {
  authenticated: boolean;
  totalQuantity: number;
  customer: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddress?: string | null;
  } | null;
  cart: {
    totalWithTax: number;
    currencyCode: string;
    lines: Array<any>;
  } | null;
};

const EMPTY_SESSION_SUMMARY: SessionSummary = {
  authenticated: false,
  totalQuantity: 0,
  customer: null,
  cart: null,
};

function normalizeQuantity(input: unknown) {
  if (typeof input !== 'number' || !Number.isFinite(input)) return 0;
  return Math.max(0, Math.floor(input));
}

function NavPill({
  href,
  label,
  icon: Icon,
  onClick,
  inverse = false,
  badge,
  buttonRef,
  as = 'link',
  active = false,
  showLabel = false, // If true, label is always visible (not just on hover)
  expandOnHover = true,
}: {
  href?: string;
  label: string;
  icon?: typeof UserRound;
  onClick?: () => void;
  inverse?: boolean;
  badge?: number;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  as?: 'link' | 'button';
  active?: boolean;
  showLabel?: boolean;
  expandOnHover?: boolean;
}) {
  const isActiveStyle = active
    ? 'bg-blue-600/20 text-blue-200 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
    : '';

  const inactiveStyle = inverse
    ? 'border-white/10 bg-white/[0.06] text-white hover:border-white/20 hover:bg-white/[0.12]'
    : 'border-ink/10 bg-white/70 text-ink/80 hover:border-ink/20 hover:bg-white hover:text-ink';

  const baseClasses = [
    'group relative flex items-center rounded-full border transition-all duration-300',
    isActiveStyle || inactiveStyle,
    showLabel ? 'pr-5' : '',
  ].join(' ');

  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        {Icon ? <Icon className="h-[18px] w-[18px]" strokeWidth={2} /> : null}
        {badge ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#020916]">
            {badge}
          </span>
        ) : null}
      </div>

      {showLabel ? (
        <span className="text-sm font-medium">{label}</span>
      ) : (
        <div className={`max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ${expandOnHover ? 'group-hover:max-w-[120px] group-hover:opacity-100' : ''}`}>
          <span className="pr-4 text-sm font-medium">{label}</span>
        </div>
      )}
    </>
  );

  if (as === 'button') {
    return (
      <button ref={buttonRef} type="button" onClick={onClick} className={baseClasses}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href || '#'} onClick={onClick} className={baseClasses}>
      {content}
    </Link>
  );
}





export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [isCartMenuOpen, setIsCartMenuOpen] = useState(false); // New state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary>(EMPTY_SESSION_SUMMARY);

  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const shopMenuRef = useRef<HTMLDivElement | null>(null);
  const shopMenuCloseTimerRef = useRef<number | null>(null);
  const cartMenuRef = useRef<HTMLDivElement | null>(null);
  const cartMenuCloseTimerRef = useRef<number | null>(null);

  const openShopMenu = useCallback(() => {
    if (shopMenuCloseTimerRef.current != null) {
      window.clearTimeout(shopMenuCloseTimerRef.current);
      shopMenuCloseTimerRef.current = null;
    }
    setIsShopMenuOpen(true);
  }, []);

  const scheduleCloseShopMenu = useCallback(() => {
    if (shopMenuCloseTimerRef.current != null) {
      window.clearTimeout(shopMenuCloseTimerRef.current);
    }
    shopMenuCloseTimerRef.current = window.setTimeout(() => {
      setIsShopMenuOpen(false);
      shopMenuCloseTimerRef.current = null;
    }, 120);
  }, []);

  const openCartMenu = useCallback(() => {
    if (cartMenuCloseTimerRef.current != null) {
      window.clearTimeout(cartMenuCloseTimerRef.current);
      cartMenuCloseTimerRef.current = null;
    }
    setIsCartMenuOpen(true);
  }, []);

  const scheduleCloseCartMenu = useCallback(() => {
    if (cartMenuCloseTimerRef.current != null) {
      window.clearTimeout(cartMenuCloseTimerRef.current);
    }
    cartMenuCloseTimerRef.current = window.setTimeout(() => {
      setIsCartMenuOpen(false);
      cartMenuCloseTimerRef.current = null;
    }, 120);
  }, []);

  const refreshSessionSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/session/summary', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        setSessionSummary(EMPTY_SESSION_SUMMARY);
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as {
        authenticated?: boolean;
        totalQuantity?: number;
        customer?: SessionSummary['customer'];
      };

      setSessionSummary({
        authenticated: payload.authenticated === true,
        totalQuantity: normalizeQuantity(payload.totalQuantity),
        customer:
          payload.customer && typeof payload.customer.id === 'string'
            ? payload.customer
            : null,
        cart: (payload as any).cart || null,
      });
    } catch {
      setSessionSummary(EMPTY_SESSION_SUMMARY);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    void refreshSessionSummary();

    const onCartUpdated = () => {
      void refreshSessionSummary();
    };

    const onFocus = () => {
      void refreshSessionSummary();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshSessionSummary();
      }
    };

    const pollTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshSessionSummary();
      }
    }, 30000);

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated as EventListener);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(pollTimer);
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated as EventListener);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshSessionSummary]);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    if (!(isAccountMenuOpen || isShopMenuOpen || isCartMenuOpen)) return;

    const onPointerDown = (event: Event) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (
        accountMenuRef.current?.contains(target) ||
        accountButtonRef.current?.contains(target)
      ) {
        return;
      }

      if (shopMenuRef.current?.contains(target)) {
        return;
      }

      if (cartMenuRef.current?.contains(target)) {
        return;
      }

      setIsAccountMenuOpen(false);
      setIsShopMenuOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsAccountMenuOpen(false);
      setIsShopMenuOpen(false);
      setIsCartMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isAccountMenuOpen, isShopMenuOpen, isCartMenuOpen]);

  useEffect(() => {
    return () => {
      if (shopMenuCloseTimerRef.current != null) {
        window.clearTimeout(shopMenuCloseTimerRef.current);
      }
    };
  }, []);

  const onLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
      });
    } finally {
      setIsLoggingOut(false);
      setIsAccountMenuOpen(false);
      setIsMenuOpen(false);
      notifyCartUpdated();
      window.location.reload();
    }
  };

  const isAuthenticated = sessionSummary.authenticated;
  const cartQuantity = sessionSummary.totalQuantity;
  const showCartBadge = cartQuantity > 0;

  const customerLabel = useMemo(() => {
    const firstName = sessionSummary.customer?.firstName?.trim() || '';
    const lastName = sessionSummary.customer?.lastName?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
    const email = sessionSummary.customer?.emailAddress?.trim();
    if (email) return email;
    return 'Your account';
  }, [sessionSummary.customer]);

  const desktopPanelClass =
    'border border-white/10 bg-[#060a12]/90 backdrop-blur-2xl shadow-[0_24px_54px_rgba(0,0,0,0.6)] ring-1 ring-white/5';

  return (
    <>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        cartQuantity={cartQuantity}
        onLogout={onLogout}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <header
        className={[
          'sticky top-0 z-50 transition-all duration-500 will-change-[height,background-color]',
          isScrolled
            ? 'h-16 border-b border-white/10 bg-[rgba(6,10,18,0.92)] shadow-[0_16px_36px_rgba(2,8,24,0.6)] backdrop-blur-xl lg:h-[72px]'
            : 'h-20 border-b border-transparent bg-transparent lg:h-[88px]',
        ].join(' ')}
      >
        <div className="relative mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 lg:gap-8">
            <button
              type="button"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((current) => !current)}
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
                  isScrolled ? 'h-10 brightness-0 invert' : 'h-14',
                ].join(' ')}
                priority
              />
            </Link>

            <nav className="hidden items-center gap-3 lg:flex" aria-label="Primary navigation">

              {/* Shop Menu Trigger */}
              <div
                ref={shopMenuRef}
                className="relative"
                onMouseEnter={openShopMenu}
                onMouseLeave={scheduleCloseShopMenu}
              >
                <NavPill
                  href="/shop"
                  label="Shop"
                  icon={Store}
                  onClick={() => setIsShopMenuOpen(false)}
                  inverse={isScrolled}
                  active={pathname === '/shop' || pathname?.startsWith('/shop/')}
                  as="link"
                  showLabel
                />

                <div
                  role="menu"
                  aria-label="Shop collections"
                  onMouseEnter={openShopMenu}
                  onMouseLeave={scheduleCloseShopMenu}
                  className={[
                    'absolute left-0 top-[calc(100%+8px)] z-30 w-[480px] rounded-3xl p-4 transition-all duration-200',
                    desktopPanelClass,
                    isShopMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
                  ].join(' ')}
                >
                  <div className="grid gap-2">
                    {shopCollectionLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setIsShopMenuOpen(false)}
                        className={[
                          'rounded-xl border px-3 py-3 transition-colors',
                          'border-white/12 bg-white/[0.03] hover:border-white/32 hover:bg-white/[0.1]',
                        ].join(' ')}
                      >
                        <div className="text-sm font-semibold tracking-tight">{item.label}</div>
                        <div className="mt-1 text-xs text-white/70">
                          {item.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Configurator Link */}
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
                onClick={() => setIsSearchOpen(true)}
                inverse={isScrolled}
                as="button"
              />
            </div>

            {isAuthenticated ? (
              <div className="relative hidden lg:block" ref={accountMenuRef}>
                <NavPill
                  label={isAccountMenuOpen ? 'Close Menu' : customerLabel}
                  icon={UserRound}
                  buttonRef={accountButtonRef}
                  onClick={() => setIsAccountMenuOpen((current) => !current)}
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
                  <div className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-wider text-white/40">Account</div>
                  <Link
                    role="menuitem"
                    href="/account"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className={[
                      'block rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45',
                      'text-white/80 hover:bg-white/[0.08] hover:text-white',
                    ].join(' ')}
                  >
                    Profile & Orders
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
                />
              </div>
            )}

            <div
              className="relative"
              ref={cartMenuRef}
              onMouseEnter={openCartMenu}
              onMouseLeave={scheduleCloseCartMenu}
            >
              <NavPill
                href="/cart"
                label="View Cart"
                icon={ShoppingBag}
                badge={cartQuantity > 0 ? cartQuantity : undefined}
                inverse={isScrolled}
                active={pathname === '/cart' || isCartMenuOpen}
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
                  onClose={() => setIsCartMenuOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
