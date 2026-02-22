# 2026-02-22 Global JS Baseline

## Build Baseline

- Command: `pnpm -C /Users/terry/keypad-store/apps/frontend build`
- Result: success (Next.js 16.1.6, Turbopack)
- Build mode: production (`next build`)

## Route Entry JS Snapshot

Next 16 build output does not print per-route first-load JS sizes in this project configuration, so baseline was captured from `.next/build-manifest.json` root entry chunks and static chunk totals.

### Root entry chunks (`build-manifest.json > rootMainFiles`)

| File | Bytes |
| --- | ---: |
| `static/chunks/cd9c8d0e022a27ca.js` | 9,543 |
| `static/chunks/c908d8bb72d35017.js` | 32,824 |
| `static/chunks/4f563511c9df8519.js` | 223,457 |
| `static/chunks/6cd3ba8d745e9f56.js` | 84,447 |
| `static/chunks/44da78e82a28ddfd.js` | 49,875 |
| `static/chunks/turbopack-13ab453969306064.js` | 10,268 |

- Root main total: `410,414` bytes
- Total emitted client JS chunk bytes in `.next/static/chunks/*.js`: `1,021,426` bytes

## Current Root Layout Client Surfaces

From `apps/frontend/app/layout.tsx`, current always-mounted client/global surfaces:

- `Navbar` (client entry via `components/Navbar.tsx`)
- `AnimatedFooterLayout` (`'use client'`)
- `GlobalToastViewport` (`'use client'`)
- `CookieBanner` (`'use client'`)
- `Analytics` from `@vercel/analytics/react`
- `SpeedInsights` from `@vercel/speed-insights/next`
- `SiteJsonLd` and product JSON-LD currently use `next/script` with `lazyOnload`

## Known Issues To Address In Later Phases

- Layout-level analytics mounted eagerly with no consent gate.
- Cookie banner mounted globally from root layout.
- Global toast viewport mounted globally from root layout.
- Navbar still performs 30-second polling in `apps/frontend/components/navbar/controller.tsx`.
- JSON-LD scripts use `next/script` `lazyOnload` instead of server-rendered `<script type=\"application/ld+json\">`.
- Utility page metadata hardening gaps:
  - `cart` and `checkout` are missing explicit `robots: noindex`.
  - `privacy`, `terms`, and `cookies` are missing explicit canonical alternates.
