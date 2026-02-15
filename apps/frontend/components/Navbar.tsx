'use client';

import Link from 'next/link';
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import { CART_UPDATED_EVENT, notifyCartUpdated } from '../lib/cartEvents';
import SearchModal from './ui/SearchModal';
import MobileMenu from './ui/MobileMenu';

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
};

const EMPTY_SESSION_SUMMARY: SessionSummary = {
  authenticated: false,
  totalQuantity: 0,
  customer: null,
};

function normalizeQuantity(input: unknown) {
  if (typeof input !== 'number' || !Number.isFinite(input)) return 0;
  return Math.max(0, Math.floor(input));
}

function NavTextLink({
  href,
  label,
  onClick,
  inverse = false,
}: {
  href: string;
  label: string;
  onClick?: () => void;
  inverse?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'group relative text-sm font-medium tracking-tight transition-colors duration-200',
        inverse ? 'text-white/78 hover:text-white' : 'text-ink/75 hover:text-ink',
      ].join(' ')}
    >
      <span>{label}</span>
      <span
        className={[
          'absolute -bottom-1 left-0 h-px w-0 transition-all duration-300 group-hover:w-full',
          inverse ? 'bg-white' : 'bg-ink',
        ].join(' ')}
      />
    </Link>
  );
}

function IconLink({
  href,
  label,
  children,
  className = '',
  onClick,
  inverse = false,
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  inverse?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      onClick={onClick}
      className={[
        'inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition-all duration-200',
        inverse
          ? 'border-white/15 bg-white/[0.06] text-white/85 hover:-translate-y-px hover:border-white/28 hover:bg-white/[0.14] hover:text-white'
          : 'border-ink/10 bg-white/70 text-ink/75 hover:-translate-y-px hover:border-ink/20 hover:bg-white hover:text-ink',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45 focus-visible:ring-offset-2',
        inverse ? 'focus-visible:ring-offset-black/30' : 'focus-visible:ring-offset-white',
        className,
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

function IconButton({
  label,
  children,
  className = '',
  onClick,
  buttonRef,
  expanded,
  inverse = false,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  expanded?: boolean;
  inverse?: boolean;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      aria-haspopup={expanded === undefined ? undefined : 'menu'}
      aria-expanded={expanded}
      onClick={onClick}
      className={[
        'inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition-all duration-200',
        inverse
          ? 'border-white/15 bg-white/[0.06] text-white/85 hover:-translate-y-px hover:border-white/28 hover:bg-white/[0.14] hover:text-white'
          : 'border-ink/10 bg-white/70 text-ink/75 hover:-translate-y-px hover:border-ink/20 hover:bg-white hover:text-ink',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45 focus-visible:ring-offset-2',
        inverse ? 'focus-visible:ring-offset-black/30' : 'focus-visible:ring-offset-white',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary>(EMPTY_SESSION_SUMMARY);

  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const shopMenuRef = useRef<HTMLDivElement | null>(null);
  const shopMenuCloseTimerRef = useRef<number | null>(null);

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
    }, 180);
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
    if (!(isAccountMenuOpen || isShopMenuOpen)) return;

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

      setIsAccountMenuOpen(false);
      setIsShopMenuOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsAccountMenuOpen(false);
      setIsShopMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isAccountMenuOpen, isShopMenuOpen]);

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
    'border-white/18 bg-[rgba(7,12,20,0.78)] text-white shadow-[0_24px_54px_rgba(0,0,0,0.42)]';

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
          'sticky top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300',
          isScrolled
            ? 'border-b border-white/10 bg-[rgba(6,10,18,0.85)] shadow-[0_16px_36px_rgba(2,8,24,0.6)] backdrop-blur-xl'
            : 'border-b border-transparent bg-[rgba(6,10,18,0.5)] backdrop-blur-md',
        ].join(' ')}
      >
        <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[74px] lg:px-8">
          <div className="flex min-w-0 items-center gap-3 lg:gap-8">
            <button
              type="button"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((current) => !current)}
              className={[
                'inline-flex h-11 w-11 items-center justify-center rounded-full border transition lg:hidden',
                'border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.14]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40',
              ].join(' ')}
            >
              {isMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>

            <Link
              href="/"
              aria-label="Go to homepage"
              className={[
                'absolute left-1/2 -translate-x-1/2 text-sm font-bold uppercase tracking-[0.22em] transition-opacity hover:opacity-85',
                'text-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40',
                'lg:static lg:translate-x-0 lg:text-[15px]',
              ].join(' ')}
            >
              KEYPAD CO.
            </Link>

            <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
              <div
                ref={shopMenuRef}
                className="relative"
                onMouseEnter={openShopMenu}
                onMouseLeave={scheduleCloseShopMenu}
              >
                <Link
                  href="/shop"
                  aria-haspopup="menu"
                  aria-expanded={isShopMenuOpen}
                  onClick={() => setIsShopMenuOpen(false)}
                  onFocus={openShopMenu}
                  className={[
                    'group relative inline-flex items-center gap-1 text-sm font-medium tracking-tight transition-colors duration-200',
                    'text-white/80 hover:text-white',
                  ].join(' ')}
                >
                  <span>Shop</span>
                  <ChevronDown className={['h-4 w-4 transition-transform', isShopMenuOpen ? 'rotate-180' : 'rotate-0'].join(' ')} />
                  <span className={[
                    'absolute -bottom-1 left-0 h-px w-0 transition-all duration-300 group-hover:w-full',
                    'bg-white',
                  ].join(' ')} />
                </Link>

                <div
                  role="menu"
                  aria-label="Shop collections"
                  onMouseEnter={openShopMenu}
                  onMouseLeave={scheduleCloseShopMenu}
                  className={[
                    'absolute left-0 top-[calc(100%+14px)] z-30 w-[480px] rounded-2xl border p-4 backdrop-blur-xl transition-all duration-150',
                    desktopPanelClass,
                    isShopMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
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

              {primaryLinks.map((item) => (
                <NavTextLink key={item.href} href={item.href} label={item.label} inverse={true} />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="relative hidden lg:block">
              <IconButton
                label={'Open search'}
                expanded={isSearchOpen}
                onClick={() => setIsSearchOpen(true)}
                inverse={true}
              >
                <Search className="h-4 w-4" strokeWidth={1.9} />
              </IconButton>
            </div>

            {isAuthenticated ? (
              <div className="relative hidden lg:block" ref={accountMenuRef}>
                <IconButton
                  label="Open account menu"
                  buttonRef={accountButtonRef}
                  expanded={isAccountMenuOpen}
                  onClick={() => setIsAccountMenuOpen((current) => !current)}
                  inverse={true}
                >
                  <UserRound className="h-4 w-4" strokeWidth={1.9} />
                </IconButton>

                <div
                  role="menu"
                  aria-label="Account menu"
                  className={[
                    'absolute right-0 top-[calc(100%+12px)] z-20 min-w-[206px] rounded-2xl border p-2 backdrop-blur-xl transition-all duration-150',
                    desktopPanelClass,
                    isAccountMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
                  ].join(' ')}
                >
                  <div className="px-2 pb-2 pt-1 text-xs font-medium text-white/60">{customerLabel}</div>
                  <Link
                    role="menuitem"
                    href="/account"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className={[
                      'block rounded-xl px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45',
                      'text-white/85 hover:bg-white/[0.08] hover:text-white',
                    ].join(' ')}
                  >
                    Profile
                  </Link>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={onLogout}
                    disabled={isLoggingOut}
                    className={[
                      'mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/45',
                      'text-white/85 hover:bg-white/[0.08] hover:text-white',
                    ].join(' ')}
                  >
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            ) : (
              <IconLink href="/login" label="Sign in" className="hidden lg:inline-flex" inverse={true}>
                <UserRound className="h-4 w-4" strokeWidth={1.9} />
              </IconLink>
            )}

            <IconLink href="/cart" label="Open cart" className="relative" inverse={true}>
              <ShoppingBag className="h-4 w-4" strokeWidth={1.9} />
              {showCartBadge ? (
                <span
                  className={[
                    'absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none',
                    'border border-black/30 bg-white text-ink',
                  ].join(' ')}
                >
                  {cartQuantity}
                </span>
              ) : null}
            </IconLink>
          </div>
        </div>
      </header>
    </>
  );
}
