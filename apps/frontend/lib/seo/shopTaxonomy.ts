import { categorySlug, iconCategoriesFromProduct, type IconProduct, type KeypadProduct } from '../vendure';

export type ShopDisciplineCluster = {
  slug: string;
  label: string;
  count: number;
};

export type ShopProtocolCluster = {
  slug: string;
  label: string;
  count: number;
  keywords: string[];
};

type ProtocolDefinition = {
  slug: string;
  label: string;
  patterns: RegExp[];
  keywords: string[];
};

const PROTOCOL_DEFINITIONS: ProtocolDefinition[] = [
  {
    slug: 'j1939',
    label: 'J1939',
    patterns: [/\bj1939\b/i, /\bsae\s*j1939\b/i],
    keywords: ['J1939 keypad', 'SAE J1939 keypad', 'J1939 control keypad'],
  },
  {
    slug: 'canopen',
    label: 'CANopen',
    patterns: [/\bcanopen\b/i, /\bcan\s*open\b/i],
    keywords: ['CANopen keypad', 'CANopen control panel', 'CANopen HMI keypad'],
  },
  {
    slug: 'can-bus',
    label: 'CAN Bus',
    patterns: [
      /\bcan\s*bus\b/i,
      /\bcanbus\b/i,
      /\bcan\s+keypad\b/i,
      /\bcan\b\s*(?:\/|and)\s*j1939\b/i,
      /\bsupports?\s+can\b/i,
      /\bsae\s*can\b/i,
      /\bcan\s+network\b/i,
    ],
    keywords: ['CAN keypad', 'CAN bus keypad', 'CAN control keypad'],
  },
  {
    slug: 'nmea-2000',
    label: 'NMEA 2000',
    patterns: [/\bnmea[\s-]*2000\b/i],
    keywords: ['NMEA 2000 keypad', 'marine NMEA keypad'],
  },
  {
    slug: 'backlit',
    label: 'Backlit',
    patterns: [/\bbacklit\b/i, /\billuminated\b/i],
    keywords: ['backlit keypad', 'illuminated keypad buttons'],
  },
  {
    slug: 'sealed',
    label: 'Sealed / IP Rated',
    patterns: [/\bsealed\b/i, /\bip67\b/i, /\bip68\b/i, /\bip69\b/i, /\bip6k\d\b/i, /\bingress\b/i],
    keywords: ['sealed keypad', 'IP rated keypad', 'rugged keypad'],
  },
  {
    slug: 'marine',
    label: 'Marine',
    patterns: [/\bmarine\b/i, /\bhelm\b/i, /\bboat\b/i, /\bvessel\b/i],
    keywords: ['marine keypad', 'boat control keypad', 'helm keypad'],
  },
  {
    slug: 'off-road',
    label: 'Off-Road',
    patterns: [/\boff[-\s]?road\b/i, /\b4x4\b/i, /\bagriculture\b/i, /\btractor\b/i, /\butility\b/i],
    keywords: ['off-road keypad', '4x4 keypad', 'utility vehicle keypad'],
  },
  {
    slug: 'sim-racing',
    label: 'Sim Racing',
    patterns: [/\bsim\s*racing\b/i, /\bracing\s*sim\b/i, /\bsim\b/i],
    keywords: ['sim racing keypad', 'racing control keypad'],
  },
];

function normalizeText(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function splitStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value !== 'string') return [];
  return value
    .split(/[,;|]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readAdditionalSpecs(product: KeypadProduct) {
  const rawSpecs = product.customFields?.additionalSpecs;
  if (!Array.isArray(rawSpecs)) return [];

  const values: string[] = [];
  for (const raw of rawSpecs) {
    if (typeof raw === 'string') {
      const value = raw.trim();
      if (value) values.push(value);
      continue;
    }
    if (!raw || typeof raw !== 'object') continue;
    const label =
      (typeof raw.label === 'string' ? raw.label : '')
      || (typeof raw.name === 'string' ? raw.name : '')
      || (typeof raw.key === 'string' ? raw.key : '')
      || (typeof raw.title === 'string' ? raw.title : '');
    const value =
      (typeof raw.value === 'string' ? raw.value : '')
      || (typeof raw.text === 'string' ? raw.text : '');

    const combined = `${label} ${value}`.trim();
    if (combined) values.push(combined);
  }
  return values;
}

function protocolLabelFromSlug(slug: string) {
  const definition = PROTOCOL_DEFINITIONS.find((item) => item.slug === slug);
  if (definition) return definition.label;
  return slug
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function protocolKeywordsFromSlug(slug: string) {
  const definition = PROTOCOL_DEFINITIONS.find((item) => item.slug === slug);
  if (definition) return definition.keywords;
  const label = protocolLabelFromSlug(slug);
  return [`${label} keypad`, `${label} control keypad`];
}

export function inferKeypadProtocolSlugs(keypad: KeypadProduct) {
  const applications = splitStringList(keypad.customFields?.application);
  const additionalSpecs = readAdditionalSpecs(keypad);
  const combined = normalizeText(
    [
      keypad.name,
      keypad.slug,
      keypad.description ?? '',
      ...applications,
      ...additionalSpecs,
    ].join(' '),
  );

  const matched = PROTOCOL_DEFINITIONS
    .filter((definition) => definition.patterns.some((pattern) => pattern.test(combined)))
    .map((definition) => definition.slug);

  if (matched.length > 0) return Array.from(new Set(matched));

  const fallbackFromApplications = applications
    .map((item) => categorySlug(item))
    .filter(Boolean)
    .slice(0, 1);

  if (fallbackFromApplications.length > 0) return fallbackFromApplications;
  return ['general'];
}

export function filterKeypadsByProtocol(keypads: KeypadProduct[], protocolSlug: string) {
  const normalizedProtocol = categorySlug(protocolSlug);
  return keypads.filter((keypad) => inferKeypadProtocolSlugs(keypad).includes(normalizedProtocol));
}

export function buildKeypadProtocolClusters(keypads: KeypadProduct[]) {
  const counts = new Map<string, number>();

  for (const keypad of keypads) {
    const slugs = Array.from(new Set(inferKeypadProtocolSlugs(keypad)));
    for (const slug of slugs) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }

  const clusters: ShopProtocolCluster[] = Array.from(counts.entries())
    .map(([slug, count]) => ({
      slug,
      label: protocolLabelFromSlug(slug),
      count,
      keywords: protocolKeywordsFromSlug(slug),
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });

  if (clusters.length > 1) {
    return clusters.filter((cluster) => cluster.slug !== 'general');
  }
  return clusters;
}

export function buildButtonInsertDisciplineClusters(icons: IconProduct[]) {
  const counts = new Map<string, ShopDisciplineCluster>();

  for (const icon of icons) {
    const categoryNames = iconCategoriesFromProduct(icon);
    const uniqueSlugs = new Set<string>();

    for (const categoryName of categoryNames) {
      const slug = categorySlug(categoryName);
      if (!slug || uniqueSlugs.has(slug)) continue;
      uniqueSlugs.add(slug);

      const existing = counts.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(slug, {
          slug,
          label: categoryName,
          count: 1,
        });
      }
    }
  }

  return Array.from(counts.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}

export function filterIconsByDiscipline(icons: IconProduct[], disciplineSlug: string) {
  const normalizedDiscipline = categorySlug(disciplineSlug);
  return icons.filter((icon) => {
    const categoryNames = iconCategoriesFromProduct(icon);
    return categoryNames.some((name) => categorySlug(name) === normalizedDiscipline);
  });
}
