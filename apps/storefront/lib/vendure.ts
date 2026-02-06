export type VendureAsset = {
  id: string;
  preview?: string;
  source?: string;
  name?: string;
};

export type ProductCustomFields = {
  isIconProduct?: boolean;
  iconId?: string;
  iconCategoryPath?: string;
  insertAssetId?: string;
  isKeypadProduct?: boolean;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  featuredAsset?: VendureAsset | null;
  assets?: VendureAsset[];
  customFields?: ProductCustomFields | null;
};

export type IconProduct = CatalogProduct;
export type KeypadProduct = CatalogProduct;

export type CategoryNode = {
  name: string;
  path: string;
  count: number;
  children: CategoryNode[];
};

export function normalizeCategoryPath(input?: string | null) {
  const raw = (input ?? '').trim();
  if (!raw) return 'Uncategorised';
  return raw
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/') || 'Uncategorised';
}

export function buildCategoryTree(paths: string[]) {
  const root: CategoryNode = { name: 'All', path: '', count: 0, children: [] };

  for (const path of paths) {
    const normalized = normalizeCategoryPath(path);
    root.count += 1;

    let current = root;
    for (const segment of normalized.split('/')) {
      const nextPath = current.path ? `${current.path}/${segment}` : segment;
      let node = current.children.find((child) => child.name === segment);
      if (!node) {
        node = { name: segment, path: nextPath, count: 0, children: [] };
        current.children.push(node);
      }
      node.count += 1;
      current = node;
    }
  }

  const sortTree = (node: CategoryNode) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortTree);
  };
  sortTree(root);

  return root;
}

export function assetUrl(input?: string | null) {
  if (!input) return '';
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  const host = process.env.NEXT_PUBLIC_VENDURE_HOST || 'http://localhost:3000';
  return `${host}${input.startsWith('/') ? '' : '/'}${input}`;
}

export function assetFromProduct(product: { featuredAsset?: VendureAsset | null }) {
  return product.featuredAsset ?? null;
}
