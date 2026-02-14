# React Best Practices Safe Audit Report

- Branch: codex/chore/react-best-practices-safe-audit
- HEAD SHA: 8a64540

## Commands Run

| Command | Result |
| --- | --- |
| \'pnpm -C apps/storefront run verify:alignment-guards\' | PASS |
| \'pnpm -C apps/storefront run typecheck\' | PASS |
| \'pnpm -C apps/storefront run lint\' | PASS |
| \'pnpm -C apps/storefront run build\' | PASS |

## Changes by Category

### Waterfalls
- \'apps/storefront/app/shop/product/[slug]/page.tsx\': Added \'fetchCatalogProductForSlug\' path reuse for metadata/page lookup flow, including keypad-model fallback lookup by model code.

### Bundle
- \'apps/storefront/app/account/page.tsx\': Switched \'AccountTabs\' to \'next/dynamic\'.
- \'apps/storefront/app/order/[code]/page.tsx\': Switched \'OrderTechnicalSpecification\' to \'next/dynamic\' with lightweight loading fallback.

### Server
- \'apps/storefront/lib/vendure.server.ts\': Wrapped \'fetchProductBySlug\' with request-scoped React \'cache()\' to reduce duplicate server fetch work.

### Client
- No fetch-on-mount behavior changes were introduced in this safe pass.

### Rerender
- \'apps/storefront/components/ShopClient.tsx\': Consolidated icon search/category indexing so category labels/slugs are computed once and reused across filtering and breadcrumb resolution.

### Rendering
- \'apps/storefront/components/ShopClient.tsx\': Reduced repeated per-icon category derivations in render/filter paths.

FORBIDDEN FILES UNCHANGED: models/** and KeypadPreview.tsx

## Alignment Guard Script

- Added \'apps/storefront/scripts/verify-alignment-guards.ts\'.
- Verifies each keypad model export in \'apps/storefront/config/layouts/models/**\' against expected constants.
- Checks:
  - \'intrinsicSize.width\' and \'intrinsicSize.height\' values (including PKP-2400 = 1320x580 and PKP-2200 = 1000x580)
  - Slot counts per model (4, 6, 8, 10, 12, 15)
- Added storefront script: \'verify:alignment-guards\'.
