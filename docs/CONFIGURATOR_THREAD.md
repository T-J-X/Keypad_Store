# Configurator Thread Brief (Keypad Store)

Last updated: 2026-02-05

## Scope for the New Thread
This document is the handoff for the dedicated configurator build thread. The storefront UI work is already implemented separately. The new thread should focus only on the interactive keypad configurator experience.

## Current Storefront State (Implemented)
- Next.js App Router storefront exists under `apps/storefront`.
- Pages implemented: `/`, `/shop`, `/configurator`, `/configurator/[slug]` (placeholder), `/login`, `/signup`, `/account`, and a lightweight `/product/[slug]` shell.
- Shop and Configurator landing pages fetch Vendure products server-side from `VENDURE_SHOP_API_URL` with `cache: "no-store"`.
- Client-side UI state exists for search, category filters, and tab/accordion behavior.
- Asset URL normalization is handled by `assetUrl()` using `NEXT_PUBLIC_VENDURE_HOST`.

## Existing Configurator Reference (Sandbox)
There is an older working prototype that can be re-used as the baseline:
- Path: `apps/sandbox-configurator`
- It already:
  - Fetches icon products from Vendure `/shop-api`.
  - Displays a keypad slot grid.
  - Opens a modal with icon grid + category filter + search.
  - Inserts the selected icon into the slot.
- It is currently a Vite app; logic will be ported into the storefront app.

## Data Model (Already Implemented in Vendure)
Icons:
- One icon product per icon.
- `Product.customFields.isIconProduct = true`
- `Product.customFields.iconId = ICON_ID` (string, case-sensitive, preserves leading zeros)
- `Product.customFields.iconCategoryPath = e.g. "HVAC/Blower"`
- `Product.customFields.insertAssetId = <asset id>`
- `featuredAsset` = Render image (store thumbnails)
- Secondary asset = Insert image (configurator overlay)

Keypads:
- `Product.customFields.isKeypadProduct = true`
- `featuredAsset` = keypad render image

IMPORTANT:
- Storefront lists should always use `featuredAsset` only.
- Insert assets are configurator-only and should not appear in catalog listings.

## Configurator UX Target
Inspired by the referenced Blink Marine product page, but with extra functionality and more modern styling.
- The user clicks a keypad slot.
- A modal (popup) shows icon grid with search and categories.
- Choosing an icon inserts it into that specific slot.
- This should be implemented first for PKP-2200-SI (2x2), then mirrored for other keypad models later.

## Features to Implement (Configurator Thread)
Core:
- Interactive keypad grid with selectable slots.
- Modal icon picker with:
  - Search input
  - Category tree (Icon Categories -> Subcategories)
  - Icon grid using Render (featuredAsset)
- On selection, map icon to the active slot using Insert (via `insertAssetId`).
- Clear single slot and clear all slots.

Advanced controls (in the same thread unless deferred):
- Remove all icons button.
- Zoom in / zoom out.
- Rotate the keypad view.
- Toggle view to show glow (later) or no glow.

Account + Save:
- Save configuration with a name.
- If logged in, save to user profile.
- If not logged in, prompt for signup/login before saving.

Swatches + Glow Rings:
- Not in this thread; will be handled later.

## Do-Not-Regress Rules
- Icon grid thumbnails must always be featured Render assets.
- Insert assets are configurator-only.
- ICON_ID stays a string (case-sensitive; leading zeros preserved).

## Known Endpoints (Dev)
- Shop API: http://localhost:3000/shop-api
- Assets: http://localhost:3000/assets
- Admin: http://localhost:3000/admin

Env vars (storefront):
- `VENDURE_SHOP_API_URL=http://localhost:3000/shop-api`
- `NEXT_PUBLIC_VENDURE_HOST=http://localhost:3000`

## Notes for the New Thread
- Start with PKP-2200-SI (2x2) as the first fully working layout.
- Other keypad models should be easy to map once the base layout is done.
- Port logic from `apps/sandbox-configurator/src/App.tsx` and `apps/sandbox-configurator/src/vendure.ts` as the starting point.

