# 2026-02-22 Global Client Guardrails

## Purpose

Prevent regressions that accidentally re-introduce global client-side hydration and eager third-party runtime loading from `app/layout.tsx`.

## What Is Checked

Script: `/Users/terry/keypad-store/apps/frontend/scripts/check-global-client.mjs`

`verify:global-client` fails if:

- `app/layout.tsx` contains a `\"use client\"` directive.
- `app/layout.tsx` directly imports any forbidden global client/runtime modules:
  - `CookieBanner`
  - `ConsentAwareAnalytics`
  - `GlobalToastViewport`
  - `@vercel/analytics`
  - `@vercel/speed-insights`

## Local Run

From frontend app directory:

```bash
pnpm verify:global-client
```

From repo root:

```bash
pnpm -C /Users/terry/keypad-store/apps/frontend verify:global-client
```

## Updating Forbidden Imports

If requirements change:

1. Edit `forbiddenImportMatchers` in `/Users/terry/keypad-store/apps/frontend/scripts/check-global-client.mjs`.
2. Keep `app/layout.tsx` server-first and route/runtime gate client features through `ClientRuntimeGate`.
3. Re-run `pnpm -C /Users/terry/keypad-store/apps/frontend verify:global-client`.

## Migration Notes (Phase 5)

- Guardrails remained valid after introducing shadcn primitives and Tailwind v4 token refactor.
- Root layout still imports only `ClientRuntimeGate` for global client runtime behavior.
- No direct imports of analytics/cookie/toast runtime modules were reintroduced into `app/layout.tsx`.
