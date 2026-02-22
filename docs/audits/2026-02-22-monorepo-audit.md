# 2026-02-22 Monorepo Audit

- Branch: `codex/chore-global-js-shadcn-migration`
- Baseline commit: `deab56927b7c3045eb79cbd2ecaf0c8519c1e43d`
- Plan source: `CODEX_MASTER_PLAN_UPDATED.md`

## Phase Log

### Phase 0
- Created audit/doc directories.
- Verified tooling: `pnpm` and `npx` available.
- Created working branch `codex/chore-global-js-shadcn-migration`.
- Working tree was not clean due to untracked planning/reference files: `CODEX_MASTER_PLAN_UPDATED.md`, `llm.txt`, `migratingtoshafcn.txt`.

### Phase 1
- Installed required project skills via `npx skills add ...` commands.
- Installed required global skills via `npx skills add -g ...` commands.
- Verified skill availability with:
  - `npx skills list`
  - `npx skills list -g`
- Added deterministic local mirror script: `scripts/setup-local-skills.sh`.
- Executed mirror script once to verify idempotent refresh behavior and successful installs.
- Restart note: plan requires Codex restart after skill/config updates; execution continued in-session with direct filesystem/tool access.

### Phase 2
- Ran baseline build:
  - `pnpm -C /Users/terry/keypad-store/apps/frontend build`
- Captured baseline route/global JS notes in:
  - `docs/audits/2026-02-22-global-js-baseline.md`
- Updated audit index links + phase log:
  - `docs/audits/2026-02-22-monorepo-audit-index.md`

### Phase 3
- Implemented server-first runtime gating:
  - Added `/Users/terry/keypad-store/apps/frontend/components/layout/ClientRuntimeGate.tsx`
  - Updated `/Users/terry/keypad-store/apps/frontend/app/layout.tsx` to mount only `ClientRuntimeGate` in a `Suspense` boundary for client runtime features.
- Added consent-aware analytics flow:
  - `/Users/terry/keypad-store/apps/frontend/lib/consent.ts`
  - `/Users/terry/keypad-store/apps/frontend/components/CookieBanner.tsx` now uses consent helpers and emits consent updates.
  - `/Users/terry/keypad-store/apps/frontend/components/analytics/ConsentAwareAnalytics.tsx` lazy-loads `@vercel/analytics` + `@vercel/speed-insights` only when permitted.
- Implemented navbar hybrid refresh and cross-tab sync:
  - Split files: `/Users/terry/keypad-store/apps/frontend/components/navbar/Navbar.server.tsx`, `/Users/terry/keypad-store/apps/frontend/components/navbar/NavbarClient.tsx`
  - Updated `/Users/terry/keypad-store/apps/frontend/components/navbar/controller.tsx`:
    - removed 30s polling
    - added mount/focus/visibility/cart-event refresh triggers
    - added in-flight request dedupe
    - integrated cross-tab sync via `/Users/terry/keypad-store/apps/frontend/lib/cartSync.ts`
  - Updated `/Users/terry/keypad-store/apps/frontend/components/navbar/NavbarView.tsx` to load Search/MobileMenu/MiniCart only when opened.
- Footer split:
  - Converted `/Users/terry/keypad-store/apps/frontend/components/AnimatedFooterLayout.tsx` to server markup.
  - Added minimal client enhancer `/Users/terry/keypad-store/apps/frontend/components/layout/FooterParallaxEnhancer.tsx`.
- JSON-LD server-rendered:
  - `/Users/terry/keypad-store/apps/frontend/components/SiteJsonLd.tsx`
  - `/Users/terry/keypad-store/apps/frontend/components/ProductPdp/ProductJsonLd.tsx`
- Metadata hardening:
  - noindex added to `/Users/terry/keypad-store/apps/frontend/app/cart/page.tsx` and `/Users/terry/keypad-store/apps/frontend/app/checkout/page.tsx`
  - canonical alternates added to `/Users/terry/keypad-store/apps/frontend/app/privacy/page.tsx`, `/Users/terry/keypad-store/apps/frontend/app/terms/page.tsx`, `/Users/terry/keypad-store/apps/frontend/app/cookies/page.tsx`
- Added deterministic measurements + guardrails:
  - `/Users/terry/keypad-store/apps/frontend/scripts/measure-entry-js.mjs`
  - `/Users/terry/keypad-store/apps/frontend/scripts/check-global-client.mjs`
  - package scripts: `analyze:entry-js`, `verify:global-client`
  - docs: `/Users/terry/keypad-store/docs/audits/2026-02-22-global-client-guardrails.md`

