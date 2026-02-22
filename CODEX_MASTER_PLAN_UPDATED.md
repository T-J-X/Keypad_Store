# CODEX_MASTER_PLAN.md
_Last updated: 2026-02-22 (Europe/London)_

## Canonical Truth Contract (Read First)
This file is the **single source of truth** for the work described below. Codex must:

1. **Read top-to-bottom and execute linearly.** Do not reorder phases.
2. **Never guess which document is “current.”** If any other plan/addendum file conflicts with this plan, **this plan wins**.
3. **Stop-the-line rule:** if a step fails, stop and fix it before continuing (unless the step explicitly says “log and continue”).
4. **Evidence rule:** every code-impacting phase must end with the required commands and an audit note written to the specified docs path.
5. **Conflict resolution priority (highest → lowest):**
   1) This document  
   2) **Official upstream docs** explicitly referenced (especially shadcn Tailwind v4 + MCP docs)  
   3) Repo reality (actual code + build output)  
   4) Installed skill guidance/checklists  
   5) Historical plan drafts (listed in “Sources Folded Into This Plan”)

## Repo + Scope
- Repo root: `/Users/terry/keypad-store`
- Primary target: `/Users/terry/keypad-store/apps/frontend`
- Supporting targets: `/Users/terry/keypad-store/apps/backend`, `/Users/terry/keypad-store/docs/*`
- Non-goals:
  - Do not change public API payload schemas or commerce/backend contracts unless explicitly required by this plan.
  - Do not “redesign” pages; this is performance + UI primitive migration + SEO hygiene + audits.

## Output Deliverables (Must Exist at End)
Create/overwrite these files during execution:
- `docs/audits/2026-02-22-global-js-baseline.md`
- `docs/audits/2026-02-22-shadcn-migration-map.md`
- `docs/audits/2026-02-22-monorepo-audit.md`
- `docs/audits/2026-02-22-monorepo-audit-index.md`
- `docs/audits/2026-02-22-global-client-guardrails.md`
- `docs/audits/2026-02-22-ui-ux-audit.md`
- `docs/audits/2026-02-22-seo-audit.md`
- `docs/audits/2026-02-22-postgres-audit.md`
- `docs/seo/programmatic-seo-strategy.md`
- `docs/seo/programmatic-seo-template-spec.md`
- `docs/seo/programmatic-seo-keyword-map.csv`
- `DESIGN.md` (generated from Stitch, if Stitch is accessible)
- Any new/updated code files explicitly listed in phases below.

---

# Phase 0 — Safety, Branching, and Baseline Preconditions

## 0.1 Create a working branch + clean state
From repo root:
1. Ensure the working tree is clean (or commit WIP).
2. Create a feature branch, e.g. `chore/global-js-shadcn-migration`.
3. Record the current commit hash at top of `docs/audits/2026-02-22-monorepo-audit.md` (create the file now if missing).

## 0.2 Install prerequisites (only if missing)
- Ensure `pnpm` works in repo.
- Ensure `npx` works (needed for skills + shadcn MCP).

## 0.3 Create audit folders
- Ensure these directories exist:
  - `docs/audits/`
  - `docs/seo/`
- Create a stub index file now (it will be filled in Phase 2):
  - `docs/audits/2026-02-22-monorepo-audit-index.md`

---

# Phase 1 — Skills: Install (Project + Global) and Mirror Locally

## 1.1 Project + global skill installation
Run from `/Users/terry/keypad-store`:

### Project scope
```bash
npx skills add https://github.com/vercel-labs/agent-skills --all --yes
npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max --full-depth --yes
npx skills add https://github.com/coreyhaines31/marketingskills --skill seo-audit --skill programmatic-seo --yes
npx skills add https://github.com/supabase/agent-skills --skill supabase-postgres-best-practices --yes
npx skills add https://github.com/google-labs-code/stitch-skills --skill "react:components" --skill design-md --yes
npx skills add https://github.com/secondsky/claude-skills --skill tailwind-v4-shadcn --yes
```

### Global scope
Repeat the exact commands with `-g`:
```bash
npx skills add -g https://github.com/vercel-labs/agent-skills --all --yes
npx skills add -g https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max --full-depth --yes
npx skills add -g https://github.com/coreyhaines31/marketingskills --skill seo-audit --skill programmatic-seo --yes
npx skills add -g https://github.com/supabase/agent-skills --skill supabase-postgres-best-practices --yes
npx skills add -g https://github.com/google-labs-code/stitch-skills --skill "react:components" --skill design-md --yes
npx skills add -g https://github.com/secondsky/claude-skills --skill tailwind-v4-shadcn --yes
```

