import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  AssetPickerDialogComponent,
  DataService,
  ModalService,
  NotificationService,
  SharedModule,
} from '@vendure/admin-ui/core';
import gql from 'graphql-tag';
import { Subject, finalize, firstValueFrom, takeUntil } from 'rxjs';

interface AssetPreview {
  id: string;
  name: string | null;
  preview: string | null;
}

interface BaseShopTopTileData {
  id: string;
  label: string | null;
  subtitle: string | null;
  href: string | null;
  hoverStyle: string | null;
  kind: string | null;
  isEnabled: boolean;
  imageAssetId: string | null;
}

interface BaseShopDisciplineTileData {
  id: string;
  labelOverride: string | null;
  order: number | null;
  isEnabled: boolean;
  imageAssetId: string | null;
}

interface BaseShopConfigData {
  id: string;
  featuredProductSlugs: string[];
  topTiles: BaseShopTopTileData[];
  disciplineTiles: BaseShopDisciplineTileData[];
}

interface BaseShopConfigQuery {
  baseShopConfig: BaseShopConfigData;
}

interface UpdateBaseShopConfigMutation {
  updateBaseShopConfig: BaseShopConfigData;
}

interface BaseShopConfigInput {
  topTiles?: Array<{
    id?: string | null;
    label?: string | null;
    subtitle?: string | null;
    href?: string | null;
    hoverStyle?: string | null;
    kind?: string | null;
    isEnabled?: boolean;
    imageAssetId?: string | null;
  }> | null;
  disciplineTiles?: Array<{
    id?: string | null;
    labelOverride?: string | null;
    order?: number | null;
    isEnabled?: boolean;
    imageAssetId?: string | null;
  }> | null;
  featuredProductSlugs?: string[] | null;
}

interface UpdateBaseShopConfigVariables {
  input: BaseShopConfigInput;
}

interface AssetByIdQuery {
  asset: AssetPreview | null;
}

interface AssetByIdVariables {
  id: string;
}

interface AssetSelection {
  id: string;
  name?: string | null;
  preview?: string | null;
}

interface IconCategoryProductsQuery {
  products: {
    totalItems: number;
    items: Array<{
      customFields?: {
        isIconProduct?: boolean | null;
        iconCategories?: string[] | null;
      } | null;
    }>;
  };
}

interface IconCategoryProductsVariables {
  options: {
    take: number;
    skip: number;
    filter?: {
      isIconProduct?: {
        eq?: boolean;
      };
    };
  };
}

interface AvailableCategory {
  slug: string;
  name: string;
  count: number;
}

const GET_BASE_SHOP_CONFIG = gql`
  query GetBaseShopConfig {
    baseShopConfig {
      id
      topTiles {
        id
        label
        subtitle
        href
        hoverStyle
        kind
        isEnabled
        imageAssetId
      }
      disciplineTiles {
        id
        labelOverride
        order
        isEnabled
        imageAssetId
      }
      featuredProductSlugs
    }
  }
`;

const UPDATE_BASE_SHOP_CONFIG = gql`
  mutation UpdateBaseShopConfig($input: UpdateBaseShopConfigInput!) {
    updateBaseShopConfig(input: $input) {
      id
      topTiles {
        id
        label
        subtitle
        href
        hoverStyle
        kind
        isEnabled
        imageAssetId
      }
      disciplineTiles {
        id
        labelOverride
        order
        isEnabled
        imageAssetId
      }
      featuredProductSlugs
    }
  }
`;

const GET_ASSET_BY_ID = gql`
  query GetAssetById($id: ID!) {
    asset(id: $id) {
      id
      name
      preview
    }
  }
`;

const GET_ICON_CATEGORY_PRODUCTS = gql`
  query GetIconCategoryProducts($options: ProductListOptions) {
    products(options: $options) {
      totalItems
      items {
        customFields {
          isIconProduct
          iconCategories
        }
      }
    }
  }
`;

