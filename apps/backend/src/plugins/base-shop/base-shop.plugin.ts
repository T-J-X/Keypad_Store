import path from 'node:path';
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import type { AdminUiExtension } from '@vendure/ui-devkit/compiler';
import gql from 'graphql-tag';
import { BaseShopAdminResolver } from './base-shop.admin.resolver';
import { BaseShopConfig } from './base-shop-config.entity';
import { BaseShopService } from './base-shop.service';
import { BaseShopShopResolver } from './base-shop.shop.resolver';

const adminApiExtensions = gql`
  type BaseShopCategoryTile {
    id: String!
    title: String
    subtitle: String
    href: String
    imageAssetId: ID
    hoverStyle: String
    isEnabled: Boolean!
  }

  type BaseShopTopTile {
    id: String!
    label: String
    subtitle: String
    href: String
    imageAssetId: ID
    hoverStyle: String
    isEnabled: Boolean!
    kind: String
  }

  type BaseShopDisciplineTile {
    id: String!
    labelOverride: String
    imageAssetId: ID
    isEnabled: Boolean!
    order: Int
  }

  type BaseShopConfig {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    leftImageAssetId: ID
    rightImageAssetId: ID
    leftTitle: String
    leftBody: String
    leftCtaText: String
    leftCtaUrl: String
    leftCtaEnabled: Boolean!
    rightTitle: String
    rightBody: String
    rightCtaText: String
    rightCtaUrl: String
    rightCtaEnabled: Boolean!
    categoryTiles: [BaseShopCategoryTile!]!
    topTiles: [BaseShopTopTile!]!
    disciplineTiles: [BaseShopDisciplineTile!]!
    featuredProductSlugs: [String!]!
  }

  input BaseShopCategoryTileInput {
    id: String
    title: String
    subtitle: String
    href: String
    imageAssetId: ID
    hoverStyle: String
    isEnabled: Boolean
  }

  input BaseShopTopTileInput {
    id: String
    label: String
    subtitle: String
    href: String
    imageAssetId: ID
    hoverStyle: String
    isEnabled: Boolean
    kind: String
  }

  input BaseShopDisciplineTileInput {
    id: String
    labelOverride: String
    imageAssetId: ID
    isEnabled: Boolean
    order: Int
  }

  input UpdateBaseShopConfigInput {
    leftImageAssetId: ID
    rightImageAssetId: ID
    leftTitle: String
    leftBody: String
    leftCtaText: String
    leftCtaUrl: String
    leftCtaEnabled: Boolean
    rightTitle: String
    rightBody: String
    rightCtaText: String
    rightCtaUrl: String
    rightCtaEnabled: Boolean
    categoryTiles: [BaseShopCategoryTileInput!]
    topTiles: [BaseShopTopTileInput!]
    disciplineTiles: [BaseShopDisciplineTileInput!]
    featuredProductSlugs: [String!]
  }

  extend type Query {
    baseShopConfig: BaseShopConfig!
  }

  extend type Mutation {
    updateBaseShopConfig(input: UpdateBaseShopConfigInput!): BaseShopConfig!
  }
`;

const shopApiExtensions = gql`
  type BaseShopCategoryTilePublic {
    id: String!
    title: String
    subtitle: String
    href: String
    imageAssetId: ID
    imagePreview: String
    imageSource: String
    hoverStyle: String
    isEnabled: Boolean!
  }

  type BaseShopTopTilePublic {
    id: String!
    label: String
    subtitle: String
    href: String
    hoverStyle: String
    isEnabled: Boolean!
    imageAssetId: ID
    imagePreview: String
    imageSource: String
    kind: String
  }

  type BaseShopDisciplineTilePublic {
    id: String!
    labelOverride: String
    imageAssetId: ID
    imagePreview: String
    imageSource: String
    isEnabled: Boolean!
    order: Int
  }

  type BaseShopPublicConfig {
    categoryTiles: [BaseShopCategoryTilePublic!]!
    featuredProductSlugs: [String!]!
    topTiles: [BaseShopTopTilePublic!]!
    disciplineTiles: [BaseShopDisciplineTilePublic!]!
  }

  extend type Query {
    baseShopConfigPublic: BaseShopPublicConfig!
  }
`;

@VendurePlugin({
  imports: [PluginCommonModule],
  entities: [BaseShopConfig],
  providers: [BaseShopService],
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [BaseShopAdminResolver],
  },
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [BaseShopShopResolver],
  },
})
export class BaseShopPlugin {
  static ui: AdminUiExtension = {
    id: 'base-shop-ui',
    extensionPath: path.join(__dirname, 'ui'),
    routes: [{ route: 'baseshop', filePath: 'routes.ts' }],
    providers: ['providers.ts'],
  };
}