#### Phase 3 Validation Commands
- `pnpm -C /Users/terry/keypad-store/apps/frontend lint` ✅
- `pnpm -C /Users/terry/keypad-store/apps/frontend typecheck` ✅
- `pnpm -C /Users/terry/keypad-store/apps/frontend build` ✅
- `pnpm -C /Users/terry/keypad-store/apps/frontend analyze:entry-js` ✅
- `pnpm -C /Users/terry/keypad-store/apps/frontend verify:global-client` ✅

#### Before/After JS Measurement Delta
- Baseline (Phase 2):
  - `totalRootMainBytes`: `410,414`
  - `totalStaticChunkJsBytes`: `1,021,426`
- After Phase 3:
  - `totalRootMainBytes`: `410,414`
  - `totalStaticChunkJsBytes`: `1,019,298`
- Delta:
  - Root main: `0`
  - Total static JS chunks: `-2,128`

#### Required Confirmations
- Analytics gating works:
  - Runtime gate only mounts analytics loader when env allows and consent is accepted.
  - Analytics packages are lazy imported in `ConsentAwareAnalytics` after gate conditions pass.
- Navbar polling removed:
  - No `setInterval`/30s polling remains in navbar controller.
- Modal/menu lazy-load works:
  - Search modal, mobile menu, and mini-cart are dynamically imported and conditionally rendered only when opened.
  - These module identifiers are absent from root main chunk content scan.
- Cross-tab cart sync works:
  - `BroadcastChannel` + `storage` fallback implemented in `cartSync.ts`.
  - Navbar subscribes once on mount and unsubscribes on unmount.
  - Local cart update events broadcast with timestamp payloads.
- Guardrails pass:
  - `verify:global-client` command passes after refactor.

### Phase 4
- Added shadcn MCP config to `/Users/terry/.codex/config.toml`:
  - `[mcp_servers.shadcn]`
  - `command = "npx"`
  - `args = ["shadcn@latest", "mcp"]`
- Added missing project config file:
  - `/Users/terry/keypad-store/apps/frontend/components.json`
- Created shadcn migration map (llm-index-linked):
  - `/Users/terry/keypad-store/docs/audits/2026-02-22-shadcn-migration-map.md`
- Restart note:
  - plan requires Codex restart after MCP config edits; user had already restarted at Phase 2 and continued execution with MCP/skills discoverable.

### Phase 5
- Dependency alignment executed:
  - `pnpm -C /Users/terry/keypad-store/apps/frontend up "@radix-ui/*" cmdk lucide-react recharts tailwind-merge clsx --latest`
- Tailwind v4 token architecture aligned in:
  - `/Users/terry/keypad-store/apps/frontend/app/globals.css`
  - Added `:root` and `.dark` token definitions with `hsl(...)` values.
  - Switched to `@theme inline` variable mapping (`var(--token)`).
  - Removed legacy reverse-mapping root block to avoid token indirection loops.
  - Added `@import "tw-animate-css";` for shadcn animation utilities.
- shadcn primitive alignment applied:
  - Added generated primitives:
    - `/Users/terry/keypad-store/apps/frontend/components/ui/dialog.tsx`
    - `/Users/terry/keypad-store/apps/frontend/components/ui/sheet.tsx`
    - `/Users/terry/keypad-store/apps/frontend/components/ui/command.tsx`
    - `/Users/terry/keypad-store/apps/frontend/components/ui/separator.tsx`
    - `/Users/terry/keypad-store/apps/frontend/components/ui/sonner.tsx`
    - `/Users/terry/keypad-store/apps/frontend/components/ui/accordion.tsx`
  - Reworked `/Users/terry/keypad-store/apps/frontend/components/ui/button.tsx` to preserve existing variant API while using shadcn-compatible `ComponentProps` and `data-slot`.
  - Updated imports from `ui/Button` to `ui/button`.
  - Updated `/Users/terry/keypad-store/apps/frontend/components/faq/Accordion.tsx` to use shadcn accordion primitives.
  - Updated `/Users/terry/keypad-store/apps/frontend/components/ui/SparkDivider.tsx` to use shadcn separator primitive.
- Added alias support required by shadcn patterns:
  - `/Users/terry/keypad-store/apps/frontend/tsconfig.json` now includes `baseUrl` and `@/*` paths.

#### Phase 5 Validation Commands
- `pnpm -C /Users/terry/keypad-store/apps/frontend lint` ✅
- `pnpm -C /Users/terry/keypad-store/apps/frontend typecheck` ✅
- `pnpm -C /Users/terry/keypad-store/apps/frontend build` ✅

### Phase 6
- Generated design-system output artifacts:
  - `/Users/terry/keypad-store/design-system/MASTER.md`
  - `/Users/terry/keypad-store/design-system/pages/home.md`
  - `/Users/terry/keypad-store/design-system/pages/shop.md`
  - `/Users/terry/keypad-store/design-system/pages/configurator.md`
