import Link from 'next/link';
import type { KeypadProduct } from '../lib/vendure';
import { assetUrl } from '../lib/vendure';

const keypadDescriptions: Record<string, string> = {
  'pkp-2200-si': 'CAN Keypad 4 Button (2x2)',
  'PKP-2200-SI': 'CAN Keypad 4 Button (2x2)'
};

function resolveDescription(product: KeypadProduct) {
  return (
    keypadDescriptions[product.slug] ||
    keypadDescriptions[product.name] ||
    'Keypad model ready for configuration.'
  );
}

export default function KeypadCard({ product }: { product: KeypadProduct }) {
  const image = product.featuredAsset?.preview ?? product.featuredAsset?.source ?? '';
  const description = resolveDescription(product);

  return (
    <div className="card flex h-full flex-col gap-4 p-4">
      <div className="overflow-hidden rounded-2xl bg-slate-100">
        {image ? (
          <img
            src={assetUrl(image)}
            alt={product.name}
            className="h-44 w-full object-contain p-4"
            loading="lazy"
          />
        ) : (
          <div className="flex h-44 items-center justify-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            Render pending
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-ink">{product.name}</div>
          <div className="mt-1 text-xs text-ink/60">{description}</div>
        </div>
        <Link
          href={`/configurator/${product.slug}`}
          className="btn-primary inline-flex w-fit items-center justify-center"
        >
          Configure now
        </Link>
      </div>
    </div>
  );
}
