'use client';

import Image from 'next/image';
import { type CSSProperties } from 'react';
import type { KeypadConfigurationDraft, SlotId } from '../../lib/keypadConfiguration';
import { SLOT_IDS } from '../../lib/keypadConfiguration';
import type { ConfiguredIconLookup, ConfiguredIconLookupEntry } from '../../lib/configuredKeypadPreview';
import { assetUrl, categorySlug } from '../../lib/vendure';
import { PKP_2200_SI_GEOMETRY } from '../../config/layouts/geometry';

function resolveRingColor(value: string | null) {
  if (!value) return null;
  return value;
}

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
    `inset 0 0 0 1px ${hexToRgba(color, 0.42)}`,
    `0 0 8px ${hexToRgba(color, 0.34)}`,
    `0 0 16px ${hexToRgba(color, 0.24)}`,
    `0 0 26px ${hexToRgba(color, 0.16)}`,
  ].join(', ');
}

function resolveMatteAssetPath(iconId: string | null, icon: ConfiguredIconLookupEntry | undefined) {
  if (!iconId) return null;
  if (icon?.matteAssetPath) return icon.matteAssetPath;

  if (icon?.category) {
    const basePath = (process.env.NEXT_PUBLIC_MATTE_INSERTS_BASE_PATH || '/matte_inserts').replace(/\/+$/, '');
    return `${basePath}/${categorySlug(icon.category)}/${iconId}.png`;
  }

  return null;
}

function sizeClassFromVariant(size: 'sm' | 'md' | 'lg') {
  if (size === 'lg') return 'w-full max-w-[320px]';
  if (size === 'md') return 'w-28';
  return 'w-20';
}

export default function ConfiguredKeypadThumbnail({
  shellAssetPath,
  configuration,
  iconLookup,
  size = 'sm',
  showSlotLabels = false,
}: {
  shellAssetPath?: string | null;
  configuration: KeypadConfigurationDraft;
  iconLookup: ConfiguredIconLookup;
  size?: 'sm' | 'md' | 'lg';
  showSlotLabels?: boolean;
}) {
  const shellSrc = shellAssetPath ? assetUrl(shellAssetPath) : '';
  const sizeClass = sizeClassFromVariant(size);

  return (
    <div className={sizeClass} style={{ aspectRatio: String(PKP_2200_SI_GEOMETRY.aspectRatio) }}>
      <div className="relative h-full w-full overflow-visible rounded-xl border border-[#0f2c5a]/20 bg-[radial-gradient(145%_125%_at_50%_0%,#2c75d8_0%,#12335f_40%,#081427_100%)]">
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          {shellSrc ? (
            <Image
              src={shellSrc}
              alt="Configured keypad shell"
              fill
              className="object-contain"
              sizes={size === 'lg' ? '320px' : '120px'}
            />
          ) : (
            <div className="absolute inset-0 bg-[#040d1f]" />
          )}
        </div>

        {SLOT_IDS.map((slotId) => {
          const slot = configuration[slotId as SlotId];
          const iconId = slot?.iconId ?? null;
          const icon = iconId ? iconLookup.get(iconId) : undefined;
          const matteAssetPath = resolveMatteAssetPath(iconId, icon);
          const matteSrc = matteAssetPath ? assetUrl(matteAssetPath) : '';
          const ringColor = resolveRingColor(slot?.color ?? null);

          const geometry = PKP_2200_SI_GEOMETRY.slots[slotId as SlotId];
          const ringDiameter = PKP_2200_SI_GEOMETRY.buttonVisual.ringDiameterPctOfSlot;
          const iconDiameter = PKP_2200_SI_GEOMETRY.buttonVisual.iconDiameterPctOfSlot;
          const style: CSSProperties = {
            left: `${geometry.cx * 100}%`,
            top: `${geometry.cy * 100}%`,
            width: `${geometry.r * 200}%`,
            height: `${geometry.r * 200}%`,
            transform: 'translate(-50%, -50%)',
          };

          return (
            <div
              key={slotId}
              className="absolute rounded-[24%]"
              style={style}
            >
              {showSlotLabels ? (
                <span className="pointer-events-none absolute left-1 top-1 z-30 rounded-full bg-[#04122d]/70 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-blue-50/85">
                  {geometry.label}
                </span>
              ) : null}

              <span
                className="pointer-events-none absolute left-1/2 top-1/2 z-10 rounded-full"
                style={{
                  width: `${ringDiameter}%`,
                  height: `${ringDiameter}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(178,188,206,0.52), inset 0 2px 2px rgba(255,255,255,0.12), inset 0 -5px 8px rgba(0,0,0,0.4)',
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
                    background: `radial-gradient(circle, transparent 52%, ${hexToRgba(ringColor, 0.34)} 63%, ${hexToRgba(ringColor, 0.08)} 74%, transparent 84%)`,
                    filter: 'blur(4px)',
                    mixBlendMode: 'screen',
                  }}
                />
              ) : null}

              {matteSrc ? (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                  <div
                    className="relative"
                    style={{
                      width: `${iconDiameter}%`,
                      height: `${iconDiameter}%`,
                    }}
                  >
                    <Image
                      src={matteSrc}
                      alt={iconId ? `Icon ${iconId}` : 'Configured icon'}
                      fill
                      className="block object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
                      sizes={size === 'lg' ? '68px' : '26px'}
                    />
                  </div>
                </div>
              ) : (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                  <span className="grid h-[56%] w-[56%] place-items-center text-base font-semibold text-white/60">+</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
