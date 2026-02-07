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
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .cta-toggle {
        margin-top: 0.5rem;
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
    this.modalService
      .fromComponent(AssetPickerDialogComponent, {
        size: 'xl',
        locals: {
          multiSelect: false,
        },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((selection) => {
        const asset = (selection as AssetSelection[] | undefined)?.[0];
        if (!asset) {
          return;
        }
        this.setAsset(tile, {
          id: asset.id,
          name: asset.name ?? null,
          preview: asset.preview ?? null,
        });
      });
  }

  clearAsset(tile: TileKey): void {
    this.setAsset(tile, null);
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

  private toNullableStringFromUnknown(value: unknown): string | null {
    return typeof value === 'string' ? this.toNullableString(value) : null;
  }
}
