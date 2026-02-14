# SAFE_REFACTOR_REPORT

## Branch + SHAs
- Branch: `codex/chore/storefront-safe-refactor`
- Before SHA: `eefa8b4c8103779a369c55bf547143294dbfafe8`
- After SHA: `a0bf36b667dd5608a27265decca467468df3bf52`
- Commits:
  - `eadc203` refactor(storefront): optimize PDP related products and wrapper surface
  - `a0bf36b` fix(storefront): harden CTA buttons for mobile and improve form a11y

## Commands Run (Pass/Fail)
- `git status --short --branch` -> PASS
- `git checkout -b codex/chore/storefront-safe-refactor` -> PASS
- `git diff --name-only` + forbidden-path guard check -> PASS
- `pnpm --filter storefront typecheck` -> PASS
- `pnpm --filter storefront build` -> PASS
- post-change forbidden-path guard check (`git diff --name-only` filtered for forbidden paths) -> PASS

## Change Summary

### Waterfalls
- `apps/storefront/app/shop/product/[slug]/page.tsx`
- Reduced related-products fallback ranking overhead by replacing repeated `ranked.some(...)` checks with a `Set` membership check, while preserving behavior.

### Bundle
- No new runtime dependencies added.
- Kept changes in existing modules and class composition only.

### Rerender
- No risky state-model rewrites.
- Kept client state logic intact; focused on low-risk UI class and semantics updates.

### Rendering
- CTA class updates standardized min-height and stable radii to avoid layout collapse on narrow widths.
- Added explicit `bg-transparent` wrapper class on PDP component roots to keep product pages on the normal shop shell background.

### Mobile UX
- Hardened button/touch target patterns with `min-h-[44px]`, `whitespace-nowrap`, stable corner radius (`rounded-2xl`), and width guard patterns (`w-full sm:w-auto`, `min-w-*`) across storefront CTAs.
- Updated auth forms with explicit label/input pairing and input metadata (`id`, `name`, `autocomplete`, `spellCheck` for email).

### UI Fixes
- Product pages blue gradient background removal:
  - `apps/storefront/components/ProductPdp/ButtonInsertPdp.tsx` -> outer wrapper class now includes `bg-transparent`.
  - `apps/storefront/components/ProductPdp/KeypadPdp.tsx` -> outer wrapper class now includes `bg-transparent`.
  - Summary: PDP roots now explicitly use transparent wrapper styling so the default shop shell background is used.
- Squished round button prevention:
  - `apps/storefront/app/globals.css`: `.btn-primary`, `.btn-ghost`, `.btn-ghost-strong` now use stable radius, min-height, nowrap, inline-flex centering.
  - `apps/storefront/components/buttonStyles.ts`: shared button classes now include mobile width/min-width/nowrap guardrails.
  - Updated non-configurator CTA classes in:
    - `apps/storefront/app/cart/page.tsx`
    - `apps/storefront/app/checkout/page.tsx`
    - `apps/storefront/app/order/[code]/page.tsx`
    - `apps/storefront/components/BaseShopHero.tsx`
    - `apps/storefront/components/GoogleLoginButton.tsx`
    - `apps/storefront/components/ProductCard.tsx`
    - `apps/storefront/components/ProductPdp/KeypadPdp.tsx`
    - `apps/storefront/components/ProductPdp/PurchasePanel.tsx`
    - `apps/storefront/components/ShopClient.tsx`
    - `apps/storefront/components/order/OrderTechnicalSpecification.tsx`

## Alignment Safety
- FORBIDDEN ALIGNMENT FILES UNCHANGED: models/**, geometry.ts, KeypadPreview.tsx, configurator internals.
- Incident log: No forbidden paths appeared in `git diff --name-only`; no reverts were required.
