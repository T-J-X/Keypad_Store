# Frontend UI Handoff: Icon Categories via Product Custom Field

## Source of Truth (Locked)
- Categories for icons are now sourced from:
  - `Product.customFields.iconCategories: string[]`
- Collections are not authoritative for icon categorisation.
- `iconCategoryPath` is legacy and should not drive UI filtering.

## What Changed
- Storefront category sidebar, chips, filtering, and product detail category display now read only from `iconCategories`.
- Sandbox configurator popup category list/filter now reads only from `iconCategories`.
- Spreadsheet backfill now writes `iconCategories` and does not touch Collections.

## Backend Changes
- Added Product custom field:
  - `iconCategories` (`list: string`, `public: true`, UI tab `Icons`)
- Removed custom plugin that disabled collection filter jobs.
- Kept Vendure job queue behavior untouched.

Files:
- `apps/backend/src/index.ts`

## Backfill Script
- Script: `apps/backend/scripts/sync-icon-catalog.ts`
- Reads XLSX/CSV source and updates `customFields.iconCategories` for icon products.
- Matching strategy (in order):
  - SKU column
  - Exact icon name
  - SKU parsed from `"<CODE> - <Name>"`
  - Name without leading code

Command:
```bash
pnpm -C apps/backend sync:icon-catalog -- --apply
```

Expected summary:
- Parsed rows: 212
- Products updated: 212
- Products not found / rows skipped: 0

## Storefront Changes
Files:
- `apps/storefront/lib/vendure.ts`
- `apps/storefront/lib/vendure.server.ts`
- `apps/storefront/app/shop/page.tsx`
- `apps/storefront/components/ShopClient.tsx`
- `apps/storefront/app/product/[slug]/page.tsx`

Behavior:
- Category list is derived from all icon products’ `iconCategories`.
- Icons can be in 1..N categories.
- Filtering includes an icon if selected category exists in its `iconCategories` array.
- Missing/empty categories fallback to `Uncategorised`.

## Configurator Changes
Files:
- `apps/sandbox-configurator/src/vendure.ts`
- `apps/sandbox-configurator/src/App.tsx`

Behavior:
- Popup category list is built from `iconCategories` values.
- Multi-category icons appear under each applicable category.
- Slot list display can show joined category labels.

## Admin Workflow (No Code)
To categorise a new icon in Vendure Admin:
1. Open the icon product.
2. Go to custom fields tab `Icons`.
3. Edit `iconCategories` list.
4. Save.

Notes:
- Works with single category or multiple categories.
- Collections may still exist for optional navigation, but they do not drive icon category logic.
