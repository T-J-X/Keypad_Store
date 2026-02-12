import { type DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

export type BaseShopTopTile = {
  id: string;
  label?: string | null;
  subtitle?: string | null;
  href?: string | null;
  imageAssetId?: string | null;
  hoverStyle?: string | null;
  isEnabled?: boolean;
  kind?: string | null;
};

export type BaseShopDisciplineTile = {
  id: string;
  labelOverride?: string | null;
  imageAssetId?: string | null;
  isEnabled?: boolean;
  order?: number | null;
};

@Entity()
export class BaseShopConfig extends VendureEntity {
  constructor(input?: DeepPartial<BaseShopConfig>) {
    super(input);
  }

  @Column({ type: 'simple-json', nullable: true })
  topTiles: BaseShopTopTile[] | null = null;

  @Column({ type: 'simple-json', nullable: true })
  disciplineTiles: BaseShopDisciplineTile[] | null = null;

  @Column({ type: 'simple-json', nullable: true })
  featuredProductSlugs: string[] | null = null;
}
