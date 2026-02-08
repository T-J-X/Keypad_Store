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
import { Subject, finalize, takeUntil } from 'rxjs';

type TileKey = 'left' | 'right';

interface AssetPreview {
  id: string;
  name: string | null;
  preview: string | null;
}

interface BaseShopCategoryTileData {
  id: string;
  title: string | null;
  subtitle: string | null;
  href: string | null;
  imageAssetId: string | null;
  hoverStyle: string | null;
  isEnabled: boolean;
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
  leftImageAssetId: string | null;
  rightImageAssetId: string | null;
  leftTitle: string | null;
  leftBody: string | null;
  leftCtaText: string | null;
  leftCtaUrl: string | null;
  leftCtaEnabled: boolean;
  rightTitle: string | null;
  rightBody: string | null;
  rightCtaText: string | null;
  rightCtaUrl: string | null;
  rightCtaEnabled: boolean;
  categoryTiles: BaseShopCategoryTileData[];
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
  leftImageAssetId?: string | null;
  rightImageAssetId?: string | null;
  leftTitle?: string | null;
  leftBody?: string | null;
  leftCtaText?: string | null;
  leftCtaUrl?: string | null;
  leftCtaEnabled?: boolean;
  rightTitle?: string | null;
  rightBody?: string | null;
  rightCtaText?: string | null;
  rightCtaUrl?: string | null;
  rightCtaEnabled?: boolean;
  categoryTiles?: Array<{
    id?: string | null;
    title?: string | null;
    subtitle?: string | null;
    href?: string | null;
    imageAssetId?: string | null;
    hoverStyle?: string | null;
    isEnabled?: boolean;
  }> | null;
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

const GET_BASE_SHOP_CONFIG = gql`
  query GetBaseShopConfig {
    baseShopConfig {
      id
      leftImageAssetId
      rightImageAssetId
      leftTitle
      leftBody
      leftCtaText
      leftCtaUrl
      leftCtaEnabled
      rightTitle
      rightBody
      rightCtaText
      rightCtaUrl
      rightCtaEnabled
      categoryTiles {
        id
        title
        subtitle
        href
        imageAssetId
        hoverStyle
        isEnabled
      }
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
      leftImageAssetId
      rightImageAssetId
      leftTitle
      leftBody
      leftCtaText
      leftCtaUrl
      leftCtaEnabled
      rightTitle
      rightBody
      rightCtaText
      rightCtaUrl
      rightCtaEnabled
      categoryTiles {
        id
        title
        subtitle
        href
        imageAssetId
        hoverStyle
        isEnabled
      }
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

@Component({
  selector: 'base-shop-config',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule],
  template: `
    <vdr-page-block>
      <vdr-action-bar>
        <vdr-ab-left>
          <h2>Baseshop</h2>
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
      <p>Loading Baseshop configuration...</p>
    </vdr-page-block>

    <form class="form" [formGroup]="form" *ngIf="!loading">
      <vdr-page-block>
        <div class="baseshop-grid">
          <vdr-card title="Left Tile">
            <div class="asset-preview-frame">
              <img
                *ngIf="leftAsset?.preview; else leftAssetPlaceholder"
                [src]="leftAsset?.preview || ''"
                [alt]="leftAsset?.name || 'Left tile image'"
              />
            </div>
            <ng-template #leftAssetPlaceholder>
              <div class="asset-placeholder">No image selected</div>
            </ng-template>

            <div class="asset-actions">
              <button type="button" class="btn btn-sm btn-secondary" (click)="openAssetPicker('left')">
                Select image
              </button>
              <button
                type="button"
                class="btn btn-sm"
                [disabled]="!form.controls.leftImageAssetId.value"
                (click)="clearAsset('left')"
              >
                Clear
              </button>
            </div>

            <vdr-form-field label="Title (optional)" for="leftTitle">
              <input id="leftTitle" type="text" formControlName="leftTitle" />
            </vdr-form-field>

            <vdr-form-field label="Body (optional)" for="leftBody">
              <textarea id="leftBody" rows="3" formControlName="leftBody"></textarea>
            </vdr-form-field>

            <vdr-form-field label="CTA text (optional)" for="leftCtaText">
              <input id="leftCtaText" type="text" formControlName="leftCtaText" />
            </vdr-form-field>

            <vdr-form-field label="CTA URL (optional)" for="leftCtaUrl">
              <input id="leftCtaUrl" type="url" formControlName="leftCtaUrl" />
            </vdr-form-field>

