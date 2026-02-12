'use client';

import Link from 'next/link';
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import { CART_UPDATED_EVENT, notifyCartUpdated } from '../lib/cartEvents';

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
const MOBILE_SECTION_LABEL_CLASS = 'text-[10px] font-semibold uppercase tracking-widest text-white/45';
const MOBILE_DRAWER_LINK_CLASS =
  'flex min-h-12 items-center rounded-xl border border-white/10 px-4 py-3 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-black';
const MOBILE_DRAWER_SUBLINK_CLASS =
  'flex min-h-[52px] flex-col justify-center rounded-xl border border-white/10 px-4 py-3 text-left transition hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-black';

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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7aa0e4]/45 focus-visible:ring-offset-2',
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7aa0e4]/45 focus-visible:ring-offset-2',
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
  const [desktopSearch, setDesktopSearch] = useState('');

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary>(EMPTY_SESSION_SUMMARY);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const shopMenuRef = useRef<HTMLDivElement | null>(null);
  const shopMenuCloseTimerRef = useRef<number | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    lastFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusCloseButton = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const panel = menuPanelRef.current;
      if (!panel) {
        return;
      }

      const elements = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1,
      );

      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === first || !panel.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusCloseButton);
      window.removeEventListener('keydown', onKeyDown);
      body.style.overflow = previousOverflow;
      lastFocusedElementRef.current?.focus();
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!(isAccountMenuOpen || isShopMenuOpen || isSearchOpen)) return;

    const onPointerDown = (event: Event) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (
        accountMenuRef.current?.contains(target)
        || accountButtonRef.current?.contains(target)
      ) {
        return;
      }

      if (shopMenuRef.current?.contains(target)) {
        return;
      }

      if (
        searchPanelRef.current?.contains(target)
        || searchButtonRef.current?.contains(target)
      ) {
        return;
      }

      setIsAccountMenuOpen(false);
      setIsShopMenuOpen(false);
      setIsSearchOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsAccountMenuOpen(false);
      setIsShopMenuOpen(false);
      setIsSearchOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isAccountMenuOpen, isSearchOpen, isShopMenuOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    setIsAccountMenuOpen(false);
    setIsShopMenuOpen(false);
    setIsSearchOpen(false);
  }, [isMenuOpen]);

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
      void refreshSessionSummary();
      window.location.assign('/');
    }
  };

  const onDesktopSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = desktopSearch.trim();
    window.location.assign(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop');
    setIsSearchOpen(false);
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
      <header
        className={[
          'sticky top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300',
          isScrolled
            ? 'border-b border-white/14 bg-[rgba(6,10,18,0.34)] shadow-[0_16px_36px_rgba(2,8,24,0.3)] backdrop-blur-lg'
            : 'border-b border-transparent bg-transparent',
        ].join(' ')}
      >
        <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[74px] lg:px-8">
          <div className="flex min-w-0 items-center gap-3 lg:gap-8">
            <button
              type="button"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-controls="mobile-navigation"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((current) => !current)}
              className={[
                'inline-flex h-11 w-11 items-center justify-center rounded-full border transition lg:hidden',
                isScrolled
                  ? 'border-white/15 bg-white/[0.08] text-white hover:bg-white/[0.14]'
                  : 'border-ink/12 bg-white/70 text-ink hover:bg-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7aa0e4]/45 focus-visible:ring-offset-2',
                isScrolled ? 'focus-visible:ring-offset-black/40' : 'focus-visible:ring-offset-white',
              ].join(' ')}
            >
              {isMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>

            <Link
              href="/"
              aria-label="Go to homepage"
              className={[
                'absolute left-1/2 -translate-x-1/2 text-sm font-bold uppercase tracking-[0.22em] transition-opacity hover:opacity-85',
                isScrolled ? 'text-white' : 'text-ink',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7aa0e4]/45 focus-visible:ring-offset-2',
                isScrolled ? 'focus-visible:ring-offset-black/40' : 'focus-visible:ring-offset-white',
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
                    isScrolled ? 'text-white/80 hover:text-white' : 'text-ink/75 hover:text-ink',
                  ].join(' ')}
                >
                  <span>Shop</span>
                  <ChevronDown className={['h-4 w-4 transition-transform', isShopMenuOpen ? 'rotate-180' : 'rotate-0'].join(' ')} />
                  <span className={[
                    'absolute -bottom-1 left-0 h-px w-0 transition-all duration-300 group-hover:w-full',
                    isScrolled ? 'bg-white' : 'bg-ink',
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
                <NavTextLink key={item.href} href={item.href} label={item.label} inverse={isScrolled} />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="relative hidden lg:block">
              <IconButton
                label={isSearchOpen ? 'Close search' : 'Open search'}
                buttonRef={searchButtonRef}
                expanded={isSearchOpen}
                onClick={() => setIsSearchOpen((current) => !current)}
                inverse={isScrolled}
              >
                <Search className="h-4 w-4" strokeWidth={1.9} />
              </IconButton>

              <div
                ref={searchPanelRef}
                className={[
                  'absolute right-0 top-[calc(100%+12px)] z-30 w-[320px] rounded-2xl border p-3 backdrop-blur-xl transition-all duration-150',
                  desktopPanelClass,
                  isSearchOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
                ].join(' ')}
              >
                <form onSubmit={onDesktopSearchSubmit} className="flex items-center gap-2">
                  <input
                    ref={searchInputRef}
                    value={desktopSearch}
                    onChange={(event) => setDesktopSearch(event.target.value)}
                    placeholder="Search inserts, keypads, IDs"
                    aria-label="Search products"
                    className={[
                      'w-full rounded-full border px-4 py-2 text-sm outline-none transition',
                      'border-white/15 bg-white/[0.08] text-white placeholder:text-white/50 focus:border-white/35 focus:ring-2 focus:ring-white/20',
                    ].join(' ')}
                  />
                  <button
                    type="submit"
                    className={[
                      'inline-flex h-10 w-10 items-center justify-center rounded-full border transition',
                      'border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.14]',
                    ].join(' ')}
                    aria-label="Submit product search"
                  >
                    <Search className="h-4 w-4" strokeWidth={1.9} />
                  </button>
                </form>
              </div>
            </div>

            {isAuthenticated ? (
              <div className="relative hidden lg:block" ref={accountMenuRef}>
                <IconButton
                  label="Open account menu"
                  buttonRef={accountButtonRef}
                  expanded={isAccountMenuOpen}
                  onClick={() => setIsAccountMenuOpen((current) => !current)}
                  inverse={isScrolled}
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
                    'block rounded-xl px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7aa0e4]/45',
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
                    'mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7aa0e4]/45',
                    'text-white/85 hover:bg-white/[0.08] hover:text-white',
                  ].join(' ')}
                >
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            ) : (
              <IconLink href="/login" label="Sign in" className="hidden lg:inline-flex" inverse={isScrolled}>
                <UserRound className="h-4 w-4" strokeWidth={1.9} />
              </IconLink>
            )}

            <IconLink href="/cart" label="Open cart" className="relative" inverse={isScrolled}>
              <ShoppingBag className="h-4 w-4" strokeWidth={1.9} />
              {showCartBadge ? (
                <span
                  className={[
                    'absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none',
                    isScrolled ? 'border border-black/30 bg-white text-ink' : 'border border-white bg-ink text-white',
                  ].join(' ')}
                >
                  {cartQuantity}
                </span>
              ) : null}
            </IconLink>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] lg:hidden ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className={`absolute inset-0 bg-[rgba(5,8,14,0.62)] backdrop-blur-sm transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />

        <div
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          ref={menuPanelRef}
          className={`absolute inset-y-0 left-0 flex w-[90vw] max-w-[22rem] flex-col overflow-y-auto border-r border-white/12 bg-[#060a10] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 text-white shadow-[0_24px_58px_rgba(0,0,0,0.55)] transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-7 flex items-center justify-between">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-white">KEYPAD CO.</div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close navigation menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white transition hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <p className={MOBILE_SECTION_LABEL_CLASS}>Search</p>
            <Link
              href="/shop"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 inline-flex min-h-12 w-full items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <Search className="h-4 w-4" />
              Search products
            </Link>
          </div>

          <nav aria-label="Mobile primary navigation" className="space-y-4">
            <div className="space-y-2">
              <p className={MOBILE_SECTION_LABEL_CLASS}>Shop</p>
              <Link
                href="/shop"
                onClick={() => setIsMenuOpen(false)}
                className={MOBILE_DRAWER_LINK_CLASS}
              >
                Shop Home
              </Link>
              <Link
                href="/shop?section=button-inserts"
                onClick={() => setIsMenuOpen(false)}
                className={MOBILE_DRAWER_SUBLINK_CLASS}
              >
                <span className="text-base font-semibold text-white">Button Inserts</span>
                <span className="mt-0.5 text-xs text-white/62">Category-sorted icon library</span>
              </Link>
              <Link
                href="/shop?section=keypads"
                onClick={() => setIsMenuOpen(false)}
                className={MOBILE_DRAWER_SUBLINK_CLASS}
              >
                <span className="text-base font-semibold text-white">Keypads</span>
                <span className="mt-0.5 text-xs text-white/62">Hardware models and layouts</span>
              </Link>
            </div>

            <div className="space-y-2">
              <p className={MOBILE_SECTION_LABEL_CLASS}>Build</p>
              <Link
                href="/configurator"
                onClick={() => setIsMenuOpen(false)}
                className={MOBILE_DRAWER_LINK_CLASS}
              >
                Configurator
              </Link>
            </div>
          </nav>

          <div className="my-5 h-px w-full bg-white/12" />

          <nav aria-label="Mobile secondary navigation" className="space-y-2">
            <p className={MOBILE_SECTION_LABEL_CLASS}>Account</p>
            {isAuthenticated ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex min-h-12 items-center rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={isLoggingOut}
                  className="block min-h-12 w-full rounded-xl border border-white/10 px-4 py-3 text-left text-sm font-medium text-white/90 transition hover:border-white/30 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex min-h-12 items-center rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex min-h-12 items-center rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  Create account
                </Link>
              </>
            )}
          </nav>

          <div className="mt-5 rounded-2xl border border-white/12 bg-white/[0.04] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/55">Cart status</p>
            <div className="mt-2 text-sm text-white/85">
              {showCartBadge ? `${cartQuantity} item${cartQuantity > 1 ? 's' : ''} in cart` : 'Cart is empty'}
            </div>
            <Link
              href="/cart"
              onClick={() => setIsMenuOpen(false)}
              className="mt-3 inline-flex min-h-11 items-center rounded-full border border-white/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Open cart
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
