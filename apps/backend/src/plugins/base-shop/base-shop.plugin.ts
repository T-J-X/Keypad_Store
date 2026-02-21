import path from 'node:path';
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import type { AdminUiExtension } from '@vendure/ui-devkit/compiler';
import gql from 'graphql-tag';
import { BaseShopAdminResolver } from './config/base-shop.admin.resolver';
import { BaseShopConfig } from './config/base-shop-config.entity';
import { BaseShopService } from './config/base-shop.service';
import { BaseShopShopResolver } from './config/base-shop.shop.resolver';
import { OrderExportShopResolver } from './export/order-export.shop.resolver';
import { OrderExportService } from './export/order-export.service';
import { SavedConfiguration } from './saved-designs/saved-configuration.entity';
import { SavedConfigurationShopResolver } from './saved-designs/saved-configuration.shop.resolver';
import { SavedConfigurationService } from './saved-designs/saved-configuration.service';

const adminApiExtensions = gql`
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
    topTiles: [BaseShopTopTile!]!
    disciplineTiles: [BaseShopDisciplineTile!]!
    featuredProductSlugs: [String!]!
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
  type SavedConfiguration {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    name: String!
    keypadModel: String!
    configuration: String!
  }

  type OrderPdfExportLine {
    lineId: ID!
    quantity: Int!
    variantId: ID!
    variantName: String!
    variantSku: String!
    configuration: String!
  }

  type OrderPdfExportPayload {
    orderId: ID!
    orderCode: String!
    orderDate: DateTime!
    customerId: ID!
    customerEmail: String
    customerName: String
    lines: [OrderPdfExportLine!]!
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
    featuredProductSlugs: [String!]!
    topTiles: [BaseShopTopTilePublic!]!
    disciplineTiles: [BaseShopDisciplineTilePublic!]!
  }

  extend type Query {
    baseShopConfigPublic: BaseShopPublicConfig!
    getSavedConfigurations: [SavedConfiguration!]!
    getSavedConfiguration(id: ID!): SavedConfiguration!
    orderPdfExportData(orderCode: String!): OrderPdfExportPayload!
  }

  extend type Mutation {
    saveConfiguration(name: String!, keypadModel: String!, configJson: String!): SavedConfiguration!
    updateConfiguration(id: ID!, name: String!, configJson: String!): SavedConfiguration!
    deleteConfiguration(id: ID!): Boolean!
  }
`;

@VendurePlugin({
  compatibility: '^3.0.0',
  imports: [PluginCommonModule],
  entities: [BaseShopConfig, SavedConfiguration],
  providers: [BaseShopService, SavedConfigurationService, OrderExportService],
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [BaseShopAdminResolver],
  },
  shopApiExtensions: {
    schema: shopApiExtensions,
    resolvers: [BaseShopShopResolver, SavedConfigurationShopResolver, OrderExportShopResolver],
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
