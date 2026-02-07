import { addNavMenuItem } from '@vendure/admin-ui/core';

export default [
  addNavMenuItem(
    {
      id: 'baseshop',
      label: 'Baseshop',
      routerLink: ['/extensions', 'baseshop'],
      icon: 'image-gallery',
    },
    'settings'
  ),
];
