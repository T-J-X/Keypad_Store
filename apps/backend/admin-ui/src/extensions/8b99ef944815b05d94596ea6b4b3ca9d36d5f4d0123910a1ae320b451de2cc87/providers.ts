import { addNavMenuItem, addNavMenuSection } from '@vendure/admin-ui/core';

export default [
  addNavMenuSection(
    {
      id: 'content',
      label: 'Content',
      icon: 'file',
      items: [],
    },
    'settings'
  ),

  addNavMenuItem(
    {
      id: 'baseshop',
      label: 'Shop Landing page',
      routerLink: ['/extensions', 'baseshop'],
      icon: 'image-gallery',
    },
    'content'
  ),
];
