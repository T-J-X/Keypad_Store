# Shop UI/UX Handoff (Storefront)

Last updated: 2026-02-06

## Scope of this thread
- This thread handled Shop UI/UX work only.
- Configurator build logic is deferred to another thread.
- Product detail expansion is deferred to a new thread.

## Locked data/source rules
- Category source of truth is `Product.customFields.iconCategories` (`string[]`).
- No Vendure Collections / `iconCategoryPath` usage in shop filtering.
- Frontend-only changes (no backend schema/model changes for this workstream).

## Current URL/state model
- `section=button-inserts|keypads` (canonical is `button-inserts`).
- Back-compat aliases still accepted for inserts section: `section=icons`, `section=inserts`.
- Search query: `q`.
- Category filters:
  - multi-select canonical: `cats=engine,lights,numbers`
  - legacy back-compat: `cat=<slug>`
- Pagination params: `page`, `take`.

## Implemented shop behavior
- Server-fetched shop data via App Router server components.
- Two top-level sections in sidebar:
  - `Button Inserts`
  - `Keypads`
- `Button Inserts` uses collapsible nested category list.
- Multi-select category filtering (OR union) for inserts.
- Search + categories work together.
- `Clear all filters` + removable chips implemented.
- Pagination active for inserts list, including category views with larger result sets.
- Section switching keeps behavior stable and resets page when needed.

## Sidebar UX state
- Sidebar uses consistent pill row sizing via shared class tokens in `ShopClient`.
- Nested rows under expanded `Button Inserts` are indented via wrapper padding.
- Subtle divider between inserts block and keypads row:
  - `<div aria-hidden className="my-2 border-t border-ink/10" />`
- Current layout baseline in sidebar card:
  - card content wrapper uses `px-4 py-3`
  - nested wrapper uses `pl-2.5`

## Cards and grid
- Insert cards:
  - metadata order: Name -> ID -> Category
  - larger, bolder price
  - larger add-to-cart button
  - success feedback is black + bold and auto-clears after 10s
  - category label is clickable and navigates to that category in shop
- Keypad cards:
  - widened desktop presentation
  - larger media area in shop mode
  - consistent button styling with insert cards

## Breadcrumb/origin behavior
- Product links include origin/shop params.
- For multi-category selection, breadcrumb category now resolves to a relevant category for the clicked product (not always the first selected filter).

## Header behavior (global)
- Header is sticky.
- Header has scroll shrink animation.
- Header hides on downward scroll and reappears on upward scroll.
- Hide threshold is intentionally delayed:
  - `HIDE_AFTER_SCROLL_Y = 220`

## Typography/style reuse introduced
- Shared button style tokens:
  - `apps/storefront/components/buttonStyles.ts`
- Shared card typography tokens:
  - `apps/storefront/components/cardTypography.ts`

## Primary storefront files touched in this workstream
- `apps/storefront/app/shop/page.tsx`
- `apps/storefront/components/ShopClient.tsx`
- `apps/storefront/components/ProductCard.tsx`
- `apps/storefront/components/KeypadCard.tsx`
- `apps/storefront/app/product/[slug]/page.tsx`
- `apps/storefront/components/Header.tsx`
- `apps/storefront/app/globals.css`
- `apps/storefront/components/buttonStyles.ts`
- `apps/storefront/components/cardTypography.ts`

## Run/verify locally
- From repo root:
  - `pnpm -C apps/storefront dev --port 3001`
- Smoke paths:
  - `/shop?section=button-inserts`
  - `/shop?section=keypads`
  - `/shop?section=button-inserts&cats=engine,lights`

## Out of scope for next thread
- Keep this thread focused on Shop UI/UX refinements only.
- Move product-page-specific UX/content/system changes to the new product-page thread.