## 1.2 Verify installs
```bash
npx skills list
npx skills list -g
```
- If expected skills are missing, fix before proceeding.

## 1.3 Repo-local mirror (determinism)
Goal: keep a deterministic local mirror under `.agents/skills` (gitignored).

1. Ensure `.agents/` is ignored by git (confirm in `.gitignore`).
2. Create/update: `scripts/setup-local-skills.sh` that mirrors the installed skills into:
   - `/Users/terry/keypad-store/.agents/skills`

Requirements for `setup-local-skills.sh`:
- Idempotent: running twice produces the same result.
- Overwrites existing mirrors safely.
- Prints what it installed/refreshed.
- Does **not** modify committed code besides files explicitly listed in this plan.

## 1.4 Restart Codex (mandatory)
After skill installs and any Codex config edits (next phase), restart Codex so skills + MCP servers are discoverable.

---

# Phase 2 — Baseline Measurements (Before Any Refactor)

## 2.1 Build baseline
```bash
pnpm -C /Users/terry/keypad-store/apps/frontend build
```

## 2.2 Capture baseline notes
Write `docs/audits/2026-02-22-global-js-baseline.md` with:
- Route entry JS sizes summary (existing script output if available; otherwise capture build output notes).
- Current root layout client surfaces (imports/components).
- Known issues to fix in later phases (layout-level analytics, cookie banner, toast viewport, navbar polling, JSON-LD strategy, utility page robots/canonical gaps).

---



## 2.3 Create audit index (navigation)
Create/overwrite `docs/audits/2026-02-22-monorepo-audit-index.md` with:
- Links to every audit/doc file listed in “Output Deliverables”
- The current branch name + baseline commit hash (from Phase 0.1)
- A short “what changed in this phase” log section (append-only)

Keep this index updated whenever a new audit file is created or renamed.

## 2.4 Optional but supported: bundle analyzer harness (deep dives)
Goal: enable one-off “what’s in the bundle?” investigations **without** changing default build behavior.

1. Add dev dependency:
   - `@next/bundle-analyzer`
2. Update Next config (apps/frontend) so analyzer is enabled **only** when `ANALYZE=true`.
3. Add package.json scripts (apps/frontend):
   - `analyze:bundle` → runs `ANALYZE=true pnpm build` and leaves analyzer artifacts under `.next/analyze/` (or the analyzer’s default output)
4. Guardrail: when `ANALYZE` is unset/false, builds must be identical to baseline.

(Do not block the plan if analyzer output differs by machine; this is a diagnostic-only harness.)

# Phase 3 — Frontend Global JS Reduction (Layout + Analytics + Navbar + SEO Hygiene)

## 3.0 Goal (hard requirement)
Reduce globally shipped client JS from root layout while preserving UX:
- Consent-gate analytics; **never load analytics before consent accept**.
- Remove navbar 30s polling; keep refresh on mount/cart events/focus/visibility.
- Convert JSON-LD to server-rendered scripts.
- Add repeatable measurement script for before/after comparison.

## 3.1 Layout refactor: server-first + client runtime gate
1. Update `/Users/terry/keypad-store/apps/frontend/app/layout.tsx`:
   - Remove eager always-on mounts for:
     - Analytics
     - SpeedInsights
     - CookieBanner
     - GlobalToastViewport
   - Replace with a **single** orchestrator component:
     - `components/layout/ClientRuntimeGate.tsx` (client)

2. Add `components/layout/ClientRuntimeGate.tsx` (client) that:
   - Route-gates expensive features:
     - Toast viewport only for commerce/configurator routes
     - Cookie banner only when consent is unset
     - Analytics loader only after consent accepted AND env allows
   - Uses dynamic imports where appropriate.

## 3.2 Consent module + consent-aware analytics
1. Add `apps/frontend/lib/consent.ts` with:
   - `COOKIE_CONSENT_KEY`
   - `COOKIE_CONSENT_UPDATED_EVENT`
   - `type CookieConsent = 'accepted' | 'rejected' | null`
   - getters/setters + event dispatch

2. Update `apps/frontend/components/CookieBanner.tsx`:
   - Use `lib/consent.ts`
   - Dispatch consent update event on accept/reject

3. Add `apps/frontend/components/analytics/ConsentAwareAnalytics.tsx` (client):
   - Lazy import `@vercel/analytics` and `@vercel/speed-insights` **only after** consent accepted
   - Must not load those packages at all before acceptance
   - Must not load after rejection

4. Add env toggles (optional but supported):
   - `NEXT_PUBLIC_ENABLE_ANALYTICS` (default: enabled in production)
   - `NEXT_PUBLIC_ANALYTICS_REQUIRE_CONSENT` (default: true)

