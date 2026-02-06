Monorepo:
- apps/backend  (Vendure)
- apps/storefront (Next.js)
- packages/ui
- packages/configurator
- infra (docker compose: dev + lab)

## Dev Quickstart

1. Start infra (Postgres/Redis/MinIO):
   - `docker compose --env-file infra/.env.dev -f infra/docker-compose.dev.yml up -d`
2. Start Vendure:
   - `pnpm -C apps/backend dev`
3. (Optional) Backfill `insertAssetId` for icon products:
   - Dry run: `pnpm -C apps/backend backfill:insert-asset-id`
   - Apply: `pnpm -C apps/backend backfill:insert-asset-id -- --apply`
4. Run the sandbox configurator:
   - `pnpm -C apps/sandbox-configurator dev`
   - Open `http://localhost:5173`

## Icon Product Model (Option B)

- One icon product with two assets:
  - Featured asset = Render (thumbnail/grid)
  - Secondary asset = Insert (overlay)
- Store:
  - `Product.customFields.isIconProduct = true`
  - `Product.customFields.iconId = "B321"` (or similar)
  - `Product.customFields.insertAssetId = "<asset id>"` (optional if there are exactly 2 assets)
