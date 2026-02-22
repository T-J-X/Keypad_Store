import 'dotenv/config';
import path from 'node:path';
import {
  Asset,
  bootstrap,
  DefaultLogger,
  DefaultJobQueuePlugin,
  dummyPaymentHandler,
  DefaultSchedulerPlugin,
  DefaultSearchPlugin,
  LanguageCode,
  LogLevel,
  NativeAuthenticationStrategy,
  ProductService,
  VendureConfig,
} from '@vendure/core';
import {
  AssetServerPlugin,
  configureS3AssetStorage,
} from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { compileUiExtensions } from '@vendure/ui-devkit/compiler';
import { BaseShopPlugin } from './plugins/base-shop';
import { GoogleAuthenticationStrategy } from './auth/google-authentication-strategy';
import {
  ConfigurationValidationError,
  findMissingIconIds,
  parseAndValidateStrictConfiguration,
} from './plugins/base-shop/saved-designs/keypad-configuration';

const host = 'localhost';
const port = 3000;
const isProduction = process.env.NODE_ENV === 'production';
const adminPath = process.env.ADMIN_UI_PATH ?? 'admin';
const devCorsOrigins = ['http://localhost:3000', 'http://localhost:3001'];
const configuredCorsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigins = Array.from(
  new Set(configuredCorsOrigins.length > 0 ? configuredCorsOrigins : devCorsOrigins),
);
const uiDevkitPackagePath = path.dirname(require.resolve('@vendure/ui-devkit/package.json'));
const adminUiOutputPath = path.join(__dirname, '../admin-ui');
const ngCompilerPath = require.resolve('@angular/cli/bin/ng.js', {
  paths: [uiDevkitPackagePath],
});

const superadminIdentifier = process.env.SUPERADMIN_USERNAME?.trim() || (isProduction ? '' : 'superadmin');
const superadminPassword = process.env.SUPERADMIN_PASSWORD?.trim() || (isProduction ? '' : 'superadmin');
const dbSynchronize = (process.env.DB_SYNCHRONIZE ?? (isProduction ? 'false' : 'true')).trim().toLowerCase() === 'true';
const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const dbPoolMax = parsePositiveInt(process.env.DB_POOL_MAX, isProduction ? 20 : 10);
const dbConnectionTimeoutMs = parsePositiveInt(process.env.DB_CONNECTION_TIMEOUT_MS, 5000);
const dbQueryTimeoutMs = parsePositiveInt(process.env.DB_QUERY_TIMEOUT_MS, 15000);
const dbStatementTimeoutMs = parsePositiveInt(process.env.DB_STATEMENT_TIMEOUT_MS, 15000);
const dbIdleTimeoutMs = parsePositiveInt(process.env.DB_IDLE_TIMEOUT_MS, 30000);
const dbIdleInTransactionTimeoutMs = parsePositiveInt(process.env.DB_IDLE_IN_TX_TIMEOUT_MS, 10000);

if (isProduction && (!superadminIdentifier || !superadminPassword)) {
  throw new Error(
    'FATAL: SUPERADMIN_USERNAME and SUPERADMIN_PASSWORD must be set in production.',
  );
}

