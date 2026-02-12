export const extensionRoutes = [  {
    path: 'extensions/baseshop',
    loadChildren: () => import('./extensions/8b99ef944815b05d94596ea6b4b3ca9d36d5f4d0123910a1ae320b451de2cc87/baseshop.module').then(m => m.BaseShopModule),
  }];
