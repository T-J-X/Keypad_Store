import 'dotenv/config';
import path from 'node:path';
import { bootstrap, DefaultLogger, DefaultSchedulerPlugin, LogLevel, VendureConfig } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';

const port = Number(process.env.PORT ?? 3000);

const config: VendureConfig = {
  apiOptions: {
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
  plugins: [
    DefaultSchedulerPlugin.init(),

    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: path.join(process.cwd(), 'apps/backend/static/assets'),
    }),

    AdminUiPlugin.init({
      route: process.env.ADMIN_UI_PATH ?? 'admin',
      port: port + 1,
      adminUiConfig: {
        apiHost: 'http://localhost',
        apiPort: port,
        adminApiPath: process.env.ADMIN_API_PATH ?? 'admin-api',
      },
    }),
  ],
};

bootstrap(config)
  .then(() => {
    // eslint-disable-next-line no-console
    console.log(`Vendure running:
- Shop API:   http://localhost:${port}/${config.apiOptions!.shopApiPath}
- Admin API:  http://localhost:${port}/${config.apiOptions!.adminApiPath}
- Assets:     http://localhost:${port}/assets
- Admin UI:   http://localhost:${port}/${process.env.ADMIN_UI_PATH ?? 'admin'}`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