            <label class="clr-checkbox-wrapper cta-toggle">
              <input type="checkbox" formControlName="leftCtaEnabled" />
              <span>CTA enabled</span>
            </label>
          </vdr-card>

          <vdr-card title="Right Tile">
            <div class="asset-preview-frame">
              <img
                *ngIf="rightAsset?.preview; else rightAssetPlaceholder"
                [src]="rightAsset?.preview || ''"
                [alt]="rightAsset?.name || 'Right tile image'"
              />
            </div>
            <ng-template #rightAssetPlaceholder>
              <div class="asset-placeholder">No image selected</div>
            </ng-template>

            <div class="asset-actions">
              <button type="button" class="btn btn-sm btn-secondary" (click)="openAssetPicker('right')">
                Select image
              </button>
              <button
                type="button"
                class="btn btn-sm"
                [disabled]="!form.controls.rightImageAssetId.value"
                (click)="clearAsset('right')"
              >
                Clear
              </button>
            </div>

            <vdr-form-field label="Title (optional)" for="rightTitle">
              <input id="rightTitle" type="text" formControlName="rightTitle" />
            </vdr-form-field>

            <vdr-form-field label="Body (optional)" for="rightBody">
              <textarea id="rightBody" rows="3" formControlName="rightBody"></textarea>
            </vdr-form-field>

            <vdr-form-field label="CTA text (optional)" for="rightCtaText">
              <input id="rightCtaText" type="text" formControlName="rightCtaText" />
            </vdr-form-field>

            <vdr-form-field label="CTA URL (optional)" for="rightCtaUrl">
              <input id="rightCtaUrl" type="url" formControlName="rightCtaUrl" />
            </vdr-form-field>

            <label class="clr-checkbox-wrapper cta-toggle">
              <input type="checkbox" formControlName="rightCtaEnabled" />
              <span>CTA enabled</span>
            </label>
          </vdr-card>
        </div>

        <vdr-card title="Top Tiles (Shop Landing)">
          <p class="helper-text">
            Configure top landing tiles. Discover more is required and always appears last.
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

              <vdr-form-field label="Href">
                <input
                  type="text"
                  [value]="tile.href ?? ''"
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

          <button type="button" class="btn btn-sm btn-secondary" (click)="addTopTile()">Add top tile</button>
        </vdr-card>

        <vdr-card title="Discipline Tiles (Explore Button Inserts by Discipline)">
          <p class="helper-text">
            Use an id matching a category slug to make the tile clickable (e.g. engine).
          </p>
          <div class="tile-list">
            <div class="tile-row" *ngFor="let tile of disciplineTiles; let i = index">
              <div class="tile-header">
                <strong>Discipline tile {{ i + 1 }}</strong>
                <div class="tile-controls">
                  <button
                    type="button"
                    class="btn btn-sm"
                    [disabled]="i === 0"
                    (click)="moveDisciplineTileUp(i)"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm"
                    [disabled]="i === disciplineTiles.length - 1"
                    (click)="moveDisciplineTileDown(i)"
                  >
                    Down
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" (click)="removeDisciplineTile(i)">
                    Delete
                  </button>
                </div>
              </div>

              <vdr-form-field label="id (category slug)">
                <input
                  type="text"
                  [value]="tile.id ?? ''"
                  (input)="updateDisciplineTileText(i, 'id', $any($event.target).value)"
                />
              </vdr-form-field>

              <vdr-form-field label="labelOverride">
                <input
                  type="text"
                  [value]="tile.labelOverride ?? ''"
                  (input)="updateDisciplineTileText(i, 'labelOverride', $any($event.target).value)"
                />
              </vdr-form-field>

              <vdr-form-field label="order">
                <input
                  type="number"
                  [value]="tile.order ?? ''"
                  (input)="updateDisciplineTileOrder(i, $any($event.target).value)"
                />
              </vdr-form-field>

              <div class="tile-asset-picker">
                <div class="tile-asset-preview-frame">
                  <img
                    *ngIf="disciplineTileAssetsById.get(i)?.preview; else disciplineTileAssetFallback"
                    [src]="disciplineTileAssetsById.get(i)?.preview || ''"
                    [alt]="disciplineTileAssetsById.get(i)?.name || 'Discipline tile asset'"
                  />
                </div>
                <ng-template #disciplineTileAssetFallback>
                  <div class="tile-asset-placeholder">
                    {{ tile.imageAssetId ? 'Asset selected' : 'No image selected' }}
                  </div>
                </ng-template>
                <div class="asset-actions">
                  <button type="button" class="btn btn-sm btn-secondary" (click)="pickDisciplineTileAsset(i)">
                    Select asset
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

