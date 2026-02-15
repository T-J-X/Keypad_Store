import Link from 'next/link';
import type { ReactNode } from 'react';
import { Layers3, ShieldCheck, Wrench } from 'lucide-react';
import RelatedProducts from '../RelatedProducts';
import {
  iconCategoriesFromProduct,
  type CatalogProduct,
  type IconProduct,
  type VendureProductVariant,
} from '../../lib/vendure';
import Accordion from '../faq/Accordion';
import DownloadsList from './DownloadsList';
import PdpTabs, { type PdpTabPanel } from './PdpTabs';
import ProductHero from './ProductHero';
import { normalizeSpecValue, resolveAdditionalSpecs, resolveInTheBoxItems, resolveProductDownloads } from './productFieldData';
import { Breadcrumbs, type BreadcrumbItem } from '../Breadcrumbs';

const WHY_CHOOSE_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Built for Harsh Use',
    body: 'Legends stay clear in marine, motorsport, and industrial conditions where vibration and exposure are common.',
  },
  {
    icon: Layers3,
    title: 'Fast Visual Recognition',
    body: 'High-contrast icon geometry keeps controls identifiable at a glance, even on dense keypad layouts.',
  },
  {
    icon: Wrench,
    title: 'Service-Friendly',
    body: 'Inserts swap quickly so teams can evolve labeling standards without redesigning complete panels.',
  },
] as const;

function resolveStockSummary(variant?: VendureProductVariant) {
  if (!variant) {
    return {
      label: 'Out of stock',
      quantityLeft: 0,
      available: false,
    };
  }

  if (typeof variant.stockOnHand === 'number' && Number.isFinite(variant.stockOnHand)) {
    const allocated = (typeof variant.stockAllocated === 'number' && Number.isFinite(variant.stockAllocated))
      ? variant.stockAllocated
      : 0;
    const left = Math.max(0, Math.floor(variant.stockOnHand - allocated));
    return {
      label: left > 0 ? 'In stock' : 'Out of stock',
      quantityLeft: left,
      available: left > 0,
    };
  }

  const rawStock = (variant.stockLevel ?? '').trim();
  if (!rawStock) {
    return {
      label: 'Stock status unavailable',
      quantityLeft: null,
      available: true,
    };
  }

  const normalized = rawStock.toLowerCase();
  if (normalized === 'out_of_stock' || normalized === 'out of stock' || normalized === 'outofstock') {
    return {
      label: 'Out of stock',
      quantityLeft: null,
      available: false,
    };
  }
  if (normalized === 'low_stock' || normalized === 'low stock' || normalized === 'lowstock') {
    return {
      label: 'Low stock',
      quantityLeft: null,
      available: true,
    };
  }
  if (normalized === 'in_stock' || normalized === 'in stock' || normalized === 'instock') {
    return {
      label: 'In stock',
      quantityLeft: null,
      available: true,
    };
  }

  return {
    label: rawStock,
    quantityLeft: null,
    available: true,
  };
}