if (!isProduction) {
  const envUrlsUsingIp = Object.entries(process.env).filter(([key, value]) => {
    return /url/i.test(key) && typeof value === 'string' && value.includes('127.0.0.1');
  });

  if (envUrlsUsingIp.length > 0) {
    const urlKeys = envUrlsUsingIp.map(([key]) => key).join(', ');
    throw new Error(
      `Detected 127.0.0.1 in URL env var(s): ${urlKeys}. Use http://localhost:3000 for Vendure dev URLs.`,
    );
  }
}

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
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  },
  authOptions: {
    // Use cookie-based sessions for the Admin UI.
    tokenMethod: 'cookie',
    // In dev, skip email verification so new accounts work immediately.
    // In production, require email verification before login.
    requireVerification: isProduction,
    shopAuthenticationStrategy: [
      new NativeAuthenticationStrategy(),
      new GoogleAuthenticationStrategy(),
    ],
    superadminCredentials: {
      identifier: superadminIdentifier,
      password: superadminPassword,
    },
    // Secure cookies in production, relaxed only for local HTTP development.
    cookieOptions: {
      name: 'vendure-auth',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    },
  },
  dbConnectionOptions: {
    type: 'postgres',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'vendure',
    password: process.env.DB_PASSWORD ?? 'vendure_dev_password',
    database: process.env.DB_NAME ?? 'vendure',
    synchronize: dbSynchronize,
    logging: false,
    extra: {
      max: dbPoolMax,
      connectionTimeoutMillis: dbConnectionTimeoutMs,
      query_timeout: dbQueryTimeoutMs,
      statement_timeout: dbStatementTimeoutMs,
      idleTimeoutMillis: dbIdleTimeoutMs,
      idle_in_transaction_session_timeout: dbIdleInTransactionTimeoutMs,
    },
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
      {
        name: 'additionalSpecs',
        type: 'struct',
        list: true,
        nullable: true,
        public: true,
        fields: [
          { name: 'label', type: 'string' },
          { name: 'value', type: 'string' },
        ],
        ui: {
          tab: 'Specifications',
        },
      },
      {
        name: 'whatsInTheBox',
        type: 'text',
        list: true,
        nullable: true,
        public: true,
        ui: {
          tab: 'Content',
        },
      },
      {
        name: 'downloads',
        type: 'relation',
        list: true,
        nullable: true,
        entity: Asset,
        public: true,
        ui: {
          tab: 'Downloads',
        },
      },
      {
        name: 'seoTitle',
        type: 'string',
        nullable: true,
        public: true,
        ui: {
          tab: 'SEO',
        },
      },
      {
        name: 'seoDescription',
        type: 'text',
        nullable: true,
        public: true,
        ui: {
          component: 'textarea-form-input',
          tab: 'SEO',
        },
      },
      {
        name: 'seoNoIndex',
        type: 'boolean',
        defaultValue: false,
        public: true,
        ui: {
          tab: 'SEO',
        },
      },
      {
        name: 'seoCanonicalUrl',
        type: 'string',
        nullable: true,
        public: true,
        ui: {
          tab: 'SEO',
        },
      },
      {
        name: 'seoKeywords',
        type: 'string',
        nullable: true,
        public: true,
        ui: {
          tab: 'SEO',
        },
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
        // Stores the Asset.id of the matte insert paired to this purchasable variant.
        name: 'insertAssetId',
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
      {
        // Slot diameter in mm, used by configurator filtering (e.g. 15mm).
        name: 'sizeMm',
        type: 'int',
        nullable: true,
        public: true,
      },
    ],
    OrderLine: [
      {
        name: 'configuration',
        type: 'text',
        nullable: true,
        public: true,
        label: [{ languageCode: LanguageCode.en, value: 'Keypad Configuration' }],
        description: [
          {
            languageCode: LanguageCode.en,
            value: 'JSON mapping of slot IDs to icon IDs and ring glow colors',
          },
        ],
        ui: { component: 'json' },
        validate: async (value, injector, ctx) => {
          if (value == null || value === '') {
            return;
          }
          if (typeof value !== 'string') {
            return 'Configuration must be a JSON string.';
          }

          let strictConfiguration;
          try {
            strictConfiguration = parseAndValidateStrictConfiguration(value);
          } catch (error) {
            if (error instanceof ConfigurationValidationError) {
              return error.message;
            }
            throw error;
          }

          const productService = injector.get(ProductService);
          const missingIconIds = await findMissingIconIds(ctx, productService, strictConfiguration);
          if (missingIconIds.length > 0) {
            return `Unknown iconId(s): ${missingIconIds.join(', ')}.`;
          }
        },
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

    BaseShopPlugin,

    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(process.cwd(), 'apps/backend/static/assets'),
      storageStrategyFactory,
    }),

    AdminUiPlugin.init({
      route: 'admin',
      port: port + 2,
      app: compileUiExtensions({
        outputPath: adminUiOutputPath,
        extensions: [
          {
            extensionPath: path.join(__dirname, 'plugins/base-shop/ui'),
            providers: ['providers.ts'],
            ngModules: [
              {
                type: 'lazy',
                route: 'baseshop',
                ngModuleFileName: 'baseshop.module.ts',
                ngModuleName: 'BaseShopModule',
              },
            ],
          },
        ],
        devMode: true,
        ngCompilerPath,
      }),
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
