import { buildGridModelGeometry } from '../shared';

export const PKP_3500_SI_GEOMETRY = buildGridModelGeometry({
  modelCode: 'PKP-3500-SI',
  layoutLabel: '3x5',
  columns: 5,
  rows: 3,
  intrinsicSize: {
    width: 1400,
    height: 700,
  },
  gridBounds: {
    xCentersPct: [10.8, 30.9, 49.8, 68.2, 89.0],
    yCentersPct: [15.0, 50.2, 83.2],
  },
});
