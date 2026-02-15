import { useMemo } from 'react';
import { getRecommendedIcons } from '../../config/configurator/recommendations';

function normalizedId(value: string | null | undefined) {
  return (value ?? '').trim().toUpperCase();
}

export function useRecommendationEngine({
  seedIconId,
  selectedIconIds,
}: {
  seedIconId: string | null;
  selectedIconIds: string[];
}) {
  return useMemo(() => {
    const normalizedSeed = normalizedId(seedIconId);
    const selectedIds = Array.from(new Set(selectedIconIds.map(normalizedId).filter(Boolean)));

    const fallbackSeed = selectedIds[selectedIds.length - 1] ?? null;
    const activeSeed = normalizedSeed || fallbackSeed;

    if (!activeSeed) {
      return {
        activeSeed: null,
        recommendedIds: [] as string[],
      };
    }

    const direct = getRecommendedIcons(activeSeed)
      .map(normalizedId)
      .filter(Boolean);

    // Prefer IDs not already selected, but keep selected recommendations at the end
    // so users can still see what is contextually paired.
    const unselected = direct.filter((id) => !selectedIds.includes(id));
    const selected = direct.filter((id) => selectedIds.includes(id));

    return {
      activeSeed,
      recommendedIds: Array.from(new Set([...unselected, ...selected])),
    };
  }, [seedIconId, selectedIconIds]);
}