          <button type="button" class="btn btn-sm btn-secondary" (click)="addDisciplineTile()">Add discipline tile</button>
        </vdr-card>

        <vdr-card title="Landing Config (Storefront)">
          <vdr-form-field
            label="Category tiles JSON"
            for="categoryTilesJson"
            hint="Array of tile objects: id, title, subtitle, href, imageAssetId, hoverStyle, isEnabled"
          >
            <textarea
              id="categoryTilesJson"
              rows="10"
              formControlName="categoryTilesJson"
            ></textarea>
          </vdr-form-field>

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
      </vdr-page-block>
    </form>
  `,
  styles: [
    `
      .baseshop-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }

      .asset-preview-frame {
        width: 100%;
        height: 180px;
        border: 1px solid var(--clr-color-neutral-300);
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 0.75rem;
        background: var(--clr-color-neutral-50);
      }

      .asset-preview-frame img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .asset-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--clr-color-neutral-600);
        font-size: 0.875rem;
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
        border: 1px solid var(--clr-color-neutral-300);
        border-radius: 8px;
        padding: 0.75rem;
        background: var(--clr-color-neutral-50);
      }

      .tile-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }

      .tile-controls {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .helper-text {
        margin: 0 0 0.75rem;
        color: var(--clr-color-neutral-700);
      }

      .tile-asset-picker {
        margin-bottom: 0.75rem;
      }

      .tile-asset-preview-frame {
        width: 100%;
        max-width: 260px;
        height: 120px;
        border: 1px solid var(--clr-color-neutral-300);
        border-radius: 6px;
        overflow: hidden;
        background: var(--clr-color-neutral-50);
        margin-bottom: 0.5rem;
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
    `,
  ],
})
export class BaseShopConfigComponent implements OnInit, OnDestroy {
  form = this.formBuilder.group({
    leftImageAssetId: this.formBuilder.control<string | null>(null),
    rightImageAssetId: this.formBuilder.control<string | null>(null),
    leftTitle: this.formBuilder.nonNullable.control(''),
    leftBody: this.formBuilder.nonNullable.control(''),
    leftCtaText: this.formBuilder.nonNullable.control(''),
    leftCtaUrl: this.formBuilder.nonNullable.control(''),
    leftCtaEnabled: this.formBuilder.nonNullable.control(true),
    rightTitle: this.formBuilder.nonNullable.control(''),
    rightBody: this.formBuilder.nonNullable.control(''),
    rightCtaText: this.formBuilder.nonNullable.control(''),
    rightCtaUrl: this.formBuilder.nonNullable.control(''),
    rightCtaEnabled: this.formBuilder.nonNullable.control(true),
    categoryTilesJson: this.formBuilder.nonNullable.control('[]'),
    featuredProductSlugs: this.formBuilder.nonNullable.control(''),
  });

  loading = true;
  saving = false;
  leftAsset: AssetPreview | null = null;
  rightAsset: AssetPreview | null = null;
  topTiles: BaseShopTopTileData[] = [];
  disciplineTiles: BaseShopDisciplineTileData[] = [];
  topTileAssetsById = new Map<number, AssetPreview>();
  disciplineTileAssetsById = new Map<number, AssetPreview>();

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private dataService: DataService,
    private modalService: ModalService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openAssetPicker(tile: TileKey): void {
    this.openSingleAssetPicker((asset) => {
      this.setAsset(tile, asset);
    });
  }

  clearAsset(tile: TileKey): void {
    this.setAsset(tile, null);
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

  addDisciplineTile(): void {
    this.disciplineTiles = [
      ...this.disciplineTiles,
      {
        id: '',
        labelOverride: null,
        order: this.disciplineTiles.length,
        isEnabled: true,
        imageAssetId: null,
      },
    ];
  }

  removeDisciplineTile(index: number): void {
    this.disciplineTileAssetsById = this.shiftAssetMapForRemoval(this.disciplineTileAssetsById, index);
    this.disciplineTiles = this.disciplineTiles.filter((_, currentIndex) => currentIndex !== index);
  }

  moveDisciplineTileUp(index: number): void {
    if (index <= 0 || index >= this.disciplineTiles.length) {
      return;
    }
    this.swapDisciplineTiles(index, index - 1);
  }

  moveDisciplineTileDown(index: number): void {
    if (index < 0 || index >= this.disciplineTiles.length - 1) {
      return;
    }
    this.swapDisciplineTiles(index, index + 1);
  }

  swapDisciplineTiles(a: number, b: number): void {
    if (a < 0 || b < 0 || a >= this.disciplineTiles.length || b >= this.disciplineTiles.length || a === b) {
      return;
    }
    const next = [...this.disciplineTiles];
    [next[a], next[b]] = [next[b], next[a]];
    this.disciplineTiles = next;
    this.swapAssetMapEntries(this.disciplineTileAssetsById, a, b);
  }

  updateDisciplineTileText(
    index: number,
    field: 'id' | 'labelOverride' | 'imageAssetId',
    value: string,
  ): void {
    const tile = this.disciplineTiles[index];
    if (!tile) return;
    const trimmed = value.trim();
    if (field === 'id') {
      tile.id = trimmed;
    } else {
      tile[field] = trimmed.length > 0 ? value : null;
    }
    if (field === 'imageAssetId') {
      this.disciplineTileAssetsById.delete(index);
    }
  }

  updateDisciplineTileOrder(index: number, value: string): void {
    const tile = this.disciplineTiles[index];
    if (!tile) return;
    const trimmed = value.trim();
    if (!trimmed) {
      tile.order = null;
      return;
    }
    const parsed = Number.parseInt(trimmed, 10);
    tile.order = Number.isFinite(parsed) ? parsed : null;
  }

  updateDisciplineTileEnabled(index: number, value: boolean): void {
    const tile = this.disciplineTiles[index];
    if (!tile) return;
    tile.isEnabled = value;
  }

  isDiscoverMore(tile: BaseShopTopTileData): boolean {
    return tile.kind === 'exploreMore';
  }

  save(): void {
    const input = this.getInput();
    if (!input) {
      return;
    }

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
          this.notificationService.success('Baseshop settings saved');
        },
        error: () => {
          this.notificationService.error('Could not save Baseshop settings');
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
          this.notificationService.error('Could not load Baseshop settings');
        },
      });
  }

  private applyConfig(config: BaseShopConfigData): void {
    this.topTiles = this.normalizeTopTiles(config.topTiles ?? []);
    this.disciplineTiles = this.normalizeDisciplineTiles(config.disciplineTiles ?? []);
    this.loadRepeaterAssetPreviews();
    this.form.patchValue({
      leftImageAssetId: config.leftImageAssetId,
      rightImageAssetId: config.rightImageAssetId,
      leftTitle: config.leftTitle ?? '',
      leftBody: config.leftBody ?? '',
      leftCtaText: config.leftCtaText ?? '',
      leftCtaUrl: config.leftCtaUrl ?? '',
      leftCtaEnabled: config.leftCtaEnabled,
      rightTitle: config.rightTitle ?? '',
      rightBody: config.rightBody ?? '',
      rightCtaText: config.rightCtaText ?? '',
      rightCtaUrl: config.rightCtaUrl ?? '',
      rightCtaEnabled: config.rightCtaEnabled,
      categoryTilesJson: JSON.stringify(config.categoryTiles ?? [], null, 2),
      featuredProductSlugs: (config.featuredProductSlugs ?? []).join('\n'),
    });
    this.form.markAsPristine();
    this.loadAssetPreview('left', config.leftImageAssetId);
    this.loadAssetPreview('right', config.rightImageAssetId);
  }

  private loadAssetPreview(tile: TileKey, id: string | null): void {
    if (!id) {
      if (tile === 'left') {
        this.leftAsset = null;
      } else {
        this.rightAsset = null;
      }
      return;
    }

    this.dataService
      .query<AssetByIdQuery, AssetByIdVariables>(GET_ASSET_BY_ID, { id })
      .mapSingle((result) => result.asset)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (asset) => {
          if (!asset) {
            this.setAsset(tile, null, false);
            return;
          }
          this.setAsset(tile, asset, false);
        },
        error: () => this.setAsset(tile, null, false),
      });
  }

  private setAsset(tile: TileKey, asset: AssetPreview | null, markDirty = true): void {
    if (tile === 'left') {
      this.leftAsset = asset;
      this.form.controls.leftImageAssetId.setValue(asset?.id ?? null);
      if (markDirty) {
        this.form.controls.leftImageAssetId.markAsDirty();
      }
    } else {
      this.rightAsset = asset;
      this.form.controls.rightImageAssetId.setValue(asset?.id ?? null);
      if (markDirty) {
        this.form.controls.rightImageAssetId.markAsDirty();
      }
    }
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

  private getInput(): BaseShopConfigInput | null {
    const value = this.form.getRawValue();
    let categoryTiles: BaseShopConfigInput['categoryTiles'] = [];

    try {
      categoryTiles = this.parseCategoryTiles(value.categoryTilesJson);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid category tiles JSON';
      this.notificationService.error(message);
      return null;
    }

    const topTiles = this.topTiles.map((tile, index) => {
      const discover = this.isDiscoverMore(tile);
      return {
        id: this.toNullableString(tile.id ?? '') ?? (discover ? 'explore-more' : `top-tile-${index + 1}`),
        label: this.toNullableString(tile.label ?? ''),
        subtitle: this.toNullableString(tile.subtitle ?? ''),
        href: this.toNullableString(tile.href ?? ''),
        hoverStyle: this.toNullableString(tile.hoverStyle ?? '') ?? 'ring-blue',
        kind: discover ? 'exploreMore' : this.toNullableString(tile.kind ?? '') ?? 'section',
        isEnabled: discover ? true : tile.isEnabled !== false,
        imageAssetId: this.toNullableString(tile.imageAssetId ?? ''),
      };
    });

    const disciplineTiles = this.disciplineTiles.map((tile, index) => ({
      id: this.toNullableString(tile.id ?? '') ?? `discipline-${index + 1}`,
      labelOverride: this.toNullableString(tile.labelOverride ?? ''),
      order: typeof tile.order === 'number' ? tile.order : null,
      isEnabled: tile.isEnabled !== false,
      imageAssetId: this.toNullableString(tile.imageAssetId ?? ''),
    }));

    return {
      leftImageAssetId: value.leftImageAssetId,
      rightImageAssetId: value.rightImageAssetId,
      leftTitle: this.toNullableString(value.leftTitle),
      leftBody: this.toNullableString(value.leftBody),
      leftCtaText: this.toNullableString(value.leftCtaText),
      leftCtaUrl: this.toNullableString(value.leftCtaUrl),
      leftCtaEnabled: value.leftCtaEnabled,
      rightTitle: this.toNullableString(value.rightTitle),
      rightBody: this.toNullableString(value.rightBody),
      rightCtaText: this.toNullableString(value.rightCtaText),
      rightCtaUrl: this.toNullableString(value.rightCtaUrl),
      rightCtaEnabled: value.rightCtaEnabled,
      categoryTiles,
      topTiles,
      disciplineTiles,
      featuredProductSlugs: this.parseFeaturedProductSlugs(value.featuredProductSlugs),
    };
  }

  private toNullableString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseCategoryTiles(value: string): BaseShopConfigInput['categoryTiles'] {
    const trimmed = value.trim();
    if (!trimmed) return [];

    const parsed = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('Category tiles must be a JSON array');
    }

    return parsed.map((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error(`Category tile at index ${index} must be an object`);
      }
      const tile = entry as Record<string, unknown>;
      return {
        id: this.toNullableStringFromUnknown(tile.id) ?? `tile-${index + 1}`,
        title: this.toNullableStringFromUnknown(tile.title),
        subtitle: this.toNullableStringFromUnknown(tile.subtitle),
        href: this.toNullableStringFromUnknown(tile.href),
        imageAssetId: this.toNullableStringFromUnknown(tile.imageAssetId),
        hoverStyle: this.toNullableStringFromUnknown(tile.hoverStyle),
        isEnabled: typeof tile.isEnabled === 'boolean' ? tile.isEnabled : true,
      };
    });
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
    const nonDiscoverTiles = normalizedTiles.filter((tile) => !this.isDiscoverMore(tile));
    return [...nonDiscoverTiles, discoverMoreTile];
  }

  private createDiscoverMoreTile(): BaseShopTopTileData {
    return {
      id: 'explore-more',
      label: 'Discover more',
      subtitle: null,
      href: '/shop',
      hoverStyle: 'ring-blue',
      kind: 'exploreMore',
      isEnabled: true,
      imageAssetId: null,
    };
  }

  private normalizeDisciplineTiles(tiles: BaseShopDisciplineTileData[]): BaseShopDisciplineTileData[] {
    return (tiles ?? []).map((tile, index) => ({
      id: tile.id ?? `discipline-${index + 1}`,
      labelOverride: tile.labelOverride ?? null,
      order: typeof tile.order === 'number' ? tile.order : index,
      isEnabled: tile.isEnabled !== false,
      imageAssetId: tile.imageAssetId ?? null,
    }));
  }

  private toNullableStringFromUnknown(value: unknown): string | null {
    return typeof value === 'string' ? this.toNullableString(value) : null;
  }
}
