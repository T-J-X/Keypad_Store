import { registerRouteComponent } from '@vendure/admin-ui/core';
import { BaseShopComponent } from './baseshop.component';

export default [
  registerRouteComponent({
    path: 'extensions/baseshop',
    component: BaseShopComponent,
    title: 'Baseshop',
    breadcrumb: 'Baseshop',
  }),
];
