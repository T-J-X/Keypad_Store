import Link from 'next/link';
import type { KeypadProduct } from '../lib/vendure';
import { assetUrl } from '../lib/vendure';
import { buttonPrimaryClass, buttonSecondaryClass } from './buttonStyles';
import {
  cardPlaceholderTextClass,
  cardSupportingTextClass,
  cardTitleTextClass,
} from './cardTypography';

const keypadDescriptions: Record<string, string> = {
  'pkp-2200-si': 'Blink Marine CAN Keypad 4 Button 2x2',
  'pkp-2300-si': 'Blink Marine CAN Keypad 6 Button 2x3',
  'pkp-2400-si': 'Blink Marine CAN Keypad 8 Button 2x4',
  'pkp-2500-si': 'Blink Marine CAN Keypad 10 Button 2x5',
  'pkp-2600-si': 'Blink Marine CAN Keypad 12 Button 2x6',
  'pkp-3500-si': 'Blink Marine CAN Keypad 15 Button 3x5',
};

function resolveModelCode(product: KeypadProduct) {
  const slugMatch = product.slug.match(/pkp-\d{4}-si/i);
  if (slugMatch) return slugMatch[0].toUpperCase();

  const nameMatch = product.name.match(/pkp[\s-]?(\d{4})[\s-]?si/i);
  if (nameMatch) return `PKP-${nameMatch[1]}-SI`;

  return product.name;
}

function resolveDescription(modelCode: string) {
  return keypadDescriptions[modelCode.toLowerCase()] || 'Keypad model ready for configuration.';
}

export default function KeypadCard({
  product,
  mode = 'configurator',
  learnMoreHref,
  replaceDetailNavigation = false,
}: {
  product: KeypadProduct;
  mode?: 'configurator' | 'shop';
  learnMoreHref?: string;
  replaceDetailNavigation?: boolean;
}) {
  const image = product.featuredAsset?.preview ?? product.featuredAsset?.source ?? '';
  const modelCode = resolveModelCode(product);
  const description = resolveDescription(modelCode);
  const isShopCard = mode === 'shop';
  const detailHref = learnMoreHref ?? `/product/${product.slug}`;
  const mediaHeightClass = isShopCard ? 'h-56' : 'h-44';
  const mediaPaddingClass = isShopCard ? 'p-5' : 'p-4';

  return (
    <div className="card relative flex h-full flex-col gap-4 p-4">
      {isShopCard && (
        <Link
          href={detailHref}
          replace={replaceDetailNavigation}
          aria-label={`View ${product.name}`}
          className="absolute inset-0 z-0 rounded-2xl"
        />
      )}
      <div
        className={`relative z-10 overflow-hidden rounded-2xl bg-[linear-gradient(to_bottom,#f4f4f5_0%,#e4e4e7_50%,#ffffff_100%)] ${
          isShopCard ? 'pointer-events-none' : ''
        }`}
      >
        {image ? (
          <img
            src={assetUrl(image)}
            alt={product.name}
            className={`${mediaHeightClass} w-full object-contain ${mediaPaddingClass}`}
            loading="lazy"
          />
        ) : (
          <div className={`flex ${mediaHeightClass} items-center justify-center ${cardPlaceholderTextClass}`}>
            Render pending
          </div>
        )}
      </div>
      <div
        className={`relative z-10 flex flex-1 flex-col justify-between gap-3 ${
          isShopCard ? 'pointer-events-none' : ''
        }`}
      >
        <div>
          <div className={cardTitleTextClass}>{isShopCard ? modelCode : product.name}</div>
          <div className={`mt-1 ${cardSupportingTextClass}`}>{description}</div>
        </div>
        {isShopCard ? (
          <div className="pointer-events-auto relative z-20 flex flex-col gap-2 sm:flex-row">
            <Link
              href={detailHref}
              replace={replaceDetailNavigation}
              className={`${buttonSecondaryClass} w-full sm:w-auto`}
            >
              Learn more
            </Link>
            <Link
              href={`/configurator/${product.slug}`}
              className={`${buttonPrimaryClass} w-full sm:w-auto`}
            >
              Customize now
            </Link>
          </div>
        ) : (
          <Link
            href={`/configurator/${product.slug}`}
            className={`${buttonPrimaryClass} w-fit`}
          >
            Configure now
          </Link>
        )}
      </div>
    </div>
  );
}
