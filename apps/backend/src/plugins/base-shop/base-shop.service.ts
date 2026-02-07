import { Injectable } from '@nestjs/common';
import { RequestContext, TransactionalConnection } from '@vendure/core';
import {
  BaseShopConfig,
  type BaseShopCategoryTile,
  type BaseShopDisciplineTile,
  type BaseShopTopTile,
} from './base-shop-config.entity';

export type UpdateBaseShopCategoryTileInput = {
  id?: string | null;
  title?: string | null;
  subtitle?: string | null;
  href?: string | null;
  imageAssetId?: string | null;
  hoverStyle?: string | null;
  isEnabled?: boolean;
};

export type UpdateBaseShopConfigInput = {
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
  categoryTiles?: UpdateBaseShopCategoryTileInput[] | null;
  topTiles?: UpdateBaseShopTopTileInput[] | null;
  disciplineTiles?: UpdateBaseShopDisciplineTileInput[] | null;
  featuredProductSlugs?: string[] | null;
};

export type UpdateBaseShopTopTileInput = {
  id?: string | null;
  label?: string | null;
  subtitle?: string | null;
  href?: string | null;
  imageAssetId?: string | null;
  hoverStyle?: string | null;
  isEnabled?: boolean | null;
  kind?: string | null;
};

export type UpdateBaseShopDisciplineTileInput = {
  id?: string | null;
  labelOverride?: string | null;
  imageAssetId?: string | null;
  isEnabled?: boolean | null;
  order?: number | null;
};

export type BaseShopPublicConfig = {
  categoryTiles: BaseShopCategoryTile[];
  featuredProductSlugs: string[];
  topTiles: BaseShopTopTile[];
  disciplineTiles: BaseShopDisciplineTile[];
};

@Injectable()
export class BaseShopService {
  constructor(private connection: TransactionalConnection) {}

  async getConfig(ctx: RequestContext): Promise<BaseShopConfig> {
    return this.getOrCreateConfig(ctx);
  }

  async getPublicConfig(ctx: RequestContext): Promise<BaseShopPublicConfig> {
    const config = await this.getOrCreateConfig(ctx);
    const topTiles = this.normalizeTopTiles(config.topTiles ?? []) ?? [];
    const disciplineTiles = this.normalizeDisciplineTiles(config.disciplineTiles ?? []) ?? [];

    return {
      categoryTiles: (config.categoryTiles ?? []).filter((tile) => tile.isEnabled),
      featuredProductSlugs: config.featuredProductSlugs ?? [],
      topTiles: topTiles.filter((tile) => tile.isEnabled),
      disciplineTiles: this.sortPublicDisciplineTiles(disciplineTiles.filter((tile) => tile.isEnabled)),
    };
  }

  async updateConfig(ctx: RequestContext, input: UpdateBaseShopConfigInput): Promise<BaseShopConfig> {
    const repo = this.connection.getRepository(ctx, BaseShopConfig);
    const config = await this.getOrCreateConfig(ctx);

    this.applyInput(config, input);

    return repo.save(config);
  }

  private async getOrCreateConfig(ctx: RequestContext): Promise<BaseShopConfig> {
    const repo = this.connection.getRepository(ctx, BaseShopConfig);
    const existing = await repo.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    let config = existing[0];

    if (!config) {
      config = repo.create({
        leftCtaEnabled: true,
        rightCtaEnabled: true,
        categoryTiles: [],
        topTiles: [],
        disciplineTiles: [],
        featuredProductSlugs: [],
      });
      config = await repo.save(config);
    }

    config.categoryTiles = config.categoryTiles ?? [];
    config.topTiles = this.normalizeTopTiles(config.topTiles ?? []) ?? [];
    config.disciplineTiles = this.normalizeDisciplineTiles(config.disciplineTiles ?? []) ?? [];
    config.featuredProductSlugs = config.featuredProductSlugs ?? [];

    return config;
  }

