# 2026-02-22 UI/UX Audit

Scope reviewed (code-level):
- `/Users/terry/keypad-store/apps/frontend/components/navbar/*`
- `/Users/terry/keypad-store/apps/frontend/components/ui/*`
- `/Users/terry/keypad-store/apps/frontend/components/GlobalToastViewport.tsx`
- `/Users/terry/keypad-store/apps/frontend/components/configurator/PremiumToast.tsx`
- `/Users/terry/keypad-store/apps/frontend/components/AnimatedFooterLayout.tsx`

Method:
- Static audit against current UI code and current Web Interface Guidelines categories (focus visibility, keyboard interaction, labeling, motion/performance, responsive touch targets).

## Key Findings

1. Missing explicit labels on search inputs in modal/drawer contexts.
- Files:
  - `/Users/terry/keypad-store/apps/frontend/components/ui/SearchModal.tsx`
  - `/Users/terry/keypad-store/apps/frontend/components/ui/MobileMenu.tsx`
- Inputs rely on placeholder text only. Add `aria-label` and/or visible `<label>` to improve screen reader clarity and avoid placeholder-only labeling.

2. Search modal lacks robust keyboard focus trapping.
- File:
  - `/Users/terry/keypad-store/apps/frontend/components/ui/SearchModal.tsx`
- Modal closes on Escape, but focus trapping is custom/partial and tab order can escape modal context. Standardized dialog primitives are preferred for reliable keyboard containment.

3. Mobile menu drawer has custom overlay/dialog behavior without formal dialog primitives.
- File:
  - `/Users/terry/keypad-store/apps/frontend/components/ui/MobileMenu.tsx`
- Current implementation is functional but higher maintenance risk for keyboard and assistive-tech parity compared with standardized sheet/dialog primitives.

4. Extensive use of `transition-all` in interactive navigation components.
- Files:
  - `/Users/terry/keypad-store/apps/frontend/components/navbar/NavPill.tsx`
  - `/Users/terry/keypad-store/apps/frontend/components/navbar/NavbarView.tsx`
  - `/Users/terry/keypad-store/apps/frontend/components/ui/button.tsx`
- `transition-all` can animate non-composited properties and increase paint/reflow cost. Prefer targeted transition properties.

5. Motion reduction handling is not centralized.
- Files: multiple (`navbar`, modals, toasts, footer effects).
- There is no explicit `prefers-reduced-motion` strategy for key animated interactions (nav transitions, modal in/out, hover-heavy controls).

## Accessibility Risks

- Medium: Modal/drawer keyboard containment and labeling consistency can impact screen reader and keyboard-only users.
- Medium: Motion-heavy interactions without reduced-motion fallbacks can affect vestibular accessibility.
- Low-Medium: Some text/overlay combinations appear visually subtle and should be contrast-checked in live UI states (especially translucent surfaces).

## Regression Checklist (Desktop + Mobile)

### Navigation
- [x] Desktop navbar open/close and dropdown behavior functional.
- [x] Mobile menu open/close functional.
- [x] Navbar focus rings visible on primary controls.
- [ ] Full keyboard focus trap/loop confirmed for all nav overlays (manual browser verification pending).

### Dialog/Modal Surfaces
- [x] Shared modal infrastructure exists (`AccessibleModal`, shadcn `dialog` primitives available).
- [ ] Search modal fully aligned to standardized dialog primitive with guaranteed focus trap.
- [ ] Drawer/menu fully aligned to standardized sheet primitive.

### Toasts
- [x] Toast surface has `role="status"` and `aria-live="polite"`.
- [x] Toast close control includes explicit accessible label.
- [x] Toast viewport route-gated via runtime gate.

### Theme / Visual System
- [x] Tailwind v4 token architecture migrated to `:root` + `.dark` + `@theme inline`.
- [x] shadcn primitives integrated (`button/dialog/sheet/command/separator/sonner/accordion`).
- [ ] Live contrast verification across desktop/mobile states (manual pass pending).
- [ ] Reduced-motion fallback policy applied globally.

## Recommended Next Fixes (Prioritized)

1. Migrate `SearchModal` and `MobileMenu` to shadcn `Dialog`/`Sheet` primitives end-to-end.
2. Add explicit labels (`aria-label` or visible labels) to modal/drawer search inputs.
3. Replace `transition-all` with targeted transitions (`opacity`, `transform`, `color`, `background-color`) in high-traffic components.
4. Add a global `prefers-reduced-motion` strategy for modal/nav/toast/hover animations.
