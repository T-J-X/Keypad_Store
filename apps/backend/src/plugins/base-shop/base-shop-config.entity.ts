import { type DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

export type BaseShopCategoryTile = {
  id: string;
  title: string | null;
  subtitle: string | null;
  href: string | null;
  imageAssetId: string | null;
  hoverStyle: string | null;
  isEnabled: boolean;
};

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

  @Column({ type: 'varchar', nullable: true })
  leftImageAssetId: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  rightImageAssetId: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  leftTitle: string | null = null;

  @Column({ type: 'text', nullable: true })
  leftBody: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  leftCtaText: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  leftCtaUrl: string | null = null;

  @Column({ type: 'boolean', default: true })
  leftCtaEnabled = true;

  @Column({ type: 'varchar', nullable: true })
  rightTitle: string | null = null;

  @Column({ type: 'text', nullable: true })
  rightBody: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  rightCtaText: string | null = null;

  @Column({ type: 'varchar', nullable: true })
  rightCtaUrl: string | null = null;

  @Column({ type: 'boolean', default: true })
  rightCtaEnabled = true;

  @Column({ type: 'simple-json', nullable: true })
  categoryTiles: BaseShopCategoryTile[] | null = null;

  @Column({ type: 'simple-json', nullable: true })
  topTiles: BaseShopTopTile[] | null = null;

  @Column({ type: 'simple-json', nullable: true })
  disciplineTiles: BaseShopDisciplineTile[] | null = null;

  @Column({ type: 'simple-json', nullable: true })
  featuredProductSlugs: string[] | null = null;
}
