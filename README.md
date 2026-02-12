# Keypad Store Monorepo

This project runs two main local apps:

| Service | Path | Local URL | Purpose |
| --- | --- | --- | --- |
| Backend (Vendure) | `apps/backend` | `http://localhost:3000` | Admin API, Shop API, auth, assets |
| Storefront (Next.js) | `apps/storefront` | `http://localhost:3001` | Customer-facing web app |

## Port and Env Model

The local setup is intentionally:
- Backend on `3000`
- Frontend on `3001`

The storefront talks to Vendure through env vars, not hardcoded ports.

### Storefront env (`apps/storefront/.env.local`)

Use `apps/storefront/.env.local.example` as your template:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3001
VENDURE_SHOP_API_URL=http://localhost:3000/shop-api
NEXT_PUBLIC_VENDURE_HOST=http://localhost:3000
NEXT_PUBLIC_ASSETS_BASE_URL=http://localhost:3000
```

What each one does:
- `NEXT_PUBLIC_SITE_URL`: Canonicals, sitemap, robots base URL (the browser-facing site).
- `VENDURE_SHOP_API_URL`: Server-side calls from Next.js to Vendure Shop API.
- `NEXT_PUBLIC_VENDURE_HOST`: Client-side host for Vendure assets and related URLs.
- `NEXT_PUBLIC_ASSETS_BASE_URL`: Optional explicit assets host override.

Important:
- `NEXT_PUBLIC_API_URL` is not used by the current storefront code.

### Backend env (`apps/backend/.env`)

Use `apps/backend/.env.example` as your template:

```bash
PORT=3000
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_PASSWORD=superadmin
```

Optional for cross-origin control:

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

Notes:
- If `CORS_ORIGINS` is unset in local dev, backend defaults allow both `3000` and `3001`.
- In production, `SUPERADMIN_USERNAME` and `SUPERADMIN_PASSWORD` must be set or backend startup fails.

## Local Quickstart

1. Start infra:
```bash
pnpm run infra:up
```

2. Create env files from examples:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/storefront/.env.local.example apps/storefront/.env.local
```

3. Start apps:
```bash
pnpm run dev:backend
pnpm run dev:storefront
```

Optional:
```bash
pnpm -C apps/sandbox-configurator dev
```
Open `http://localhost:5173`.

## Verify Everything Is Wired Correctly

- Storefront: `http://localhost:3001`
- Backend health: `http://localhost:3000/health`
- Backend Shop API endpoint: `http://localhost:3000/shop-api`
- Sitemap: `http://localhost:3001/sitemap.xml`
- Robots: `http://localhost:3001/robots.txt`

If page metadata points to `localhost:3000`, check `NEXT_PUBLIC_SITE_URL`.
If storefront data fetches fail, check `VENDURE_SHOP_API_URL`.

## Icon Product Model

One icon product uses two assets:
- Featured asset = render image (thumbnail/grid)
- Secondary asset = insert image (overlay)

Stored on product custom fields:
- `isIconProduct = true`
- `iconId = "B321"` (example)
- `insertAssetId = "<asset id>"` (optional if there are exactly two assets)

Optional backfill:
```bash
pnpm -C apps/backend backfill:insert-asset-id
pnpm -C apps/backend backfill:insert-asset-id -- --apply
```