  private applyInput(config: BaseShopConfig, input: UpdateBaseShopConfigInput) {
    const leftImageAssetId = this.normalizeNullableString(input.leftImageAssetId);
    if (leftImageAssetId !== undefined) config.leftImageAssetId = leftImageAssetId;

    const rightImageAssetId = this.normalizeNullableString(input.rightImageAssetId);
    if (rightImageAssetId !== undefined) config.rightImageAssetId = rightImageAssetId;

    const leftTitle = this.normalizeNullableString(input.leftTitle);
    if (leftTitle !== undefined) config.leftTitle = leftTitle;

    const leftBody = this.normalizeNullableString(input.leftBody);
    if (leftBody !== undefined) config.leftBody = leftBody;

    const leftCtaText = this.normalizeNullableString(input.leftCtaText);
    if (leftCtaText !== undefined) config.leftCtaText = leftCtaText;

    const leftCtaUrl = this.normalizeNullableString(input.leftCtaUrl);
    if (leftCtaUrl !== undefined) config.leftCtaUrl = leftCtaUrl;

    if (typeof input.leftCtaEnabled === 'boolean') {
      config.leftCtaEnabled = input.leftCtaEnabled;
    }

    const rightTitle = this.normalizeNullableString(input.rightTitle);
    if (rightTitle !== undefined) config.rightTitle = rightTitle;

    const rightBody = this.normalizeNullableString(input.rightBody);
    if (rightBody !== undefined) config.rightBody = rightBody;

    const rightCtaText = this.normalizeNullableString(input.rightCtaText);
    if (rightCtaText !== undefined) config.rightCtaText = rightCtaText;

    const rightCtaUrl = this.normalizeNullableString(input.rightCtaUrl);
    if (rightCtaUrl !== undefined) config.rightCtaUrl = rightCtaUrl;

    if (typeof input.rightCtaEnabled === 'boolean') {
      config.rightCtaEnabled = input.rightCtaEnabled;
    }

    const categoryTiles = this.normalizeCategoryTiles(input.categoryTiles);
    if (categoryTiles !== undefined) {
      config.categoryTiles = categoryTiles;
    }

    const topTiles = this.normalizeTopTiles(input.topTiles);
    if (topTiles !== undefined) {
      config.topTiles = topTiles;
    }

    const disciplineTiles = this.normalizeDisciplineTiles(input.disciplineTiles);
    if (disciplineTiles !== undefined) {
      config.disciplineTiles = disciplineTiles;
    }

    const featuredProductSlugs = this.normalizeStringList(input.featuredProductSlugs);
    if (featuredProductSlugs !== undefined) {
      config.featuredProductSlugs = featuredProductSlugs;
    }
  }

