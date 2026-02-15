type ExpectedModelGuard = {
  modelCode: string;
  width: number;
  height: number;
  slotCount: number;
};

type GeometryLike = {
  modelCode: string;
  intrinsicSize: {
    width: number;
    height: number;
  };
  slots: Record<string, unknown>;
};

const EXPECTED_GUARDS: ExpectedModelGuard[] = [
  { modelCode: 'PKP-2200-SI', width: 1000, height: 580, slotCount: 4 },
  { modelCode: 'PKP-2300-SI', width: 1200, height: 580, slotCount: 6 },
  { modelCode: 'PKP-2400-SI', width: 1320, height: 580, slotCount: 8 },
  { modelCode: 'PKP-2500-SI', width: 1420, height: 580, slotCount: 10 },
  { modelCode: 'PKP-2600-SI', width: 1540, height: 580, slotCount: 12 },
  { modelCode: 'PKP-3500-SI', width: 1400, height: 700, slotCount: 15 },
];

const loadGeometry = async <T extends GeometryLike>(relativePath: string, exportName: string): Promise<T> => {
  const moduleUrl = new URL(relativePath, import.meta.url);
  const module = (await import(moduleUrl.href)) as Record<string, unknown>;
  const geometry = module[exportName] as T | undefined;
  if (!geometry) {
    throw new Error(`Missing export "${exportName}" from ${relativePath}`);
  }
  return geometry;
};

const MODELS: GeometryLike[] = await Promise.all([
  loadGeometry<GeometryLike>('../config/layouts/models/pkp2200.ts', 'PKP_2200_SI_GEOMETRY'),
  loadGeometry<GeometryLike>('../config/layouts/models/pkp2300.ts', 'PKP_2300_SI_GEOMETRY'),
  loadGeometry<GeometryLike>('../config/layouts/models/pkp2400.ts', 'PKP_2400_SI_GEOMETRY'),
  loadGeometry<GeometryLike>('../config/layouts/models/pkp2500.ts', 'PKP_2500_SI_GEOMETRY'),
  loadGeometry<GeometryLike>('../config/layouts/models/pkp2600.ts', 'PKP_2600_SI_GEOMETRY'),
  loadGeometry<GeometryLike>('../config/layouts/models/pkp3500.ts', 'PKP_3500_SI_GEOMETRY'),
]);

const modelByCode = new Map(MODELS.map((geometry) => [geometry.modelCode, geometry]));

const failures: string[] = [];

for (const expected of EXPECTED_GUARDS) {
  const geometry = modelByCode.get(expected.modelCode);

  if (!geometry) {
    failures.push(`${expected.modelCode}: missing model export.`);
    continue;
  }

  const width = geometry.intrinsicSize.width;
  const height = geometry.intrinsicSize.height;
  const slotCount = Object.keys(geometry.slots).length;

  if (width !== expected.width || height !== expected.height) {
    failures.push(
      `${expected.modelCode}: intrinsicSize mismatch (expected ${expected.width}x${expected.height}, received ${width}x${height}).`,
    );
  }

  if (slotCount !== expected.slotCount) {
    failures.push(
      `${expected.modelCode}: slot count mismatch (expected ${expected.slotCount}, received ${slotCount}).`,
    );
  }
}

if (failures.length > 0) {
  console.error('Alignment guard verification failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Alignment guard verification passed for ${EXPECTED_GUARDS.length} models.`);
