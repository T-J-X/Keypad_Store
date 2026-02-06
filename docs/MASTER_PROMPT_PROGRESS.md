# Master Prompt Progress (Keypad Store)

This file is intended to be copy/paste “context injection” for a new chat/thread.

Last updated: 2026-02-05

## Current Running Endpoints (Dev)
- Admin UI: http://localhost:3000/admin
- Admin API: http://localhost:3000/admin-api
- Shop API: http://localhost:3000/shop-api
- Assets: http://localhost:3000/assets

## Infra (Dev)
- Dev infra runs via Docker Compose (infra only; apps run locally):
  - Postgres (Vendure DB)
  - Redis
  - MinIO (S3-compatible storage) + console
  - (Mailpit / ntfy planned per master prompt; not yet wired in this repo state)

### MinIO S3 Asset Storage (Working)
Vendure assets are stored in MinIO using these env vars:
- `S3_BUCKET`
- `S3_ENDPOINT` (e.g. `http://127.0.0.1:9000`)
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_REGION`
- `S3_FORCE_PATH_STYLE` (`true` for MinIO)

Vendure stores objects in the bucket under:
- `source/`
- `preview/`
- `cache/`

## Backend State
- Backend: Vendure `v3.5.2` at `apps/backend`
- Email: `EmailPlugin` disabled/removed for now (previously crashed due to missing `templatePath`)
- Admin UI: available at `:3000/admin` (proxy config preserved)
- Search: `DefaultSearchPlugin` enabled to avoid `no-search-plugin-configured`
- Assets: `AssetServerPlugin` uses S3 strategy (MinIO)

## Icons (Locked Model + Status)

### Locked Model (Implemented)
- 1 Icon = 1 Vendure Product (1 variant)
- **Featured Asset** = Render (glossy) PNG (store thumbnails + selector thumbnails)
- **Secondary Asset** = Insert (matte) PNG (configurator overlay)
- Canonical identifier is filename-derived `ICON_ID` **string** preserved exactly (case-sensitive, leading zeros allowed).
- Variant SKU equals `ICON_ID` string.

Vendure fields:
- `Product.customFields.isIconProduct` = `true`
- `Product.customFields.iconId` = `ICON_ID` (string)
- `Product.customFields.insertAssetId` = Insert asset id (string)
- `ProductVariant.sku` = `ICON_ID`
- `ProductVariant.customFields.iconId` = `ICON_ID` (string)

### Import & Backfill (Implemented)
Scripts:
- `apps/backend/scripts/import-icons.ts`
- `apps/backend/scripts/backfill-icon-fields.ts`
- `apps/backend/scripts/backfill-insert-asset-id.ts`

Import ignores macOS metadata:
- `__MACOSX/`
- files starting with `._`
- `.DS_Store`

Status:
- Icons imported from `apps/backend/imports/Render.zip` + `apps/backend/imports/Insert.zip`
- Total icon pairs imported: 212
- Backfill fixed legacy manual icon product(s) missing fields (example: `B321`)

Commands:
```bash
# Import icons (idempotent; existing SKUs skip)
pnpm -C apps/backend import:icons -- --render-zip imports/Render.zip --insert-zip imports/Insert.zip --apply

# Backfill missing iconId / insertAssetId based on SKU + non-featured asset
pnpm -C apps/backend backfill:icon-fields -- --apply
```

## Keypads (Model + Status)

### Locked Model (Ready)
- 1 Keypad model = 1 Vendure Product (1 variant)
- Product:
  - `Product.customFields.isKeypadProduct` = `true`
  - Featured asset = keypad render PNG
- Variant:
  - `sku` derived from filename model code via sanitisation
  - `ProductVariant.customFields.keypadModelCode` set from filename (raw)
  - `ProductVariant.customFields.slotMapKey` set to the SKU

### Import (Implemented; Completed)
Script:
- `apps/backend/scripts/import-keypads.ts`

Input zip:
- `apps/backend/imports/Keypads.zip`

Commands:
```bash
# Validate only
pnpm -C apps/backend import:keypads -- --zip imports/Keypads.zip --validate-only

# Import (defaults price=0; set pricing later in Admin UI)
pnpm -C apps/backend import:keypads -- --zip imports/Keypads.zip --apply
```

Status:
- Keypads imported: 6 models
- SKUs and slotMapKey set: `PKP-2200-SI`, `PKP-2300-SI`, `PKP-2400-SI`, `PKP-2500-SI`, `PKP-2600-SI`, `PKP-3500-SI`

## Master Prompt Checklist (High Level)

### Done
- Vendure bootstrapped and running
- Admin UI reachable via `:3000/admin`
- MinIO S3 asset strategy wired and working
- DefaultSearchPlugin enabled (prevents search resolver errors)
- Icon import + locked Render/Insert mapping implemented via scripts

### Partial / In Progress
- Keypad importer implemented; needs Keypads.zip to run

### Not Started (Yet)
- ElasticsearchPlugin with Elasticsearch pinned to 7.9.2
- Mailpit + EmailPlugin (SMTP) end-to-end wiring
- ntfy internal alerts
- Storefront (Next.js App Router + Tailwind) implementation
- Configurator MVP UI (popup Render -> slot Insert overlay)
- Order line custom fields for keypad configuration display in Admin UI (beyond the existing placeholder)
- Inventory reservation/commit/release lifecycle for “free icons in keypad config”
- Deterministic A4 PDF generation via Playwright/Chromium
- CI/CD + staging gate + prod hardening workflows

## Immediate Next Steps
1. Upload `apps/backend/imports/Keypads.zip` and run `import:keypads` validate-only then apply.
2. Define slot-map specs and ingest slot-map metadata keyed by `slotMapKey`.
3. Create ring colour swatches + glow ring palette (no zip needed) and decide the canonical data format for the configurator.
4. Build a simple Next.js sandbox page to prove:
   - Popup grid uses Render (featured asset)
   - Slot overlay uses Insert (via `insertAssetId`)