## 3.3 Navbar: hybrid refresh strategy (remove polling)
Implement the “hybrid navbar” so the global layout stays server-first and the navbar only hydrates what it must.

1. Split the navbar:
   - `apps/frontend/components/navbar/Navbar.server.tsx` (server) — static shell/markup
   - `apps/frontend/components/navbar/NavbarClient.tsx` (client) — interactive behavior only
   - Keep `"use client"` **only** in `NavbarClient.tsx` (never in the server shell).

2. Update `apps/frontend/components/navbar/controller.tsx`:
   - Remove the 30s polling interval.
   - Keep refresh triggers:
     - on mount
     - on cart update events
     - on window focus
     - on `visibilitychange` (when returning to visible)
   - Dedupe inflight requests and avoid reducer churn when state is unchanged.

3. Lazy-load “heavy” UI only when opened:
   - Search modal
   - Mobile menu
   - Mini-cart
Use dynamic imports so these chunks are not in the initial navbar JS.

Verification requirement: after `pnpm build`, confirm these modal/menu modules are not present in the initial entry chunk(s); they should appear only in on-demand chunks.


## 3.3A Cart refresh across tabs (BroadcastChannel + storage fallback)
Goal: if the user updates cart/config in one tab, other tabs should refresh navbar/cart state without polling.

1. Add `apps/frontend/lib/cartSync.ts` (client-safe utilities) that:
   - Uses `BroadcastChannel` when available (e.g. name: `cart-sync`)
   - Falls back to `localStorage` “storage” events when BroadcastChannel is unavailable
   - Exposes:
     - `broadcastCartUpdated(payload?: { at: number })`
     - `subscribeCartUpdated(handler: () => void)` returning an unsubscribe function

2. In `NavbarClient.tsx` (or the navbar controller), on cart update success:
   - call `broadcastCartUpdated({ at: Date.now() })`

3. Also subscribe on mount:
   - when another tab broadcasts, trigger the same refresh path as “cart update events”

Guardrail: never create multiple active subscriptions; always unsubscribe on unmount.


## 3.4 Footer split (server markup + tiny client enhancer)
Refactor `apps/frontend/components/AnimatedFooterLayout.tsx`:
- Move static footer markup to a server component.
- Keep only parallax/animation in a minimal client enhancer loaded only when needed.
- Remove unnecessary hydration (e.g., render current year server-side).

## 3.5 JSON-LD: server-rendered scripts
Replace `next/script` usage for:
- `apps/frontend/components/SiteJsonLd.tsx`
- `apps/frontend/components/ProductPdp/ProductJsonLd.tsx`

with server-rendered:
```html
<script type="application/ld+json">…</script>
```

## 3.6 SEO metadata hardening (utility + legal pages)
- Add explicit `robots: noindex` to:
  - `apps/frontend/app/cart/page.tsx`
  - `apps/frontend/app/checkout/page.tsx`
- Add explicit canonical alternates to:
  - `apps/frontend/app/privacy/page.tsx`
  - `apps/frontend/app/terms/page.tsx`
  - `apps/frontend/app/cookies/page.tsx`

## 3.7 Add deterministic measurement script
1. Add `apps/frontend/scripts/measure-entry-js.mjs`
2. Add package.json script:
   - `analyze:entry-js` that runs measurement and outputs a simple table or JSON.

## 3.7A Guardrails: prevent global client regressions (CI-enforced)
Goal: prevent “accidental” regressions that re-introduce global layout client JS later.

1. Add `apps/frontend/scripts/check-global-client.mjs` that fails with a clear message if:
   - `apps/frontend/app/layout.tsx` contains a `"use client"` directive
   - `apps/frontend/app/layout.tsx` directly imports any of these (must be gated inside `ClientRuntimeGate`):
     - `CookieBanner`
     - `ConsentAwareAnalytics`
     - `GlobalToastViewport`
     - `@vercel/analytics`
     - `@vercel/speed-insights`
2. Add package.json script (apps/frontend):
   - `verify:global-client` → runs the checker script
3. Add/overwrite `docs/audits/2026-02-22-global-client-guardrails.md` describing:
   - What is checked
   - How to run it locally
   - How to update the forbidden import list (if requirements change)

(If CI exists, wire `verify:global-client` into it. If not, Phase 3 validation below is the enforcement point.)


