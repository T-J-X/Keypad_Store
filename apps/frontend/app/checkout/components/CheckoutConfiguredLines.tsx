import Image from 'next/image';
import ConfiguredKeypadThumbnail from '../../../components/configurator/ConfiguredKeypadThumbnail';
import {
  countConfiguredSlots,
  emptyPreviewConfiguration,
  parseConfigurationForPreview,
  resolvePreviewSlotIds,
  type ConfiguredIconLookup,
} from '../../../lib/configuredKeypadPreview';
import { resolvePkpModelCode } from '../../../lib/keypadUtils';
import { assetUrl } from '../../../lib/vendure';
import type { CheckoutOrder } from '../../../lib/checkoutTypes';

type CheckoutConfiguredLinesProps = {
  order: CheckoutOrder;
  iconLookup: ConfiguredIconLookup;
  formatMinor: (minor: number | null | undefined, currencyCode: string) => string;
};

export default function CheckoutConfiguredLines({
  order,
  iconLookup,
  formatMinor,
}: CheckoutConfiguredLinesProps) {
  if (order.lines.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Configured line items</h2>
      <div className="mt-3 space-y-3">
        {order.lines.map((line) => {
          const configurationRaw = line.customFields?.configuration ?? null;
          const hasConfiguration = typeof configurationRaw === 'string' && configurationRaw.trim().length > 0;
          const previewConfiguration = hasConfiguration
            ? parseConfigurationForPreview(configurationRaw)
            : null;
          const modelCode = resolvePkpModelCode(
            line.productVariant?.product?.slug ?? '',
            line.productVariant?.product?.name ?? line.productVariant?.name ?? '',
          ) || null;
          const slotIds = resolvePreviewSlotIds({
            modelCode,
            configuration: previewConfiguration,
          });
          const configuredSlots = countConfiguredSlots(previewConfiguration);
          const imagePath = line.productVariant?.product?.featuredAsset?.preview
            || line.productVariant?.product?.featuredAsset?.source
            || '';
          const imageSrc = imagePath ? assetUrl(imagePath) : '';

          return (
            <article key={line.id} className="flex items-start gap-3 rounded-2xl border border-white/12 bg-[#081831]/65 p-3">
              <div className={`relative shrink-0 overflow-hidden rounded-xl flex items-center justify-center ${hasConfiguration ? 'h-20 w-24 bg-[#020916]' : 'h-20 w-20 bg-neutral-100'}`}>
                {hasConfiguration ? (
                  <ConfiguredKeypadThumbnail
                    modelCode={modelCode}
                    shellAssetPath={imagePath || null}
                    configuration={previewConfiguration ?? emptyPreviewConfiguration()}
                    iconLookup={iconLookup}
                    size="fill"
                  />
                ) : imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={line.productVariant?.name || 'Product image'}
                    fill
                    className="object-contain p-2"
                    sizes="80px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">
                  {line.productVariant?.name || line.productVariant?.product?.name || 'Product'}
                </div>
                {hasConfiguration ? (
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#9dcfff]">
                    Custom configuration: {configuredSlots}/{slotIds.length} slots defined
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <div className="text-xs font-semibold text-white">
                  {formatMinor(line.linePriceWithTax, line.productVariant?.currencyCode || order.currencyCode)}
                </div>
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.08]">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={line.quantity <= 1}
                    className="h-7 w-7 rounded-l-full text-sm text-blue-50 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="min-w-[2rem] px-1 text-center text-xs font-semibold text-white">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="h-7 w-7 rounded-r-full text-sm text-blue-50 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="text-[10px] font-semibold text-blue-100/60 underline-offset-4 transition hover:text-rose-300 hover:underline"
                >
                  Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
