import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { CART_UPDATED_EVENT, notifyCartUpdated } from '../../lib/cartEvents';
import { broadcastCartUpdated, subscribeCartUpdated } from '../../lib/cartSync';
import NavbarView from './NavbarView';
import { navbarReducer } from './reducer';
import {
  createInitialNavbarState,
  EMPTY_SESSION_SUMMARY,
  normalizeQuantity,
  type NavbarState,
  type SessionSummary,
} from './types';

export default function NavbarController() {
  const pathname = usePathname();
  const [state, dispatch] = useReducer(
    navbarReducer,
    undefined,
    createInitialNavbarState,
  );

  const patch = useCallback((nextPatch: Partial<NavbarState>) => {
    dispatch({ type: 'patch', patch: nextPatch });
  }, []);

  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const shopMenuRef = useRef<HTMLDivElement | null>(null);
  const shopMenuCloseTimerRef = useRef<number | null>(null);
  const cartMenuRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);
  const sessionSummaryHashRef = useRef(JSON.stringify(EMPTY_SESSION_SUMMARY));
  const inFlightRefreshRef = useRef<Promise<void> | null>(null);

  const setSessionSummaryIfChanged = useCallback((nextSummary: SessionSummary) => {
    const nextHash = JSON.stringify(nextSummary);
    if (nextHash === sessionSummaryHashRef.current) return;
    sessionSummaryHashRef.current = nextHash;
    patch({ sessionSummary: nextSummary });
  }, [patch]);

  const openShopMenu = useCallback(() => {
    if (shopMenuCloseTimerRef.current != null) {
      window.clearTimeout(shopMenuCloseTimerRef.current);
      shopMenuCloseTimerRef.current = null;
    }
    patch({ isShopMenuOpen: true });
  }, [patch]);

  const scheduleCloseShopMenu = useCallback(() => {
    if (shopMenuCloseTimerRef.current != null) {
      window.clearTimeout(shopMenuCloseTimerRef.current);
    }
    shopMenuCloseTimerRef.current = window.setTimeout(() => {
      patch({ isShopMenuOpen: false });
      shopMenuCloseTimerRef.current = null;
    }, 120);
  }, [patch]);

  const refreshSessionSummary = useCallback(() => {
    if (inFlightRefreshRef.current) return inFlightRefreshRef.current;

    const request = (async () => {
      try {
        const response = await fetch('/api/session/summary', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          setSessionSummaryIfChanged(EMPTY_SESSION_SUMMARY);
          return;
        }

        const payload = (await response.json().catch(() => ({}))) as {
          authenticated?: boolean;
          totalQuantity?: number;
          customer?: SessionSummary['customer'];
        };

        setSessionSummaryIfChanged({
          authenticated: payload.authenticated === true,
          totalQuantity: normalizeQuantity(payload.totalQuantity),
          customer:
            payload.customer && typeof payload.customer.id === 'string'
              ? payload.customer
              : null,
          cart: (payload as any).cart || null,
        });
      } catch {
        setSessionSummaryIfChanged(EMPTY_SESSION_SUMMARY);
      }
    })();

    inFlightRefreshRef.current = request.finally(() => {
      inFlightRefreshRef.current = null;
    });
    return inFlightRefreshRef.current;
  }, [setSessionSummaryIfChanged]);

  const closeDesktopMenus = useCallback(() => {
    patch({
      isAccountMenuOpen: false,
      isShopMenuOpen: false,
      isCartMenuOpen: false,
    });
  }, [patch]);

  const syncNavbarOnScroll = useCallback((currentScrollY: number) => {
    const nextIsScrolled = currentScrollY > 10;
    const nextIsVisible = (() => {
      if (currentScrollY < 10) {
        return true;
      }
      if (currentScrollY > lastScrollY.current && currentScrollY > 500) {
        return false;
      }
      if (currentScrollY < lastScrollY.current) {
        return true;
      }
      return state.isVisible;
    })();

    patch({
      isScrolled: nextIsScrolled,
      isVisible: nextIsVisible,
    });
    lastScrollY.current = currentScrollY;
  }, [patch, state.isVisible]);

  useEffect(() => {
    const onScroll = () => {
      syncNavbarOnScroll(window.scrollY);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [syncNavbarOnScroll]);

  useEffect(() => {
    void refreshSessionSummary();

    const onCartUpdated = () => {
      broadcastCartUpdated({ at: Date.now() });
      void refreshSessionSummary();
    };

    const unsubscribeCartSync = subscribeCartUpdated(() => {
      void refreshSessionSummary();
    });

    const onFocus = () => {
      void refreshSessionSummary();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshSessionSummary();
      }
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated as EventListener);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated as EventListener);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      unsubscribeCartSync();
    };
  }, [refreshSessionSummary]);

  useEffect(() => {
    if (!(state.isAccountMenuOpen || state.isShopMenuOpen || state.isCartMenuOpen)) return;

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

      closeDesktopMenus();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeDesktopMenus();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeDesktopMenus, state.isAccountMenuOpen, state.isShopMenuOpen, state.isCartMenuOpen]);

  useEffect(() => {
    return () => {
      if (shopMenuCloseTimerRef.current != null) {
        window.clearTimeout(shopMenuCloseTimerRef.current);
      }
    };
  }, []);

  const onLogout = useCallback(async () => {
    if (state.isLoggingOut) return;

    patch({ isLoggingOut: true });
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
      });
    } finally {
      patch({ isLoggingOut: false, isMenuOpen: false });
      closeDesktopMenus();
      notifyCartUpdated();
      window.location.reload();
    }
  }, [state.isLoggingOut, patch, closeDesktopMenus]);

  const isAuthenticated = state.sessionSummary.authenticated;
  const cartQuantity = state.sessionSummary.totalQuantity;

  const customerLabel = useMemo(() => {
    const firstName = state.sessionSummary.customer?.firstName?.trim() || '';
    const lastName = state.sessionSummary.customer?.lastName?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
    const email = state.sessionSummary.customer?.emailAddress?.trim();
    if (email) return email;
    return 'Your account';
  }, [state.sessionSummary.customer]);

  const desktopPanelClass =
    'border border-white/10 bg-[#0B1221]/95 backdrop-blur-2xl shadow-[0_24px_54px_rgba(0,0,0,0.6)] ring-1 ring-white/5';

  return (
    <NavbarView
      pathname={pathname}
      isScrolled={state.isScrolled}
      isVisible={state.isVisible}
      isMenuOpen={state.isMenuOpen}
      isShopMenuOpen={state.isShopMenuOpen}
      isCartMenuOpen={state.isCartMenuOpen}
      isSearchOpen={state.isSearchOpen}
      isAccountMenuOpen={state.isAccountMenuOpen}
      isLoggingOut={state.isLoggingOut}
      sessionSummary={state.sessionSummary}
      isAuthenticated={isAuthenticated}
      cartQuantity={cartQuantity}
      customerLabel={customerLabel}
      desktopPanelClass={desktopPanelClass}
      accountMenuRef={accountMenuRef}
      accountButtonRef={accountButtonRef}
      shopMenuRef={shopMenuRef}
      cartMenuRef={cartMenuRef}
      onToggleMenu={() => patch({ isMenuOpen: !state.isMenuOpen })}
      onOpenSearch={() => patch({ isSearchOpen: true })}
      onCloseSearch={() => patch({ isSearchOpen: false })}
      onCloseMenu={() => patch({ isMenuOpen: false })}
      onOpenShopMenu={openShopMenu}
      onScheduleCloseShopMenu={scheduleCloseShopMenu}
      onCloseShopMenu={() => patch({ isShopMenuOpen: false })}
      onToggleAccountMenu={() => patch({ isAccountMenuOpen: !state.isAccountMenuOpen })}
      onCloseAccountMenu={() => patch({ isAccountMenuOpen: false })}
      onToggleCartMenu={() => patch({ isCartMenuOpen: !state.isCartMenuOpen })}
      onCloseCartMenu={() => patch({ isCartMenuOpen: false })}
      onLogout={() => void onLogout()}
    />
  );
}
