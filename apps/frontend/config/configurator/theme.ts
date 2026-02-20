type ConfiguratorGlowTheme = {
  defaultAlpha: number;
  thumbnailAlpha: number;
  haloStdDeviation: number;
  haloNearBlurFactor: number;
  haloFarBlurMultiplier: number;
  intensityBase: number;
  intensityByDarkness: number;
  colorMatrixAlphaFloor: number;
  colorMatrixAlphaMultiplier: number;
  blendMode: 'screen' | 'lighten';
};

type ConfiguratorTheme = {
  glow: ConfiguratorGlowTheme;
  iconFitPercent: number;
};

export const CONFIGURATOR_THEME: ConfiguratorTheme = {
  glow: {
    defaultAlpha: 0.46,
    thumbnailAlpha: 0.42,
    // Baseline halo blur for the backlit ring.
    haloStdDeviation: 8,
    haloNearBlurFactor: 0.024,
    haloFarBlurMultiplier: 1.55,
    intensityBase: 1.1,
    intensityByDarkness: 0.55,
    colorMatrixAlphaFloor: 0.85,
    colorMatrixAlphaMultiplier: 2.25,
    blendMode: 'screen',
  },
  // Fit guard tuned to fill the matte insert area without clipping the well edge.
  iconFitPercent: 60,
};