## 3.8 Phase 3 validation (must pass)
Run all:
```bash
pnpm -C /Users/terry/keypad-store/apps/frontend lint
pnpm -C /Users/terry/keypad-store/apps/frontend typecheck
pnpm -C /Users/terry/keypad-store/apps/frontend build
pnpm -C /Users/terry/keypad-store/apps/frontend analyze:entry-js
pnpm -C /Users/terry/keypad-store/apps/frontend verify:global-client
```
Then update `docs/audits/2026-02-22-monorepo-audit.md` with:
- before/after deltas from `analyze:entry-js`
- confirmation analytics gating works
- confirmation navbar polling removed (no 30s interval requests)
- confirmation modal/menu lazy-load works (Search/MobileMenu/MiniCart are on-demand)
- confirmation cross-tab cart sync works (BroadcastChannel/storage)
- confirmation guardrails pass (`verify:global-client`)

---

# Phase 4 — shadcn MCP Setup + shadcn/Tailwind v4 Migration Mapping

## 4.1 Enable shadcn MCP in Codex (global)
Edit `/Users/terry/.codex/config.toml` and add:
```toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
```
Then restart Codex.

## 4.2 Ensure `components.json` exists (project)
Confirm `/Users/terry/keypad-store/apps/frontend/components.json` exists and is valid for shadcn.
If any registry requires auth, store tokens/secrets in `apps/frontend/.env.local` (never commit them).

## 4.3 Create the shadcn migration map (hard gate before editing UI primitives)
1. Treat `llm.txt` (repo root) as the curated shadcn doc index.
2. Create `docs/audits/2026-02-22-shadcn-migration-map.md` containing a table:
   - Current local component/file
   - Target shadcn component
   - shadcn doc link (must be present in `llm.txt`)
   - Dependency/package impact
   - Migration notes (props changes, a11y concerns)

**Rule:** No UI primitive replacement without an entry in this map.

---

# Phase 5 — Tailwind v4 + shadcn Migration (Official shadcn Guide Wins)

## 5.0 Source-of-truth rule
For Tailwind v4 + shadcn behavior: when any third-party skill guidance conflicts, follow the official shadcn Tailwind v4 guide and shadcn docs referenced by `llm.txt`.

## 5.1 Dependency alignment
In `/Users/terry/keypad-store/apps/frontend`:
```bash
pnpm up "@radix-ui/*" cmdk lucide-react recharts tailwind-merge clsx --latest
```

## 5.2 globals.css token architecture (mandatory)
Refactor `apps/frontend/app/globals.css` to match official v4 expectations:
- `:root` and `.dark` are **outside** `@layer base`
- Token values defined as `hsl(...)` at definition time
- `@theme inline` maps to `var(--token)` (no extra wrappers)
- Eliminate double-wrapping like `hsl(var(--...))` when already wrapped

If charts exist, update to use `var(--chart-*)` (no `hsl(...)` wrapper).

## 5.3 UI primitive migration
Using the migration map:
1. Initialize/align shadcn project config (Next.js path).
2. Migrate local primitives in `apps/frontend/components/ui/*` to shadcn equivalents.
3. Normalize:
   - props types with `React.ComponentProps<...>`
   - add `data-slot` attributes where appropriate for consistent styling
   - ensure `tsconfig.json` supports `@/*` path aliases if required by migrated shadcn patterns
4. Replace `w-* h-*` pairs with `size-*` where equivalent.

## 5.4 Animation package policy
- Remove `tailwindcss-animate` if present.
- Add `tw-animate-css` **only if** required by the shadcn components actually used.

## 5.5 Phase 5 validation (must pass)
```bash
pnpm -C /Users/terry/keypad-store/apps/frontend lint
pnpm -C /Users/terry/keypad-store/apps/frontend typecheck
pnpm -C /Users/terry/keypad-store/apps/frontend build
```
Also add a short “migration notes” section to:
- `docs/audits/2026-02-22-monorepo-audit.md`
- `docs/audits/2026-02-22-monorepo-audit-index.md`
- `docs/audits/2026-02-22-global-client-guardrails.md`

---

# Phase 6 — UI/UX + Web Guidelines Audit Outputs

## 6.1 Generate design-system markdown (persisted)
Produce:
- `design-system/MASTER.md`
- `design-system/pages/home.md`
- `design-system/pages/shop.md`
- `design-system/pages/configurator.md`

## 6.2 Publish UI/UX audit
Create `docs/audits/2026-02-22-ui-ux-audit.md` with:
- key findings
- accessibility risks
- regression checklist for nav/dialog/toast/theme on desktop + mobile

---

# Phase 7 — SEO Audit + Programmatic SEO Deliverables

## 7.1 Code-level SEO audit
Create `docs/audits/2026-02-22-seo-audit.md` covering:
- metadata consistency
- canonical/noindex rules
- robots/sitemap correctness
- structured data validation approach

