import Link from 'next/link';
import type { ReactNode } from 'react';
import { Gauge, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import Accordion from '../faq/Accordion';
import DownloadsList from './DownloadsList';
import KeypadImageGallery from './KeypadImageGallery';
import PdpTabs, { type PdpTabPanel } from './PdpTabs';
import { type CatalogProduct, assetUrl } from '../../lib/vendure';
import { normalizeSpecValue, resolveAdditionalSpecs, resolveInTheBoxItems, resolveProductDownloads } from './productFieldData';
import { Breadcrumbs, type BreadcrumbItem } from '../Breadcrumbs';

const WHY_CHOOSE_KEYPAD_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Rugged Reliability',
    body: 'PKP-SI hardware is tuned for compact panels where dependable actuation is mission-critical.',
  },
  {
    icon: Gauge,
    title: 'Fast Operator Readability',
    body: 'Button spacing and legend contrast support quick visual parsing under pressure.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Configuration Flexibility',
    body: 'Pair inserts and per-button behavior to standardize controls across vehicles and fleets.',
  },
] as const;

export default function KeypadPdp({
  product,
  breadcrumbs,
  modelCode,
  priceAndStockSlot,
}: {
  product: CatalogProduct;
  breadcrumbs: BreadcrumbItem[];
  modelCode: string;
  priceAndStockSlot?: ReactNode;
}) {
  const galleryImages = resolveGalleryImages(product);
  const description = product.description?.trim() || 'PKP-SI keypads are built for configurable, rugged control systems.';
  const downloads = resolveProductDownloads(product);
  const inTheBoxItems = resolveInTheBoxItems(product);
  const configuratorSlug = (product.slug || modelCode).trim();
  const configuratorHref = `/configurator/keypad/${encodeURIComponent(configuratorSlug)}`;
  const primaryVariant = product.variants?.[0];
  const priceWithVatLabel = formatPrice(primaryVariant?.priceWithTax, primaryVariant?.currencyCode);
  const priceExVatLabel = formatPriceExVatUk(primaryVariant?.priceWithTax, primaryVariant?.currencyCode) ?? 'Price unavailable';
  const baseSpecs = [
    { label: 'Model', value: modelCode || null },
    { label: 'Application', value: normalizeSpecValue(product.customFields?.application) },
    { label: 'Colour', value: normalizeSpecValue(product.customFields?.colour) },
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
              PKP-SI Keypad - {product.name}
            </h2>
            <p className="text-base leading-7 text-ink/72">{description}</p>
          </header>

          <div aria-hidden className="border-t border-ink/10" />

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-2 text-left">
              <h3 className="text-3xl font-semibold tracking-tight text-ink">Why Choose PKP-SI Keypads</h3>
              <p className="text-sm text-ink/62">Purpose-built for repeatable control workflows and long service life.</p>
            </div>
            <div className="grid gap-3">
              {WHY_CHOOSE_KEYPAD_ITEMS.map((item) => (
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
              Keypad layout / usage diagram placeholder
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
              id: 'insert-compatibility',
              question: 'Which inserts work with this keypad?',
              answer: (
                <p>
                  Use PKP-SI 15mm inserts from the{' '}
                  <Link href="/shop?section=button-inserts" className="underline underline-offset-4">
                    Button Insert catalog
                  </Link>
                  .
                </p>
              ),
            },
            {
              id: 'configurator',
              question: 'How do I start configuration?',
              answer: (
                <p>
                  Open the{' '}
                  <Link href={configuratorHref} className="underline underline-offset-4">
                    model configurator
                  </Link>{' '}
                  to assign inserts and build your keypad layout.
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

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <div className="card-soft rounded-[28px] p-10 md:p-12">
            <KeypadImageGallery images={galleryImages} productName={product.name} />
          </div>
        </div>

        <div className="lg:sticky lg:top-32">
          <section className="card-soft space-y-4 p-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">{product.name}</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">Keypad Product</p>
            </div>

            <dl className="space-y-3 text-sm text-ink/75">
              <div className="flex flex-col gap-1">
                <dt className="font-semibold text-ink">Model</dt>
                <dd className="text-ink/80">{modelCode || '—'}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="font-semibold text-ink">Compatibility</dt>
                <dd>
                  <Link
                    href="/shop?section=button-inserts"
                    className="text-ink underline underline-offset-4 hover:text-ink/75"
                  >
                    Compatible with PKP-SI 15mm Button Inserts
                  </Link>
                </dd>
              </div>
            </dl>

            {priceAndStockSlot ? (
              priceAndStockSlot
            ) : (
              <div className="space-y-1">
                <div className="text-sm font-semibold uppercase tracking-wide text-ink/55">Price</div>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-semibold tracking-tight text-ink">{priceWithVatLabel ?? priceExVatLabel}</div>
                  <div className="pb-1 text-xs font-semibold tracking-wide text-ink/60">(INCL VAT)</div>
                </div>
                <div className="text-xs font-semibold tracking-wide text-ink/55">{priceExVatLabel} (EXCL VAT)</div>
              </div>
            )}

            <div className="pt-2">
              <Link
                href={configuratorHref}
                className="group relative isolate inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-transparent px-6 py-4 text-sm font-medium text-white whitespace-nowrap bg-[linear-gradient(90deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#203f7a_0%,#2f5da8_55%,#4b7fca_100%)] [background-origin:padding-box,border-box] [background-clip:padding-box,border-box] transition-[background,box-shadow,transform] duration-300 hover:-translate-y-[1px] hover:bg-[linear-gradient(270deg,#040F2E_0%,#112B5D_55%,#29457A_100%),linear-gradient(90deg,#24497d_0%,#39629a_55%,#537bb0_100%)] hover:shadow-[0_0_0_1px_rgba(72,116,194,0.56),0_10px_24px_rgba(4,15,46,0.29)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29457A]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(270deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_45%,rgba(255,255,255,0.08)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-45" />
                <span className="pointer-events-none absolute -inset-[1px] -z-10 rounded-2xl bg-[linear-gradient(90deg,rgba(11,27,58,0.44)_0%,rgba(27,52,95,0.30)_55%,rgba(58,116,198,0.30)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-55" />
                <span className="relative z-10">Customize keypad</span>
              </Link>
            </div>
          </section>
        </div>
      </div>

      <div className="mt-20 space-y-12">
        <PdpTabs panels={tabPanels} defaultTabId="overview" />
      </div>
    </div>
  );
}

function resolveGalleryImages(product: CatalogProduct) {
  const seen = new Set<string>();
  const images: { id: string; src: string; alt: string }[] = [];

  const addImage = (id: string, value?: string | null) => {
    const normalized = assetUrl(value || '');
    if (!normalized) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    images.push({
      id,
      src: normalized,
      alt: product.name,
    });
  };

  const featured = product.featuredAsset;
  if (featured) {
    addImage(`featured-${featured.id}`, featured.preview ?? featured.source ?? '');
  }

  for (const asset of product.assets ?? []) {
    addImage(`asset-${asset.id}`, asset.preview ?? asset.source ?? '');
  }

  return images;
}

function formatPrice(priceWithTax?: number | null, currencyCode?: string | null) {
  if (typeof priceWithTax !== 'number') return null;
  const currency = currencyCode || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(priceWithTax / 100);
  } catch {
    return `${(priceWithTax / 100).toFixed(2)} ${currency}`;
  }
}

function formatPriceExVatUk(priceWithTax?: number | null, currencyCode?: string | null) {
  if (typeof priceWithTax !== 'number') return null;
  const exVatMinor = Math.round(priceWithTax / 1.2);
  const currency = currencyCode || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(exVatMinor / 100);
  } catch {
    return `${(exVatMinor / 100).toFixed(2)} ${currency}`;
  }
}
