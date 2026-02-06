import 'dotenv/config';
import path from 'node:path';
import {
  bootstrap,
  DefaultLogger,
  DefaultJobQueuePlugin,
  dummyPaymentHandler,
  DefaultSchedulerPlugin,
  DefaultSearchPlugin,
  LanguageCode,
  LogLevel,
  VendureConfig,
} from '@vendure/core';
import {
  AssetServerPlugin,
  configureS3AssetStorage,
} from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';

const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 3000);
const adminPath = process.env.ADMIN_UI_PATH ?? 'admin';

const storageStrategyFactory = configureS3AssetStorage({
  bucket: process.env.S3_BUCKET ?? 'vendure-assets',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? '',
    secretAccessKey: process.env.S3_SECRET_KEY ?? '',
  },
  nativeS3Configuration: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://127.0.0.1:9000',
    region: process.env.S3_REGION ?? 'eu-west-1',
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    signatureVersion: 'v4',
  },
});

export const config: VendureConfig = {
  apiOptions: {
    hostname: host,
    port,
    adminApiPath: process.env.ADMIN_API_PATH ?? 'admin-api',
    shopApiPath: process.env.SHOP_API_PATH ?? 'shop-api',
  },
  authOptions: {
    superadminCredentials: {
      identifier: process.env.SUPERADMIN_USERNAME ?? 'superadmin',
      password: process.env.SUPERADMIN_PASSWORD ?? 'superadmin',
    },
  },
  dbConnectionOptions: {
    type: 'postgres',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'vendure',
    password: process.env.DB_PASSWORD ?? 'vendure_dev_password',
    database: process.env.DB_NAME ?? 'vendure',
    synchronize: true,
    logging: false,
  },
  logger: new DefaultLogger({ level: LogLevel.Info }),
  customFields: {
    Product: [
      {
        name: 'isIconProduct',
        type: 'boolean',
        defaultValue: false,
        public: true,
      },
      {
        name: 'isKeypadProduct',
        type: 'boolean',
        defaultValue: false,
        public: true,
      },
      {
        // Human-friendly code like "B321" to show in the UI + help map files to products.
        name: 'iconId',
        type: 'string',
        nullable: true,
        public: true,
      },
      {
        name: 'iconCategoryPath',
        type: 'string',
        nullable: true,
        public: true,
      },
      {
        // Canonical storefront/configurator icon categories source of truth.
        name: 'iconCategories',
        type: 'string',
        list: true,
        nullable: true,
        public: true,
        ui: {
          component: 'text-form-input',
          tab: 'Icons',
        },
      },
      {
        // Stores the Asset.id of the matte "insert" image (used for overlay in the configurator).
        name: 'insertAssetId',
        type: 'string',
        nullable: true,
        public: true,
      },
      {
        // Comma-separated application values from catalog, stored as a queryable string list.
        name: 'application',
        type: 'string',
        list: true,
        nullable: true,
        public: true,
      },
      {
        name: 'colour',
        type: 'string',
        nullable: true,
        public: true,
      },
      {
        name: 'size',
        type: 'string',
        nullable: true,
        public: true,
      },
    ],
    ProductVariant: [
      {
        name: 'iconId',
        type: 'string',
        nullable: true,
        public: true,
      },
      {
        name: 'iconType',
        type: 'string',
        nullable: true,
        options: [
          {
            value: 'render',
            label: [{ languageCode: LanguageCode.en, value: 'render' }],
          },
          {
            value: 'insert',
            label: [{ languageCode: LanguageCode.en, value: 'insert' }],
          },
        ],
        public: true,
      },
      {
        name: 'keypadModelCode',
        type: 'string',
        nullable: true,
        public: true,
      },
      {
        name: 'slotMapKey',
        type: 'string',
        nullable: true,
        public: true,
      },
    ],
    OrderLine: [
      {
        name: 'configuration',
        type: 'text',
        nullable: true,
        public: false,
        ui: { component: 'json' },
      },
    ],
  },
  paymentOptions: {
    paymentMethodHandlers: [dummyPaymentHandler],
  },

  plugins: [
    DefaultJobQueuePlugin,

    DefaultSearchPlugin.init({
      indexStockStatus: false,
      bufferUpdates: false,
    }),

    DefaultSchedulerPlugin.init(),

    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(process.cwd(), 'apps/backend/static/assets'),
      storageStrategyFactory,
    }),

    AdminUiPlugin.init({
      route: adminPath,
      port: port + 1,
      adminUiConfig: {
        apiHost: 'http://localhost',
        apiPort: port,
        adminApiPath: process.env.ADMIN_API_PATH ?? 'admin-api',
      },
    }),
  ],
};

async function startServer() {
  await bootstrap(config);
  console.log(`Vendure running:
- Shop API:   http://localhost:${port}/${config.apiOptions!.shopApiPath}
- Admin API:  http://localhost:${port}/${config.apiOptions!.adminApiPath}
- Assets:     http://localhost:${port}/assets
- Admin UI:   http://localhost:${port}/${adminPath}`);
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