@Component({
  selector: 'base-shop-config',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule],
  template: `
    <vdr-page-block>
      <vdr-action-bar>
        <vdr-ab-left>
          <h2>Shop Landing page</h2>
        </vdr-ab-left>
        <vdr-ab-right>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="loading || saving"
            (click)="save()"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </vdr-ab-right>
      </vdr-action-bar>
    </vdr-page-block>

    <vdr-page-block *ngIf="loading">
      <p>Loading shop landing page configuration...</p>
    </vdr-page-block>

    <form class="form" [formGroup]="form" *ngIf="!loading">
      <vdr-page-block>
        <div class="config-stack">
          <vdr-card class="config-card" title="Top Tiles">
            <p class="helper-text">
              Configure up to {{ maxRegularTopTiles }} primary tiles. Discover more is required, cannot be removed,
              and always links to All Products.
            </p>
            <div class="tile-list">
              <div class="tile-row" *ngFor="let tile of topTiles; let i = index">
                <div class="tile-header">
                  <strong>{{ isDiscoverMore(tile) ? 'Discover more (required)' : 'Top tile ' + (i + 1) }}</strong>
                  <div class="tile-controls" *ngIf="!isDiscoverMore(tile)">
                    <button
                      type="button"
                      class="btn btn-sm"
                      [disabled]="i === 0"
                      (click)="moveTopTileUp(i)"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      [disabled]="i === topTiles.length - 1 || (topTiles[i + 1] && isDiscoverMore(topTiles[i + 1]))"
                      (click)="moveTopTileDown(i)"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-danger"
                      (click)="removeTopTile(i)"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <vdr-form-field label="Label">
                  <input
                    type="text"
                    [value]="tile.label ?? ''"
                    (input)="updateTopTileText(i, 'label', $any($event.target).value)"
                  />
                </vdr-form-field>

                <vdr-form-field label="Subtitle">
                  <input
                    type="text"
                    [value]="tile.subtitle ?? ''"
                    (input)="updateTopTileText(i, 'subtitle', $any($event.target).value)"
                  />
                </vdr-form-field>

                <vdr-form-field label="Href" [hint]="isDiscoverMore(tile) ? '/shop?section=all (fixed)' : ''">
                  <input
                    type="text"
                    [readonly]="isDiscoverMore(tile)"
                    [value]="isDiscoverMore(tile) ? '/shop?section=all' : tile.href ?? ''"
                    (input)="updateTopTileText(i, 'href', $any($event.target).value)"
                  />
                </vdr-form-field>

                <vdr-form-field label="Hover style">
                  <select [value]="tile.hoverStyle ?? 'ring-blue'" (change)="updateTopTileHoverStyle(i, $any($event.target).value)">
                    <option value="ring-blue">ring-blue</option>
                    <option value="none">none</option>
                  </select>
                </vdr-form-field>

                <div class="tile-asset-picker">
                  <div class="tile-asset-preview-frame">
                    <img
                      *ngIf="topTileAssetsById.get(i)?.preview; else topTileAssetFallback"
                      [src]="topTileAssetsById.get(i)?.preview || ''"
                      [alt]="topTileAssetsById.get(i)?.name || 'Top tile asset'"
                    />
                  </div>
                  <ng-template #topTileAssetFallback>
                    <div class="tile-asset-placeholder">
                      {{ tile.imageAssetId ? 'Asset selected' : 'No image selected' }}
                    </div>
                  </ng-template>
                  <div class="asset-actions">
                    <button type="button" class="btn btn-sm btn-secondary" (click)="pickTopTileAsset(i)">
                      Select asset
                    </button>
                    <button
                      *ngIf="tile.imageAssetId"
                      type="button"
                      class="btn btn-sm"
                      (click)="clearTopTileAsset(i)"
                    >
                      Clear
                    </button>
                  </div>
                  <p class="helper-text" *ngIf="tile.imageAssetId">Asset ID: {{ tile.imageAssetId }}</p>
                </div>

                <label class="clr-checkbox-wrapper cta-toggle" *ngIf="!isDiscoverMore(tile)">
                  <input
                    type="checkbox"
                    [checked]="tile.isEnabled"
                    (change)="updateTopTileEnabled(i, $any($event.target).checked)"
                  />
                  <span>Enabled</span>
                </label>

                <p class="helper-text" *ngIf="isDiscoverMore(tile)">
                  This tile is required and always appears last.
                </p>
              </div>
            </div>

            <button
              type="button"
              class="btn btn-sm btn-secondary"
              [disabled]="regularTopTileCount >= maxRegularTopTiles"
              (click)="addTopTile()"
            >
              Add top tile
            </button>
          </vdr-card>

          <vdr-card class="config-card" title="Button Insert Categories">
            <p class="helper-text">
              Icon sub-categories are auto-discovered from icon products. Use overrides for custom labels and icons.
            </p>
            <p class="helper-text">
              Design standard: upload transparent SVG/PNG outline icons. Keep visual weight consistent. Icon updates
              go live on storefront without code changes.
            </p>
            <p class="helper-text" *ngIf="loadingCategoryCatalog">Refreshing icon category list...</p>

            <div class="tile-list" *ngIf="disciplineTiles.length > 0; else noCategoryTiles">
              <div class="tile-row" *ngFor="let tile of disciplineTiles; let i = index">
                <div class="tile-header tile-header-stack">
                  <strong>{{ resolveCategoryName(tile.id) }}</strong>
                  <div class="tile-meta">
                    <span>{{ tile.id }}</span>
                    <span *ngIf="resolveCategoryCount(tile.id) !== null">{{ resolveCategoryCount(tile.id) }} inserts</span>
                  </div>
                </div>

                <vdr-form-field label="Category slug">
                  <input type="text" [value]="tile.id" readonly />
                </vdr-form-field>

                <vdr-form-field label="Category label override">
                  <input
                    type="text"
                    [value]="tile.labelOverride ?? ''"
                    (input)="updateDisciplineTileText(i, 'labelOverride', $any($event.target).value)"
                  />
                </vdr-form-field>

                <div class="tile-asset-picker">
                  <div class="tile-asset-preview-frame tile-asset-preview-square">
                    <img
                      *ngIf="disciplineTileAssetsById.get(i)?.preview; else disciplineTileAssetFallback"
                      [src]="disciplineTileAssetsById.get(i)?.preview || ''"
                      [alt]="disciplineTileAssetsById.get(i)?.name || 'Category icon asset'"
                    />
                  </div>
                  <ng-template #disciplineTileAssetFallback>
                    <div class="tile-asset-placeholder">
                      {{ tile.imageAssetId ? 'Asset selected' : 'No icon selected' }}
                    </div>
                  </ng-template>
                  <div class="asset-actions">
                    <button type="button" class="btn btn-sm btn-secondary" (click)="pickDisciplineTileAsset(i)">
                      Select icon
                    </button>
                    <button
                      *ngIf="tile.imageAssetId"
                      type="button"
                      class="btn btn-sm"
                      (click)="clearDisciplineTileAsset(i)"
                    >
                      Clear
                    </button>
                  </div>
                  <p class="helper-text" *ngIf="tile.imageAssetId">Asset ID: {{ tile.imageAssetId }}</p>
                </div>

                <label class="clr-checkbox-wrapper cta-toggle">
                  <input
                    type="checkbox"
                    [checked]="tile.isEnabled"
                    (change)="updateDisciplineTileEnabled(i, $any($event.target).checked)"
                  />
                  <span>Enabled</span>
                </label>
              </div>
            </div>

            <ng-template #noCategoryTiles>
              <div class="empty-state">No icon categories found yet. Add icon products with category values to populate this list.</div>
            </ng-template>
          </vdr-card>

          <vdr-card class="config-card" title="Featured Keypads">
            <vdr-form-field
              label="Featured product slugs"
              for="featuredProductSlugs"
              hint="One slug per line (or comma-separated)"
            >
              <textarea
                id="featuredProductSlugs"
                rows="4"
                formControlName="featuredProductSlugs"
              ></textarea>
            </vdr-form-field>
          </vdr-card>
        </div>
      </vdr-page-block>
    </form>
  `,
  styles: [
    `
      .config-stack {
        display: grid;
        gap: 1rem;
      }

      .config-card {
        display: block;
      }

      :host ::ng-deep .config-card .card {
        border-radius: 12px;
        border: 1px solid var(--clr-color-neutral-400);
        background: var(--clr-global-app-background, var(--clr-color-neutral-0));
        box-shadow: 0 4px 14px color-mix(in srgb, var(--clr-color-neutral-900) 10%, transparent);
      }

      :host ::ng-deep .config-card .card-header {
        border-bottom: 1px solid var(--clr-color-neutral-400);
      }

      :host ::ng-deep .config-card .card-title {
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .asset-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        row-gap: 0.375rem;
        margin-bottom: 1rem;
      }

      .cta-toggle {
        margin-top: 0.5rem;
      }

      .tile-list {
        display: grid;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .tile-row {
        border: 1px solid var(--clr-color-neutral-400);
        border-radius: 10px;
        padding: 0.85rem;
        background: var(--clr-global-app-background, var(--clr-color-neutral-0));
        transition: border-color 0.18s ease, box-shadow 0.18s ease;
      }

      .tile-row:hover {
        border-color: var(--clr-color-primary-500);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--clr-color-primary-500) 28%, transparent);
      }

      .tile-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }

      .tile-header-stack {
        align-items: flex-start;
        flex-direction: column;
        gap: 0.125rem;
      }

      .tile-controls {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .tile-controls .btn {
        min-width: 3.25rem;
      }

      .tile-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--clr-color-neutral-600);
      }

      .helper-text {
        margin: 0 0 0.75rem;
        color: var(--clr-color-neutral-700);
        font-size: 0.85rem;
      }

      .tile-asset-picker {
        margin-bottom: 0.75rem;
      }

      .tile-asset-preview-frame {
        width: 100%;
        max-width: 260px;
        height: 120px;
        border: 1px solid var(--clr-color-neutral-400);
        border-radius: 8px;
        overflow: hidden;
        background: var(--clr-color-neutral-100);
        margin-bottom: 0.5rem;
      }

      .tile-asset-preview-square {
        max-width: 120px;
      }

      .tile-asset-preview-frame img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .tile-asset-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--clr-color-neutral-600);
        font-size: 0.875rem;
      }

      .empty-state {
        border: 1px dashed var(--clr-color-neutral-500);
        border-radius: 10px;
        padding: 0.75rem;
        color: var(--clr-color-neutral-700);
        font-size: 0.875rem;
      }

      input[readonly] {
        background: color-mix(in srgb, var(--clr-global-app-background, var(--clr-color-neutral-0)) 80%, var(--clr-color-neutral-300) 20%);
      }

      @media (max-width: 900px) {
        :host ::ng-deep .config-card .card-block {
          padding-left: 0.75rem;
          padding-right: 0.75rem;
        }
      }
    `,
  ],
})
export class BaseShopConfigComponent implements OnInit, OnDestroy {
  readonly maxRegularTopTiles = 5;