export default function ButtonInsertPdp({
  product,
  breadcrumbs,
  productTypeLabel,
  relatedProducts,
  priceAndStockSlot,
}: {
  product: CatalogProduct;
  breadcrumbs: BreadcrumbItem[];
  productTypeLabel: string;
  relatedProducts: IconProduct[];
  priceAndStockSlot?: ReactNode;
}) {
  const iconId = product.customFields?.iconId ?? '';
  const categories = iconCategoriesFromProduct(product);
  const primaryVariant = product.variants?.[0];
  const stockSummary = resolveStockSummary(primaryVariant);
  const priceWithVatLabel = formatPrice(primaryVariant?.priceWithTax, primaryVariant?.currencyCode);
  const priceExVatLabel = formatPriceExVatUk(primaryVariant?.priceWithTax, primaryVariant?.currencyCode) ?? 'Price unavailable';
  const description = product.description?.trim() || 'Built for reliable PKP-SI keypad labeling where clarity and durability are required.';
  const downloads = resolveProductDownloads(product);
  const inTheBoxItems = resolveInTheBoxItems(product);
  const baseSpecs = [
    { label: 'Icon Colour', value: normalizeSpecValue(product.customFields?.colour) },
    { label: 'Button Application', value: normalizeSpecValue(product.customFields?.application) },
    { label: 'Size', value: normalizeSpecValue(product.customFields?.size) },
  ].filter((spec): spec is { label: string; value: string } => Boolean(spec.value));
  const specs = [...baseSpecs, ...resolveAdditionalSpecs(product)];

  const tabPanels: PdpTabPanel[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <section className="space-y-8">
          <header className="mx-auto max-w-5xl space-y-3 text-center">
            <h2 className="text-center text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              PKP 15mm Icon Insert - {product.name}
            </h2>
            <p className="text-base leading-7 text-ink/72">{description}</p>
          </header>

          <div aria-hidden className="border-t border-ink/10" />

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-2 text-left">
              <h3 className="text-3xl font-semibold tracking-tight text-ink">Why Choose 15mm PKP Inserts</h3>
              <p className="text-sm text-ink/62">Engineered for tactile workflows where reliability and legibility matter.</p>
            </div>
            <div className="grid gap-3">
              {WHY_CHOOSE_ITEMS.map((item) => (
                <article key={item.title} className="rounded-2xl border border-surface-border bg-surface p-4 text-left">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/15 bg-surface-alt text-ink">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold tracking-tight text-ink">{item.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-ink/65">{item.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="card-soft rounded-3xl border border-dashed border-ink/25 p-8">
            <div className="text-sm font-semibold uppercase tracking-wide text-ink/45">Visual Feature</div>
            <div className="mt-3 flex h-52 items-center justify-center rounded-2xl bg-white text-sm text-ink/45">
              Action image / diagram placeholder
            </div>
          </div>
        </section>
      ),
    },
  ];

  tabPanels.push({
    id: 'specs',
    label: 'Specs',
    content: (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Specs</h2>
        {specs.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-base leading-7 text-ink/75">
            {specs.map((spec) => (
              <li key={`${spec.label}:${spec.value}`}>
                <span className="font-semibold text-ink">{spec.label}:</span> {spec.value}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base leading-7 text-ink/60">Coming soon.</p>
        )}
      </section>
    ),
  });

  tabPanels.push({
    id: 'in-the-box',
    label: 'In the Box',
    content: (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">In the Box</h2>
        {inTheBoxItems.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-base leading-7 text-ink/75">
            {inTheBoxItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-base leading-7 text-ink/60">Coming soon.</p>
        )}
      </section>
    ),
  });

  tabPanels.push({
    id: 'faq',
    label: 'FAQ',
    content: (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">FAQ</h2>
        <Accordion
          items={[
            {
              id: 'compatibility',
              question: 'Can I use this with any Keypad?',
              answer: (
                <p>
                  No - only the PKP-SI line. See compatible models in{' '}
                  <Link href="/shop?section=keypads" className="underline underline-offset-4">
                    PKP-SI keypads
                  </Link>
                  .
                </p>
              ),
            },
            {
              id: 'tooling',
              question: 'Do I need a special removal tool?',
              answer: (
                <p>
                  No, but the Keypad Co. insert tool makes fitting and replacing inserts simple and safe.{' '}
                  <a href="#" className="underline underline-offset-4">
                    Tool details coming soon
                  </a>
                  .
                </p>
              ),
            },
          ]}
        />
      </section>
    ),
  });

  tabPanels.push({
    id: 'downloads',
    label: 'Downloads',
    content: (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Downloads</h2>
        <DownloadsList downloads={downloads} />
      </section>
    ),
  });

  return (
    <div className="mx-auto w-full max-w-6xl bg-transparent px-6 pb-20 pt-12">
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <ProductHero
        product={product}
        productTypeLabel={productTypeLabel}
        iconId={iconId}
        categories={categories}
        compatibilityLinkHref="/shop?section=keypads"
        priceExVatLabel={priceExVatLabel}
        priceWithVatLabel={priceWithVatLabel}
        productVariantId={primaryVariant?.id}
        stock={stockSummary}
        priceAndStockSlot={priceAndStockSlot}
      />

      <div className="mt-20 space-y-12">
        <PdpTabs panels={tabPanels} defaultTabId="overview" />

        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
}

function formatPrice(priceWithTax?: number | null, currencyCode?: string | null) {
  if (typeof priceWithTax !== 'number') return null;
  return formatMinorPrice(priceWithTax, currencyCode);
}

function formatPriceExVatUk(priceWithTax?: number | null, currencyCode?: string | null) {
  if (typeof priceWithTax !== 'number') return null;
  const exVatMinor = Math.round(priceWithTax / 1.2);
  return formatMinorPrice(exVatMinor, currencyCode);
}

function formatMinorPrice(minorUnits: number, currencyCode?: string | null) {
  const currency = currencyCode || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(minorUnits / 100);
  } catch {
    return `${(minorUnits / 100).toFixed(2)} ${currency}`;
  }
}