  private normalizeNullableString(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeCategoryTiles(
    value: UpdateBaseShopCategoryTileInput[] | null | undefined,
  ): BaseShopCategoryTile[] | undefined {
    if (value === undefined) return undefined;
    if (value === null) return [];

    return value
      .map((tile, index) => {
        const id = this.normalizeNullableString(tile.id) ?? `tile-${index + 1}`;
        const title = this.normalizeNullableString(tile.title) ?? null;
        const subtitle = this.normalizeNullableString(tile.subtitle) ?? null;
        const href = this.normalizeNullableString(tile.href) ?? null;
        const imageAssetId = this.normalizeNullableString(tile.imageAssetId) ?? null;
        const hoverStyle = this.normalizeNullableString(tile.hoverStyle) ?? null;
        const isEnabled = typeof tile.isEnabled === 'boolean' ? tile.isEnabled : true;

        return {
          id,
          title,
          subtitle,
          href,
          imageAssetId,
          hoverStyle,
          isEnabled,
        };
      })
      .filter((tile) => Boolean(tile.title || tile.subtitle || tile.href || tile.imageAssetId));
  }

  private normalizeTopTiles(
    value: UpdateBaseShopTopTileInput[] | BaseShopTopTile[] | null | undefined,
  ): BaseShopTopTile[] | undefined {
    if (value === undefined) return undefined;
    if (value === null || !Array.isArray(value)) return [];

    const normalized = value.map((tile, index) => {
      const id = this.normalizeNullableString(tile.id) ?? `top-tile-${index + 1}`;
      const label = this.normalizeNullableString(tile.label) ?? null;
      const subtitle = this.normalizeNullableString(tile.subtitle) ?? null;
      const href = this.normalizeNullableString(tile.href) ?? null;
      const imageAssetId = this.normalizeNullableString(tile.imageAssetId) ?? null;
      const hoverStyle = this.normalizeNullableString(tile.hoverStyle) ?? null;
      const kind = this.normalizeNullableString(tile.kind) ?? null;
      const isEnabled = this.coerceBoolean(tile.isEnabled, true);

      return {
        id,
        label,
        subtitle,
        href,
        imageAssetId,
        hoverStyle,
        isEnabled,
        kind,
      };
    });

    return this.applyTopTileRules(normalized);
  }

  private normalizeDisciplineTiles(
    value: UpdateBaseShopDisciplineTileInput[] | BaseShopDisciplineTile[] | null | undefined,
  ): BaseShopDisciplineTile[] | undefined {
    if (value === undefined) return undefined;
    if (value === null || !Array.isArray(value)) return [];

    return value.map((tile, index) => {
      const id = this.normalizeNullableString(tile.id) ?? `discipline-${index + 1}`;
      const labelOverride = this.normalizeNullableString(tile.labelOverride) ?? null;
      const imageAssetId = this.normalizeNullableString(tile.imageAssetId) ?? null;
      const isEnabled = this.coerceBoolean(tile.isEnabled, true);
      const order = this.normalizeNullableNumber(tile.order) ?? null;

      return {
        id,
        labelOverride,
        imageAssetId,
        isEnabled,
        order,
      };
    });
  }

  private applyTopTileRules(tiles: BaseShopTopTile[]): BaseShopTopTile[] {
    const nonExploreTiles = tiles.filter((tile) => tile.kind !== 'exploreMore');
    const existingExploreMore = tiles.find((tile) => tile.kind === 'exploreMore');

    const discoverMoreTile: BaseShopTopTile = existingExploreMore
      ? {
        ...existingExploreMore,
        id: existingExploreMore.id || 'explore-more',
        label: 'Discover more',
        href: '/shop',
        hoverStyle: existingExploreMore.hoverStyle ?? 'ring-blue',
        isEnabled: true,
        kind: 'exploreMore',
      }
      : {
        id: 'explore-more',
        label: 'Discover more',
        subtitle: null,
        href: '/shop',
        imageAssetId: null,
        hoverStyle: 'ring-blue',
        isEnabled: true,
        kind: 'exploreMore',
      };

    const maxEnabledRegularTiles = 5;
    let enabledRegularTiles = 0;

    const normalizedRegularTiles = nonExploreTiles.map((tile) => {
      if (!tile.isEnabled) {
        return tile;
      }
      if (enabledRegularTiles < maxEnabledRegularTiles) {
        enabledRegularTiles += 1;
        return tile;
      }
      return {
        ...tile,
        isEnabled: false,
      };
    });

    return [...normalizedRegularTiles, discoverMoreTile];
  }

  private sortPublicDisciplineTiles(tiles: BaseShopDisciplineTile[]): BaseShopDisciplineTile[] {
    return [...tiles].sort((a, b) => {
      const aOrder = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const bOrder = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      const aLabel = (a.labelOverride ?? a.id).toLocaleLowerCase();
      const bLabel = (b.labelOverride ?? b.id).toLocaleLowerCase();
      return aLabel.localeCompare(bLabel);
    });
  }

  private coerceBoolean(value: boolean | null | undefined, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    return fallback;
  }

  private normalizeNullableNumber(value: number | null | undefined): number | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }

  private normalizeStringList(value: string[] | null | undefined): string[] | undefined {
    if (value === undefined) return undefined;
    if (value === null) return [];
    return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
  }
}
