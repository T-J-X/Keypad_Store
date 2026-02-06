# Storefront UI Plan (DEV) — Next.js App Router + Tailwind + Vendure Shop API

Last updated: 2026-02-05

## Current backend endpoints (dev)
- Shop API: http://localhost:3000/shop-api
- Assets: http://localhost:3000/assets
- Admin: http://localhost:3000/admin

Vendure stores assets in MinIO (S3-compatible) but serves them via `/assets`.
The storefront should ONLY render URLs returned by Vendure (normalize relative URLs).

---

## Goals (DEV phase)
1) Build the storefront shell (layout, header/footer, responsive grid)
2) Shop page shows Icon products (Render featured asset), with client-side filtering
3) Configurator landing shows Keypad products (CTA -> placeholder configurator route)
4) Keep everything live against Vendure; no mock data

---

## Env vars (storefront)
Server-only:
- VENDURE_SHOP_API_URL=http://localhost:3000/shop-api

Public (safe):
- NEXT_PUBLIC_VENDURE_HOST=http://localhost:3000

Optional:
- NEXT_PUBLIC_ASSETS_BASE_URL=http://localhost:3000   (if you want explicit assets base)

---

## Data model expectations (already implemented in Vendure)
Icons:
- Product.customFields.isIconProduct = true
- Product.customFields.iconId = ICON_ID (string)
- Product.customFields.iconCategoryPath = e.g. "HVAC/Blower"
- Product.customFields.insertAssetId = asset id (string)
- featuredAsset = Render (glossy) PNG (store thumbnails + selector thumbnails)
- secondary asset = Insert (matte) PNG (configurator overlay)

Keypads:
- Product.customFields.isKeypadProduct = true
- featuredAsset = keypad render PNG

IMPORTANT:
The Shop API must expose these customFields publicly or queries will fail.

---

## Fetching strategy (DEV but compatible with SEO later)
- Server Components fetch: Shop page + Configurator landing lists
- Client Components: filtering/search UI, category tree interactions, motion
- Configurator itself (later): client-driven interactive overlay

### Caching (DEV defaults)
- Use `cache: "no-store"` for now so changes in Vendure show instantly.

---

## Minimal Vendure client utilities (vendure.ts)
- `vendureFetch<T>(query, variables)` usable from Server Components (preferred)
- `assetUrl(input)`:
  - if input starts with "http" return as-is
  - else prefix with NEXT_PUBLIC_VENDURE_HOST

- `buildCategoryTree(iconCategoryPath)`:
  - split by "/" and build nested categories

---

## Pages (App Router)
- / (Home): hero + category tiles + CTA
- /shop: server-fetched icon list -> client filter UI (q/category)
- /configurator: server-fetched keypad list -> CTA to /configurator/[slug]
- /configurator/[slug]: placeholder now ("Configurator coming soon")
- /login, /signup: UI-only forms
- /account: UI-only dashboard shell

---

## “Do not regress” rules
- Storefront MUST NOT show Insert image as a second gallery image on icon product pages.
- Popup/grid thumbnails MUST use featuredAsset (Render).
- Slot overlay MUST use Insert via insertAssetId (configurator-only).
- ICON_ID must remain a string (case-sensitive, leading zeros preserved).

---

## Smoke tests
- /shop renders icon grid with Render thumbnails (featuredAsset)
- category sidebar builds from iconCategoryPath and filters locally
- /configurator renders keypad grid with featured assets
- asset URLs render (no broken images) using `/assets/...`