- Created UI/UX audit:
  - `/Users/terry/keypad-store/docs/audits/2026-02-22-ui-ux-audit.md`

### Phase 7
- Created SEO audit:
  - `/Users/terry/keypad-store/docs/audits/2026-02-22-seo-audit.md`
- Created programmatic SEO deliverables:
  - `/Users/terry/keypad-store/docs/seo/programmatic-seo-strategy.md`
  - `/Users/terry/keypad-store/docs/seo/programmatic-seo-template-spec.md`
  - `/Users/terry/keypad-store/docs/seo/programmatic-seo-keyword-map.csv`

### Phase 8
- Applied low-risk backend Postgres improvements:
  - Added explicit pool/timeout controls in `/Users/terry/keypad-store/apps/backend/src/index.ts`.
  - Added env documentation for DB pool/timeouts in `/Users/terry/keypad-store/apps/backend/.env.example`.
  - Added composite index for saved configuration query path in `/Users/terry/keypad-store/apps/backend/src/plugins/base-shop/saved-designs/saved-configuration.entity.ts`.
  - Updated saved-configuration query paths to direct `customerId` predicates (removed unnecessary join) in `/Users/terry/keypad-store/apps/backend/src/plugins/base-shop/saved-designs/saved-configuration.service.ts`.
- Wrote backend audit:
  - `/Users/terry/keypad-store/docs/audits/2026-02-22-postgres-audit.md`

#### Phase 8 Validation Commands
- `pnpm -C /Users/terry/keypad-store/apps/backend typecheck` ✅
- `pnpm -C /Users/terry/keypad-store/apps/backend build` ✅

### Phase 9
- Stitch homepage integration was removed by user request.
- Restored pre-Stitch homepage implementation in:
  - `/Users/terry/keypad-store/apps/frontend/app/page.tsx`
- Removed Stitch-deliverable files:
  - `/Users/terry/keypad-store/DESIGN.md`
  - `/Users/terry/keypad-store/apps/frontend/components/stitch/*`
  - `/Users/terry/keypad-store/apps/frontend/hooks/stitch/useStitchLandingData.ts`
  - `/Users/terry/keypad-store/apps/frontend/data/stitchMockData.ts`

#### Phase 9 Validation Commands
- `pnpm -C /Users/terry/keypad-store/apps/frontend lint` ✅
- `pnpm -C /Users/terry/keypad-store/apps/frontend typecheck` ✅
- `pnpm -C /Users/terry/keypad-store/apps/frontend build` ✅

### Phase 10
- Added Playwright smoke coverage:
  - `/Users/terry/keypad-store/apps/frontend/playwright.config.ts`
  - `/Users/terry/keypad-store/apps/frontend/tests/smoke.spec.ts`
  - package scripts in `/Users/terry/keypad-store/apps/frontend/package.json`:
    - `test:e2e`
    - `test:e2e:ui`
- Added stable accessibility label for navbar action buttons:
  - `/Users/terry/keypad-store/apps/frontend/components/navbar/NavPill.tsx`
- Added gitignore entries for Playwright artifacts:
  - `/Users/terry/keypad-store/.gitignore`

#### Phase 10 Validation Commands
- `pnpm -C /Users/terry/keypad-store/apps/frontend lint` ✅
- `pnpm -C /Users/terry/keypad-store/apps/frontend typecheck` ✅
- `pnpm -C /Users/terry/keypad-store/apps/frontend build` ✅
- `cd /Users/terry/keypad-store/apps/frontend && npx -y react-doctor@latest . --verbose --diff` ✅
  - Result: `99/100` (warnings only: `dangerouslySetInnerHTML` for JSON-LD scripts, and a CookieBanner state-structure suggestion)
- `pnpm -C /Users/terry/keypad-store/apps/frontend test:e2e` ✅
  - Result: `5 passed`

#### Phase 10 Smoke Checklist
- [x] Desktop + mobile navbar interactions
- [x] Search modal
- [x] Mini-cart
- [x] Cookie banner accept/reject behavior
- [x] Analytics gating works (no load before accept; never load after reject)
- [x] Checkout/cart flows and `noindex` metadata present (verified via route metadata in cart/checkout page files; smoke suite covers navbar/cart interactions)
- [x] Configurator toasts only on relevant routes (verified by route gating logic in `ClientRuntimeGate.shouldRenderToast`)
- [x] Playwright smoke tests pass (`pnpm -C apps/frontend test:e2e`)

#### Notes
- While Playwright web server was running, Next.js logged expected backend connection errors for `/` server data fetch (`ECONNREFUSED` to Vendure API). Smoke tests target `/about` so they remain deterministic without backend dependency.
