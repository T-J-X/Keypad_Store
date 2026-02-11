'use client';

import Image from 'next/image';
import { PKP_2200_SI_GEOMETRY } from '../../config/layouts/geometry';
import { assetUrl } from '../../lib/vendure';
import { SLOT_IDS, type SlotId } from '../../lib/keypadConfiguration';
import type { SlotVisualState } from '../../lib/configuratorStore';

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return `rgba(30, 167, 255, ${alpha})`;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ringGlowShadow(color: string) {
  return [
    `inset 0 0 0 2px ${hexToRgba(color, 0.92)}`,
    `0 0 8px ${hexToRgba(color, 0.92)}`,
    `0 0 18px ${hexToRgba(color, 0.72)}`,
    `0 0 30px ${hexToRgba(color, 0.48)}`,
  ].join(', ');
}

export default function KeypadPreview({
  shellAssetPath,
  slots,
  activeSlotId,
  onSlotClick,
}: {
  shellAssetPath?: string | null;
  slots: Record<SlotId, SlotVisualState>;
  activeSlotId: SlotId | null;
  onSlotClick: (slotId: SlotId) => void;
}) {
  const shellSrc = shellAssetPath ? assetUrl(shellAssetPath) : '';

  return (
    <div className="card relative overflow-hidden border border-white/18 bg-[radial-gradient(140%_120%_at_60%_-10%,#2e79dd_0%,#17305f_36%,#0a1429_72%)] p-5 shadow-[0_28px_70px_rgba(2,9,24,0.42)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">Command View</div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">PKP-2200-SI Preview</h2>
        </div>
        <div className="rounded-full border border-white/20 bg-[#06122a]/65 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-blue-100">
          2x2
        </div>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-[28px] border border-white/20 bg-[#020a18]">
        {shellSrc ? (
          <Image
            src={shellSrc}
            alt="PKP-2200-SI shell"
            fill
            priority
            className="object-contain p-[9%]"
            sizes="(max-width: 1024px) 100vw, 560px"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm font-semibold text-blue-100/80">
            Shell render pending
          </div>
        )}

        {SLOT_IDS.map((slotId) => {
          const slot = slots[slotId];
          const geometry = PKP_2200_SI_GEOMETRY.slots[slotId];
          const isActive = slotId === activeSlotId;
          const matteSrc = slot.matteAssetPath ? assetUrl(slot.matteAssetPath) : '';
          const ringColor = slot.color;
          const ringDiameter = PKP_2200_SI_GEOMETRY.buttonVisual.ringDiameterPctOfSlot;
          const iconDiameter = PKP_2200_SI_GEOMETRY.buttonVisual.iconDiameterPctOfSlot;

          return (
            <button
              key={slotId}
              type="button"
              onClick={() => onSlotClick(slotId)}
              aria-label={`Configure ${geometry.label}`}
              className={[
                'absolute overflow-hidden rounded-[18%] transition-[transform,box-shadow,background] duration-200',
                isActive
                  ? 'z-40 scale-[1.01] bg-white/[0.06] shadow-[0_0_0_1px_rgba(170,189,216,0.32),0_0_0_8px_rgba(30,167,255,0.14)]'
                  : 'z-30 bg-transparent hover:bg-white/[0.04]',
              ].join(' ')}
              style={{
                left: `${geometry.leftPct}%`,
                top: `${geometry.topPct}%`,
                width: `${geometry.widthPct}%`,
                height: `${geometry.heightPct}%`,
              }}
            >
              <span className="pointer-events-none absolute left-1.5 top-1.5 z-20 rounded-full bg-[#04122d]/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-50/85">
                {geometry.label}
              </span>

              <span
                className="pointer-events-none absolute left-1/2 top-1/2 z-10 rounded-full"
                style={{
                  width: `${ringDiameter}%`,
                  height: `${ringDiameter}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow:
                    'inset 0 0 0 1.5px rgba(164,176,196,0.42), inset 0 2px 2px rgba(255,255,255,0.08), inset 0 -4px 6px rgba(0,0,0,0.35)',
                }}
              />

              {ringColor ? (
                <span
                  className="pointer-events-none absolute left-1/2 top-1/2 z-20 rounded-full"
                  style={{
                    width: `${ringDiameter}%`,
                    height: `${ringDiameter}%`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: ringGlowShadow(ringColor),
                    background: `radial-gradient(circle, transparent 62%, ${hexToRgba(ringColor, 0.28)} 76%, transparent 100%)`,
                  }}
                />
              ) : null}

              {matteSrc ? (
                <span
                  className="pointer-events-none absolute left-1/2 top-1/2 z-30"
                  style={{
                    width: `${iconDiameter}%`,
                    height: `${iconDiameter}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <Image
                    src={matteSrc}
                    alt={slot.iconName || slot.iconId || 'Selected matte insert'}
                    fill
                    sizes="(max-width: 1024px) 12vw, 48px"
                    className="object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
                  />
                </span>
              ) : (
                <span
                  className="pointer-events-none absolute left-1/2 top-1/2 z-30 grid place-items-center text-xl font-semibold text-white/60"
                  style={{
                    width: `${iconDiameter}%`,
                    height: `${iconDiameter}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  +
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-blue-100/75">
        Layer order: shell (bottom), matte insert (middle), ring glow (top).
      </div>
    </div>
  );
}