  form = this.formBuilder.group({
    featuredProductSlugs: this.formBuilder.nonNullable.control(''),
  });

  loading = true;
  saving = false;
  loadingCategoryCatalog = false;
  topTiles: BaseShopTopTileData[] = [];
  disciplineTiles: BaseShopDisciplineTileData[] = [];
  topTileAssetsById = new Map<number, AssetPreview>();
  disciplineTileAssetsById = new Map<number, AssetPreview>();

  private configuredDisciplineTiles: BaseShopDisciplineTileData[] = [];
  private availableCategoriesBySlug = new Map<string, AvailableCategory>();
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private dataService: DataService,
    private modalService: ModalService,
    private notificationService: NotificationService,
  ) {}

  get regularTopTileCount(): number {
    return this.topTiles.filter((tile) => !this.isDiscoverMore(tile)).length;
  }

  ngOnInit(): void {
    this.loadConfig();
    void this.loadIconCategoryCatalog();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  pickTopTileAsset(index: number): void {
    const tile = this.topTiles[index];
    if (!tile) return;

    this.openSingleAssetPicker((asset) => {
      tile.imageAssetId = String(asset.id);
      this.topTileAssetsById.set(index, asset);
    });
  }

  clearTopTileAsset(index: number): void {
    const tile = this.topTiles[index];
    if (!tile) return;
    tile.imageAssetId = null;
    this.topTileAssetsById.delete(index);
  }

  pickDisciplineTileAsset(index: number): void {
    const tile = this.disciplineTiles[index];
    if (!tile) return;

    this.openSingleAssetPicker((asset) => {
      tile.imageAssetId = String(asset.id);
      this.disciplineTileAssetsById.set(index, asset);
    });
  }

  clearDisciplineTileAsset(index: number): void {
    const tile = this.disciplineTiles[index];
    if (!tile) return;
    tile.imageAssetId = null;
    this.disciplineTileAssetsById.delete(index);
  }

  addTopTile(): void {
    if (this.regularTopTileCount >= this.maxRegularTopTiles) {
      return;
    }

    const nextTile: BaseShopTopTileData = {
      id: '',
      label: null,
      subtitle: null,
      href: null,
      hoverStyle: 'ring-blue',
      kind: 'section',
      isEnabled: true,
      imageAssetId: null,
    };

    const discoverIndex = this.topTiles.findIndex((tile) => this.isDiscoverMore(tile));
    if (discoverIndex === -1) {
      this.topTiles = [nextTile, this.createDiscoverMoreTile()];
      this.topTileAssetsById.clear();
      return;
    }

    this.topTileAssetsById = this.shiftAssetMapForInsert(this.topTileAssetsById, discoverIndex);
    const next = [...this.topTiles];
    next.splice(discoverIndex, 0, nextTile);
    this.topTiles = next;
  }

  removeTopTile(index: number): void {
    const tile = this.topTiles[index];
    if (!tile || this.isDiscoverMore(tile)) {
      return;
    }

    this.topTileAssetsById = this.shiftAssetMapForRemoval(this.topTileAssetsById, index);
    this.topTiles = this.topTiles.filter((_, currentIndex) => currentIndex !== index);
  }

  moveTopTileUp(index: number): void {
    const tile = this.topTiles[index];
    if (!tile || this.isDiscoverMore(tile) || index <= 0) {
      return;
    }
    this.swapTopTiles(index, index - 1);
  }

  moveTopTileDown(index: number): void {
    const tile = this.topTiles[index];
    const nextTile = this.topTiles[index + 1];
    if (!tile || this.isDiscoverMore(tile)) {
      return;
    }
    if (!nextTile || this.isDiscoverMore(nextTile)) {
      return;
    }
    this.swapTopTiles(index, index + 1);
  }

  swapTopTiles(a: number, b: number): void {
    if (a < 0 || b < 0 || a >= this.topTiles.length || b >= this.topTiles.length || a === b) {
      return;
    }
    const next = [...this.topTiles];
    [next[a], next[b]] = [next[b], next[a]];
    this.topTiles = next;
    this.swapAssetMapEntries(this.topTileAssetsById, a, b);
  }

  updateTopTileText(
    index: number,
    field: 'label' | 'subtitle' | 'href' | 'imageAssetId' | 'id',
    value: string,
  ): void {
    const tile = this.topTiles[index];
    if (!tile) return;
    if (this.isDiscoverMore(tile) && field === 'href') {
      tile.href = '/shop?section=all';
      return;
    }

    const trimmed = value.trim();
    if (field === 'id') {
      tile.id = trimmed;
    } else {
      tile[field] = trimmed.length > 0 ? value : null;
    }

    if (field === 'imageAssetId') {
      this.topTileAssetsById.delete(index);
    }
  }

  updateTopTileHoverStyle(index: number, value: string): void {
    const tile = this.topTiles[index];
    if (!tile) return;
    tile.hoverStyle = value === 'none' ? 'none' : 'ring-blue';
  }

  updateTopTileEnabled(index: number, value: boolean): void {
    const tile = this.topTiles[index];
    if (!tile || this.isDiscoverMore(tile)) return;
    tile.isEnabled = value;
  }

  updateDisciplineTileText(
    index: number,
    field: 'labelOverride' | 'imageAssetId',
    value: string,
  ): void {
    const tile = this.disciplineTiles[index];
    if (!tile) return;
    const trimmed = value.trim();
    tile[field] = trimmed.length > 0 ? value : null;
    if (field === 'imageAssetId') {
      this.disciplineTileAssetsById.delete(index);
    }
  }

  updateDisciplineTileEnabled(index: number, value: boolean): void {
    const tile = this.disciplineTiles[index];
    if (!tile) return;
    tile.isEnabled = value;
  }

  resolveCategoryName(slug: string): string {
    return this.availableCategoriesBySlug.get(slug)?.name ?? this.humanizeSlug(slug);
  }

  resolveCategoryCount(slug: string): number | null {
    return this.availableCategoriesBySlug.get(slug)?.count ?? null;
  }

  isDiscoverMore(tile: BaseShopTopTileData): boolean {
    return tile.kind === 'exploreMore';
  }

  save(): void {
    const input = this.getInput();

    this.saving = true;
    this.dataService
      .mutate<UpdateBaseShopConfigMutation, UpdateBaseShopConfigVariables>(UPDATE_BASE_SHOP_CONFIG, {
        input,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.saving = false;
        }),
      )
      .subscribe({
        next: ({ updateBaseShopConfig }) => {
          this.applyConfig(updateBaseShopConfig);
          this.notificationService.success('Shop landing page saved');
        },
        error: () => {
          this.notificationService.error('Could not save shop landing page');
        },
      });
  }

  private loadConfig(): void {
    this.loading = true;
    this.dataService
      .query<BaseShopConfigQuery, Record<string, never>>(GET_BASE_SHOP_CONFIG)
      .mapSingle((result) => result.baseShopConfig)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (config) => this.applyConfig(config),
        error: () => {
          this.notificationService.error('Could not load shop landing page');
        },
      });
  }

  private async loadIconCategoryCatalog(): Promise<void> {
    this.loadingCategoryCatalog = true;

    try {
      const take = 100;
      let skip = 0;
      let totalItems = 0;
      const bySlug = new Map<string, AvailableCategory>();

      do {
        const page = await firstValueFrom(
          this.dataService
            .query<IconCategoryProductsQuery, IconCategoryProductsVariables>(GET_ICON_CATEGORY_PRODUCTS, {
              options: {
                take,
                skip,
                filter: {
                  isIconProduct: {
                    eq: true,
                  },
                },
              },
            })
            .mapSingle((result) => result.products),
        );

        const items = page?.items ?? [];
        totalItems = page?.totalItems ?? 0;

        for (const item of items) {
          const customFields = item.customFields;
          const categories = Array.isArray(customFields?.iconCategories)
            ? customFields.iconCategories
            : [];

          const validCategories = categories
            .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
            .map((value) => value.trim());

          const isIconProduct = customFields?.isIconProduct === true || validCategories.length > 0;
          if (!isIconProduct) {
            continue;
          }

          for (const categoryNameRaw of validCategories) {
            const categoryName = this.normalizeCategoryName(categoryNameRaw);
            const slug = this.toCategorySlug(categoryName);
            const existing = bySlug.get(slug);
            if (existing) {
              existing.count += 1;
              continue;
            }
            bySlug.set(slug, {
              slug,
              name: categoryName,
              count: 1,
            });
          }
        }

        if (items.length === 0) {
          break;
        }
        skip += items.length;
      } while (skip < totalItems);

      this.availableCategoriesBySlug = new Map(
        [...bySlug.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name)),
      );
      this.rebuildDisciplineTiles();
    } catch {
      this.notificationService.error('Could not load icon category list');
    } finally {
      this.loadingCategoryCatalog = false;
    }
  }

  private applyConfig(config: BaseShopConfigData): void {
    this.topTiles = this.normalizeTopTiles(config.topTiles ?? []);
    this.configuredDisciplineTiles = this.normalizeDisciplineTiles(config.disciplineTiles ?? []);
    this.rebuildDisciplineTiles();

    this.form.patchValue({
      featuredProductSlugs: (config.featuredProductSlugs ?? []).join('\n'),
    });
    this.form.markAsPristine();
  }

  private rebuildDisciplineTiles(): void {
    const existingBySlug = new Map<string, BaseShopDisciplineTileData>();

    for (const tile of this.configuredDisciplineTiles) {
      const slug = this.toCategorySlug(tile.id ?? '');
      if (!slug) {
        continue;
      }
      existingBySlug.set(slug, {
        ...tile,
        id: slug,
      });
    }

    const fromCatalog = [...this.availableCategoriesBySlug.keys()].map((slug, index) => {
      const existing = existingBySlug.get(slug);
      return {
        id: slug,
        labelOverride: existing?.labelOverride ?? null,
        order: existing?.order ?? index,
        isEnabled: existing?.isEnabled !== false,
        imageAssetId: existing?.imageAssetId ?? null,
      } satisfies BaseShopDisciplineTileData;
    });

    const legacyOnly = [...existingBySlug.values()]
      .filter((tile) => !this.availableCategoriesBySlug.has(tile.id))
      .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));

    this.disciplineTiles = [...fromCatalog, ...legacyOnly].map((tile, index) => ({
      ...tile,
      order: typeof tile.order === 'number' ? tile.order : index,
    }));

    this.loadRepeaterAssetPreviews();
  }

  private openSingleAssetPicker(onSelected: (asset: AssetPreview) => void): void {
    this.modalService
      .fromComponent(AssetPickerDialogComponent, {
        size: 'xl',
        locals: {
          multiSelect: false,
        },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((selection) => {
        const picked = (selection as AssetSelection[] | undefined)?.[0];
        if (!picked) {
          return;
        }
        onSelected({
          id: picked.id,
          name: picked.name ?? null,
          preview: picked.preview ?? null,
        });
      });
  }

  private shiftAssetMapForInsert(
    assetMap: Map<number, AssetPreview>,
    insertIndex: number,
  ): Map<number, AssetPreview> {
    const nextMap = new Map<number, AssetPreview>();
    for (const [index, asset] of assetMap.entries()) {
      nextMap.set(index >= insertIndex ? index + 1 : index, asset);
    }
    return nextMap;
  }

  private shiftAssetMapForRemoval(
    assetMap: Map<number, AssetPreview>,
    removedIndex: number,
  ): Map<number, AssetPreview> {
    const nextMap = new Map<number, AssetPreview>();
    for (const [index, asset] of assetMap.entries()) {
      if (index === removedIndex) {
        continue;
      }
      nextMap.set(index > removedIndex ? index - 1 : index, asset);
    }
    return nextMap;
  }

  private swapAssetMapEntries(
    assetMap: Map<number, AssetPreview>,
    a: number,
    b: number,
  ): void {
    const aAsset = assetMap.get(a);
    const bAsset = assetMap.get(b);

    if (bAsset) {
      assetMap.set(a, bAsset);
    } else {
      assetMap.delete(a);
    }

    if (aAsset) {
      assetMap.set(b, aAsset);
    } else {
      assetMap.delete(b);
    }
  }

  private loadRepeaterAssetPreviews(): void {
    this.topTileAssetsById.clear();
    this.disciplineTileAssetsById.clear();

    this.topTiles.forEach((tile, index) => {
      this.loadIndexedAssetPreview(this.topTileAssetsById, index, tile.imageAssetId);
    });

    this.disciplineTiles.forEach((tile, index) => {
      this.loadIndexedAssetPreview(this.disciplineTileAssetsById, index, tile.imageAssetId);
    });
  }

  private loadIndexedAssetPreview(
    targetMap: Map<number, AssetPreview>,
    index: number,
    id: string | null,
  ): void {
    if (!id) {
      targetMap.delete(index);
      return;
    }

    this.dataService
      .query<AssetByIdQuery, AssetByIdVariables>(GET_ASSET_BY_ID, { id })
      .mapSingle((result) => result.asset)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (asset) => {
          if (!asset) {
            targetMap.delete(index);
            return;
          }
          targetMap.set(index, asset);
        },
        error: () => targetMap.delete(index),
      });
  }

  private getInput(): BaseShopConfigInput {
    const value = this.form.getRawValue();

    const topTiles = this.topTiles.map((tile, index) => {
      const discover = this.isDiscoverMore(tile);
      return {
        id: this.toNullableString(tile.id ?? '') ?? (discover ? 'explore-more' : `top-tile-${index + 1}`),
        label: this.toNullableString(tile.label ?? ''),
        subtitle: this.toNullableString(tile.subtitle ?? ''),
        href: discover ? '/shop?section=all' : this.toNullableString(tile.href ?? ''),
        hoverStyle: this.toNullableString(tile.hoverStyle ?? '') ?? 'ring-blue',
        kind: discover ? 'exploreMore' : this.toNullableString(tile.kind ?? '') ?? 'section',
        isEnabled: discover ? true : tile.isEnabled !== false,
        imageAssetId: this.toNullableString(tile.imageAssetId ?? ''),
      };
    });

    const disciplineTiles = this.disciplineTiles.map((tile, index) => ({
      id: this.toNullableString(tile.id ?? '') ?? `discipline-${index + 1}`,
      labelOverride: this.toNullableString(tile.labelOverride ?? ''),
      order: index,
      isEnabled: tile.isEnabled !== false,
      imageAssetId: this.toNullableString(tile.imageAssetId ?? ''),
    }));

    return {
      topTiles,
      disciplineTiles,
      featuredProductSlugs: this.parseFeaturedProductSlugs(value.featuredProductSlugs),
    };
  }

  private toNullableString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseFeaturedProductSlugs(value: string): string[] {
    return Array.from(
      new Set(
        value
          .split(/[\n,]/g)
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }

  private normalizeTopTiles(tiles: BaseShopTopTileData[]): BaseShopTopTileData[] {
    const normalizedTiles = (tiles ?? []).map((tile) => ({
      id: tile.id ?? '',
      label: tile.label ?? null,
      subtitle: tile.subtitle ?? null,
      href: tile.href ?? null,
      hoverStyle: tile.hoverStyle ?? 'ring-blue',
      kind: tile.kind ?? 'section',
      isEnabled: tile.isEnabled !== false,
      imageAssetId: tile.imageAssetId ?? null,
    }));

    const discoverMoreTile = normalizedTiles.find((tile) => this.isDiscoverMore(tile)) ?? this.createDiscoverMoreTile();
    discoverMoreTile.kind = 'exploreMore';
    discoverMoreTile.isEnabled = true;
    discoverMoreTile.href = '/shop?section=all';

    const nonDiscoverTiles = normalizedTiles
      .filter((tile) => !this.isDiscoverMore(tile))
      .slice(0, this.maxRegularTopTiles);

    return [...nonDiscoverTiles, discoverMoreTile];
  }

  private createDiscoverMoreTile(): BaseShopTopTileData {
    return {
      id: 'explore-more',
      label: 'Discover more',
      subtitle: null,
      href: '/shop?section=all',
      hoverStyle: 'ring-blue',
      kind: 'exploreMore',
      isEnabled: true,
      imageAssetId: null,
    };
  }

  private normalizeDisciplineTiles(tiles: BaseShopDisciplineTileData[]): BaseShopDisciplineTileData[] {
    return (tiles ?? []).map((tile, index) => ({
      id: this.toCategorySlug(tile.id ?? `discipline-${index + 1}`),
      labelOverride: tile.labelOverride ?? null,
      order: typeof tile.order === 'number' ? tile.order : index,
      isEnabled: tile.isEnabled !== false,
      imageAssetId: tile.imageAssetId ?? null,
    }));
  }

  private normalizeCategoryName(input: string): string {
    const trimmed = input.trim();
    return trimmed || 'Uncategorised';
  }

  private toCategorySlug(input: string): string {
    return this.normalizeCategoryName(input)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'uncategorised';
  }

  private humanizeSlug(value: string): string {
    const acronymMap: Record<string, string> = {
      hvac: 'HVAC',
    };

    return value
      .trim()
      .replace(/[-_]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const lower = word.toLowerCase();
        if (acronymMap[lower]) {
          return acronymMap[lower];
        }
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(' ');
  }
}
