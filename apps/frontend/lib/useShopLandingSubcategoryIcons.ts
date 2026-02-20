import { useMemo } from 'react';
import {
  categorySlug,
  type BaseShopDisciplineTile,
  type IconCategory,
} from './vendure';

type ShopLandingSubcategoryTile = {
  id: string;
  label: string;
  slug: string;
  image: string | null;
  count: number;
};

export function useShopLandingSubcategoryIcons({
  categories,
  overrides,
}: {
  categories: IconCategory[];
  overrides?: BaseShopDisciplineTile[] | null;
}): ShopLandingSubcategoryTile[] {
  const overridesBySlug = useMemo(() => {
    const map = new Map<string, BaseShopDisciplineTile>();
    for (const tile of overrides ?? []) {
      if (tile.isEnabled === false) continue;
      const slug = categorySlug(tile.id ?? '');
      if (!slug) continue;
      map.set(slug, tile);
    }
    return map;
  }, [overrides]);

  return useMemo(() => {
    return categories
      .map((category) => {
        const override = overridesBySlug.get(category.slug);
        const labelOverride = override?.labelOverride?.trim() ?? '';
        return {
          id: category.slug,
          label: labelOverride || category.name,
          slug: category.slug,
          image: override?.imageSource ?? override?.imagePreview ?? null,
          count: category.count,
        } satisfies ShopLandingSubcategoryTile;
      })
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }, [categories, overridesBySlug]);
}
