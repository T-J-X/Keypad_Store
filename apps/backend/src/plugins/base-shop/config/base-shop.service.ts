import { Injectable } from '@nestjs/common';
import { RequestContext, TransactionalConnection } from '@vendure/core';
import {
  BaseShopConfig,
  type BaseShopDisciplineTile,
  type BaseShopTopTile,
} from './base-shop-config.entity';

export type UpdateBaseShopConfigInput = {
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
        topTiles: [],
        disciplineTiles: [],
        featuredProductSlugs: [],
      });
      config = await repo.save(config);
    }

    config.topTiles = this.normalizeTopTiles(config.topTiles ?? []) ?? [];
    config.disciplineTiles = this.normalizeDisciplineTiles(config.disciplineTiles ?? []) ?? [];
    config.featuredProductSlugs = config.featuredProductSlugs ?? [];

    return config;
  }

  private applyInput(config: BaseShopConfig, input: UpdateBaseShopConfigInput) {
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

  private normalizeNullableString(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;

    // Accept numbers (e.g. asset IDs) and strings. Reject everything else.
    if (typeof value === 'number') {
      const normalized = String(value).trim();
      return normalized.length > 0 ? normalized : null;
    }

    if (typeof value !== 'string') return null;

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeTopTileHref(value: unknown): string | null {
    const normalized = this.normalizeNullableString(value);
    if (!normalized) return null;
    if (normalized.startsWith('/')) return normalized;
    try {
      const parsed = new URL(normalized);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch {
      // Unsafe or malformed URLs are dropped.
    }
    return null;
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
      const href = this.normalizeTopTileHref(tile.href);
      const imageAssetId = this.normalizeNullableString((tile as any).imageAssetId) ?? null;
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
    const maxRegularTiles = 5;
    const nonExploreTiles = tiles.filter((tile) => tile.kind !== 'exploreMore').slice(0, maxRegularTiles);
    const existingExploreMore = tiles.find((tile) => tile.kind === 'exploreMore');

    const discoverMoreTile: BaseShopTopTile = existingExploreMore
      ? {
        ...existingExploreMore,
        id: existingExploreMore.id || 'explore-more',
        label: 'Discover more',
        href: '/shop?section=all',
        hoverStyle: existingExploreMore.hoverStyle ?? 'ring-blue',
        isEnabled: true,
        kind: 'exploreMore',
      }
      : {
        id: 'explore-more',
        label: 'Discover more',
        subtitle: null,
        href: '/shop?section=all',
        imageAssetId: null,
        hoverStyle: 'ring-blue',
        isEnabled: true,
        kind: 'exploreMore',
      };

    return [...nonExploreTiles, discoverMoreTile];
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
