/**
 * Recommendation logic for the configurator.
 * Maps a selected icon ID to logically related icon IDs.
 */
const ICON_RECOMMENDATIONS: Record<string, string[]> = {
  // Engine and power
  '001': ['002', 'A01', 'A05'],
  '002': ['001', 'A01'],
  A01: ['001', '002', 'A05'],
  A05: ['001', 'A01', 'A06'],

  // Lighting
  L01: ['L02', 'L05', 'H01'],
  L02: ['L01', 'L03'],
  L05: ['L01', 'W01'],
  W01: ['L01', 'L05', 'W02'],

  // Navigation and marine
  M01: ['M02', 'M05'],
  N01: ['N02', 'L01'],
  W05: ['W06', 'H01'],

  // Utility and HVAC
  H10: ['H11', 'A06'],
  F01: ['F02', 'F03'],

  // Generic nav
  U01: ['D01', 'L10', 'R10', 'OK1'],
};

export function getRecommendedIcons(selectedId: string): string[] {
  const id = selectedId.trim().toUpperCase();
  return ICON_RECOMMENDATIONS[id] ?? [];
}