## 7.2 Programmatic SEO strategy outputs
Create:
- `docs/seo/programmatic-seo-strategy.md`
- `docs/seo/programmatic-seo-template-spec.md`
- `docs/seo/programmatic-seo-keyword-map.csv`

Include in the strategy/spec:
- URL architecture (subfolders only)
- hub/spoke internal linking rules
- indexation plan (what gets indexed vs noindexed)
- safeguards for thin content + cannibalization
- uniqueness model per page type

---

# Phase 8 — Backend Postgres Best-Practices Audit (Low-risk fixes only)

## 8.1 Audit
Create `docs/audits/2026-02-22-postgres-audit.md` covering:
- connection/pool policy (TypeORM/Vendure)
- index coverage for known query paths (e.g., saved configurations)
- migration discipline, locking/concurrency considerations

## 8.2 Apply only low-risk improvements
Only implement changes that are:
- clearly supported by observed query patterns
- low-risk (indexes, timeouts)
- validated by backend build/typecheck (run as appropriate)

---

# Phase 9 — Stitch: DESIGN.md + React Components (Homepage)

## 9.0 If Stitch is not accessible
If Stitch MCP/tools are unavailable:
- Log the block in `docs/audits/2026-02-22-monorepo-audit.md`
- Continue remaining phases (do not stall the whole plan)

## 9.1 Generate DESIGN.md (from Stitch screen)
- Use Stitch `design-md` skill to generate `/Users/terry/keypad-store/DESIGN.md`
- Must include: visual atmosphere, color roles (hex), typography, component styling, layout principles

## 9.2 Convert Stitch screen → React components (homepage)
Create:
- `apps/frontend/components/stitch/`
- `apps/frontend/hooks/stitch/`
- `apps/frontend/data/stitchMockData.ts`
Wire into:
- `apps/frontend/app/page.tsx`

Validation:
```bash
pnpm -C /Users/terry/keypad-store/apps/frontend lint
pnpm -C /Users/terry/keypad-store/apps/frontend typecheck
pnpm -C /Users/terry/keypad-store/apps/frontend build
```

---

# Phase 10 — Final Regression + React Doctor

## 10.1 Run React Doctor
Run `react-doctor` on the frontend app after all React/UI changes.

## 10.2A Add Playwright smoke tests (repeatable, 3–5 tests)
Goal: make the Phase 10 smoke checklist repeatable so regressions are caught automatically.

1. Add dev dependency (apps/frontend):
   - `@playwright/test`
2. Create Playwright config under `apps/frontend/playwright.config.ts`.
3. Add smoke tests under `apps/frontend/tests/smoke.spec.ts` covering at minimum:
   - Navbar open/close (desktop)
   - Navbar open/close (mobile viewport)
   - Search modal opens and closes
   - Mini-cart opens
   - Cookie banner accept/reject behavior:
     - analytics packages do **not** load before accept
     - analytics packages do **not** load after reject
   - (Optional) cart/checkout pages include `robots: noindex`
4. Add package.json scripts (apps/frontend):
   - `test:e2e` → `playwright test`
   - `test:e2e:ui` (optional) → `playwright test --ui`

Evidence rule: summarize what you tested + outcomes in `docs/audits/2026-02-22-monorepo-audit.md`.

## 10.2 Final smoke checklist (must be explicitly checked)
- Desktop + mobile navbar interactions
- Search modal
- Mini-cart
- Cookie banner accept/reject behavior
- Analytics gating works (no load before accept; never load after reject)
- Checkout/cart flows (and noindex metadata present)
- Configurator toasts (only on relevant routes)
- Playwright smoke tests pass (`pnpm -C apps/frontend test:e2e`)

## 10.3 Final commit discipline
- Ensure all audits/docs are written.
- Squash or keep commits as appropriate, but preserve a clear history by phase.

---

## Sources Folded Into This Plan (Historical / Non-Authoritative)
These documents were consolidated into this master plan; do not treat them as current truth:
- `PLAN_Phase1.md` — baseline + Phase 1 global JS reduction detail
- `PLAN_Phase2.md` — Stitch skills + DESIGN.md + homepage componentization + global JS reduction inclusion
- `PLAN_Phase3.md` — programmatic SEO + combined execution spec
- `PLAN_Phase4.md` — decision-complete umbrella plan (base of this master)
- `PLAN_Phase5.md` — shadcn MCP addendum
- `PLAN_Phase6.md` — official shadcn Tailwind v4 alignment addendum
- `PLAN_Phase7(info).md` — llm.txt source-map gating addendum
- `llm.txt` — curated shadcn documentation index used for traceability
