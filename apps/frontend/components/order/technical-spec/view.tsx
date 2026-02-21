import type { KeypadModelGeometry } from '../../../config/layouts/geometry';
import type { ConfiguredIconLookup } from '../../../lib/configuredKeypadPreview';
import type { SlotId } from '../../../lib/keypadConfiguration';
import ConfiguredKeypadThumbnail from '../../configurator/ConfiguredKeypadThumbnail';
import AccessibleModal from '../../ui/AccessibleModal';
import type { TechnicalSpecLine, TechnicalSpecPayload } from './types';

type TechnicalSpecViewProps = {
  orderCode: string;
  titleId: string;
  descriptionId: string;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  downloadError: string | null;
  downloadingLineId: string | null;
  specData: TechnicalSpecPayload | null;
  activeLine: TechnicalSpecLine | null;
  activeModelCode: string | null;
  activeGeometry: KeypadModelGeometry | null;
  activeSlotIds: SlotId[];
  iconLookup: ConfiguredIconLookup;
  onOpen: () => void;
  onClose: () => void;
  onSelectLine: (lineId: string) => void;
  onDownloadPdf: () => void;
};

export default function TechnicalSpecView({
  orderCode,
  titleId,
  descriptionId,
  isOpen,
  isLoading,
  error,
  downloadError,
  downloadingLineId,
  specData,
  activeLine,
  activeModelCode,
  activeGeometry,
  activeSlotIds,
  iconLookup,
  onOpen,
  onClose,
  onSelectLine,
  onDownloadPdf,
}: TechnicalSpecViewProps) {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#0e2e60] bg-[linear-gradient(90deg,#031331_0%,#0d2f63_58%,#1f59a6_100%)] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-white whitespace-nowrap transition hover:opacity-90"
      >
        View Technical Specification
      </button>

      <AccessibleModal
        open={isOpen}
        onClose={onClose}
        labelledBy={titleId}
        describedBy={descriptionId}
        backdropClassName="fixed inset-0 z-[90] flex items-start justify-center overflow-auto bg-[#020b19]/70 px-4 py-6 backdrop-blur-[2px]"
        panelClassName="w-full max-w-5xl rounded-3xl border border-white/15 bg-[linear-gradient(180deg,#0d1f43_0%,#07132a_100%)] p-5 shadow-[0_30px_90px_rgba(2,8,24,0.6)] sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/12 pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/75">Engineering Sign-Off</div>
            <h2 id={titleId} className="mt-1 text-2xl font-semibold tracking-tight text-white">Order {orderCode}</h2>
            <p id={descriptionId} className="mt-1 text-xs text-blue-100/75">
              {specData
                ? `${formatDate(specData.orderDate)}${specData.customerName ? ` · ${specData.customerName}` : ''}`
                : 'Order technical specification dialog'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-white/30 px-4 text-sm font-semibold text-white whitespace-nowrap transition hover:border-white hover:bg-white/10"
          >
            Close
          </button>
        </div>

        {isLoading ? <p className="mt-5 text-sm text-blue-100/80">Loading technical specification…</p> : null}
        {error ? <p className="mt-5 text-sm font-semibold text-rose-300">{error}</p> : null}

        {!isLoading && !error && specData && activeLine ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-3">
              {specData.lines.length > 1 ? (
                <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-100/75">Configured lines</div>
                  <div className="mt-2 grid gap-2">
                    {specData.lines.map((line) => (
                      <button
                        key={line.lineId}
                        type="button"
                        onClick={() => onSelectLine(line.lineId)}
                        className={[
                          'rounded-xl border px-3 py-2 text-left text-xs font-semibold transition',
                          activeLine.lineId === line.lineId
                            ? 'border-[#8cc8ff] bg-[#15315f] text-white'
                            : 'border-white/20 bg-white/[0.06] text-blue-100 hover:border-white/40',
                        ].join(' ')}
                      >
                        {line.variantSku || line.variantName} · Qty {line.quantity}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <ConfiguredKeypadThumbnail
                modelCode={activeModelCode}
                shellAssetPath={null}
                configuration={activeLine.configuration}
                iconLookup={iconLookup}
                size="lg"
                showSlotLabels
              />

              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={downloadingLineId === activeLine.lineId}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-[#0d2f63] bg-white px-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#0d2f63] whitespace-nowrap transition hover:bg-[#e5efff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadingLineId === activeLine.lineId ? 'Generating PDF…' : 'Download Engineering PDF'}
              </button>
              {downloadError ? <p className="text-xs font-semibold text-rose-300">{downloadError}</p> : null}
            </div>

            <section className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.13em] text-blue-100/75">Bill of Materials</div>
              <div className="mt-3 overflow-hidden rounded-xl border border-white/15">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-white/8 text-left text-[11px] uppercase tracking-[0.12em] text-blue-100/75">
                      <th className="px-3 py-2">Slot</th>
                      <th className="px-3 py-2">Icon ID</th>
                      <th className="px-3 py-2">Icon Name</th>
                      <th className="px-3 py-2">Glow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSlotIds.map((slotId) => {
                      const slot = activeLine.configuration[slotId];
                      const iconMeta = slot?.iconId ? iconLookup.get(slot.iconId) : undefined;
                      return (
                        <tr key={slotId} className="border-t border-white/15 text-blue-50/90">
                          <td className="px-3 py-2 font-semibold">
                            {activeGeometry?.slots[slotId]?.label ?? slotId.replace('_', ' ')}
                          </td>
                          <td className="px-3 py-2 font-mono">{slot?.iconId || 'N/A'}</td>
                          <td className="px-3 py-2">{iconMeta?.iconName || 'Unknown icon'}</td>
                          <td className="px-3 py-2">{slot?.color || 'No glow'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </AccessibleModal>
    </>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
