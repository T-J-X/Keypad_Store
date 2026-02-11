import { Query, Resolver } from '@nestjs/graphql';
import { Asset, Ctx, RequestContext, TransactionalConnection } from '@vendure/core';
import { In } from 'typeorm';
import { BaseShopService } from './base-shop.service';

type BaseShopPublicTopTile = {
  id: string;
  label: string | null;
  subtitle: string | null;
  href: string | null;
  hoverStyle: string | null;
  isEnabled: boolean;
  imageAssetId: string | null;
  imagePreview: string | null;
  imageSource: string | null;
  kind: string | null;
};

type BaseShopPublicDisciplineTile = {
  id: string;
  labelOverride: string | null;
  imageAssetId: string | null;
  imagePreview: string | null;
  imageSource: string | null;
  isEnabled: boolean;
  order: number | null;
};

type BaseShopPublicConfig = {
  topTiles: BaseShopPublicTopTile[];
  disciplineTiles: BaseShopPublicDisciplineTile[];
  featuredProductSlugs: string[];
};

@Resolver()
export class BaseShopShopResolver {
  constructor(
    private baseShopService: BaseShopService,
    private connection: TransactionalConnection,
  ) {}

  @Query()
  async baseShopConfigPublic(@Ctx() ctx: RequestContext): Promise<BaseShopPublicConfig> {
    const config = await this.baseShopService.getPublicConfig(ctx);
    const topTiles = config.topTiles ?? [];
    const disciplineTiles = config.disciplineTiles ?? [];
    const collectAssetIds = (ids: Array<string | null | undefined>) =>
      ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    const imageAssetIds = Array.from(
      new Set(
        collectAssetIds([
          ...topTiles.map((tile) => tile.imageAssetId),
          ...disciplineTiles.map((tile) => tile.imageAssetId),
        ]),
      ),
    );

    const assets = imageAssetIds.length
      ? await this.connection.getRepository(ctx, Asset).find({
        where: { id: In(imageAssetIds) },
      })
      : [];
    const assetsById = new Map(assets.map((asset) => [String(asset.id), asset]));

    return {
      topTiles: topTiles.map((tile) => {
        const asset = tile.imageAssetId ? assetsById.get(tile.imageAssetId) : undefined;
        return {
          id: tile.id,
          label: tile.label ?? null,
          subtitle: tile.subtitle ?? null,
          href: tile.href ?? null,
          hoverStyle: tile.hoverStyle ?? null,
          isEnabled: Boolean(tile.isEnabled),
          imageAssetId: tile.imageAssetId ?? null,
          imagePreview: asset?.preview ?? null,
          imageSource: asset?.source ?? null,
          kind: tile.kind ?? null,
        };
      }),
      disciplineTiles: disciplineTiles.map((tile) => {
        const asset = tile.imageAssetId ? assetsById.get(tile.imageAssetId) : undefined;
        return {
          id: tile.id,
          labelOverride: tile.labelOverride ?? null,
          imageAssetId: tile.imageAssetId ?? null,
          imagePreview: asset?.preview ?? null,
          imageSource: asset?.source ?? null,
          isEnabled: Boolean(tile.isEnabled),
          order: tile.order ?? null,
        };
      }),
      featuredProductSlugs: config.featuredProductSlugs ?? [],
    };
  }
}
