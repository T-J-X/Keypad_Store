'use client';

import Image from 'next/image';
import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react';
import type { KeypadConfigurationDraft } from '../../lib/keypadConfiguration';
import { getOrderedSlotIdsFromConfiguration, sortSlotIds } from '../../lib/keypadConfiguration';
import type { ConfiguredIconLookup, ConfiguredIconLookupEntry } from '../../lib/configuredKeypadPreview';
import { assetUrl, categorySlug } from '../../lib/vendure';
import {
  KEYPAD_MODEL_GEOMETRIES,
  getGeometryForModel,
  getSlotIdsForGeometry,
  inferModelCodeFromSlotCount,
} from '../../config/layouts/geometry';
import { CONFIGURATOR_THEME } from '../../config/configurator/theme';

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

function resolveMatteAssetPath(iconId: string | null, icon: ConfiguredIconLookupEntry | undefined) {
  if (!iconId) return null;
  if (icon?.matteAssetPath) return icon.matteAssetPath;

  if (icon?.category) {
    const basePath = (process.env.NEXT_PUBLIC_MATTE_INSERTS_BASE_PATH || '/matte_inserts').replace(/\/+$/, '');
    return `${basePath}/${categorySlug(icon.category)}/${iconId}.png`;
  }

  return null;
}

function sizeClassFromVariant(size: 'sm' | 'md' | 'lg' | 'fill') {
  if (size === 'fill') return 'w-full h-full';
  if (size === 'lg') return 'w-full max-w-[320px]';
  if (size === 'md') return 'w-28';
  return 'w-20';
}

export default function ConfiguredKeypadThumbnail({
  modelCode,
  shellAssetPath,
  configuration,
  iconLookup,
  size = 'sm',
  showSlotLabels = false,
}: {
  modelCode?: string | null;
  shellAssetPath?: string | null;
  configuration: KeypadConfigurationDraft;
  iconLookup: ConfiguredIconLookup;
  size?: 'sm' | 'md' | 'lg' | 'fill';
  showSlotLabels?: boolean;
}) {
  const resolvedModelCode = useMemo(() => {
    const normalized = (modelCode ?? '').trim().toUpperCase();
    if (normalized && KEYPAD_MODEL_GEOMETRIES[normalized]) return normalized;

    const configuredSlotCount = getOrderedSlotIdsFromConfiguration(configuration).length;
    return inferModelCodeFromSlotCount(configuredSlotCount) ?? 'PKP-2200-SI';
  }, [configuration, modelCode]);
  const geometry = useMemo(() => getGeometryForModel(resolvedModelCode), [resolvedModelCode]);
  const geometrySlotIds = useMemo(() => getSlotIdsForGeometry(geometry), [geometry]);
  const configurationSlotIds = useMemo(
    () => getOrderedSlotIdsFromConfiguration(configuration),
    [configuration],
  );
  const slotIds = useMemo(() => {
    if (configurationSlotIds.length === geometrySlotIds.length) {
      const geometrySet = new Set(geometrySlotIds);
      if (configurationSlotIds.every((slotId) => geometrySet.has(slotId))) {
        return geometrySlotIds;
      }
    }

    if (configurationSlotIds.length > 0) {
      return sortSlotIds(configurationSlotIds);
    }

    return geometrySlotIds;
  }, [configurationSlotIds, geometrySlotIds]);
  const shellSrc = shellAssetPath ? assetUrl(shellAssetPath) : '';
  const sizeClass = sizeClassFromVariant(size);
  const [renderAspectRatio, setRenderAspectRatio] = useState(geometry.aspectRatio);
  const syncRenderAspectRatio = useCallback(() => {
    if (!shellSrc || typeof window === 'undefined') {
      setRenderAspectRatio(geometry.aspectRatio);
      return undefined;
    }

    let cancelled = false;
    const image = new window.Image();
    image.decoding = 'async';

    image.onload = () => {
      if (cancelled) return;
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (!width || !height) {
        setRenderAspectRatio(geometry.aspectRatio);
        return;
      }
      setRenderAspectRatio(width / height);
    };

    image.onerror = () => {
      if (cancelled) return;
      setRenderAspectRatio(geometry.aspectRatio);
    };

    image.src = shellSrc;

    return () => {
      cancelled = true;
    };
  }, [geometry.aspectRatio, shellSrc]);

  useEffect(() => syncRenderAspectRatio(), [syncRenderAspectRatio]);

  const rotationDeg = configuration._meta?.rotation ?? 0;
  const rotationRad = (rotationDeg * Math.PI) / 180;
  // If rotated 90/270, the visual bounding box is tall.
  // To minimize clipping in square containers (like cart), we scale down if needed.
  // Simple heuristic: if rotated near 90deg, scale by aspect ratio inverse if it's > 1.
  const isLandscape = renderAspectRatio > 1;
  const isRotatedSide = Math.abs(rotationDeg) % 180 !== 0;
  const scale = isRotatedSide && isLandscape ? 1 / renderAspectRatio : 1;

  return (
    <div
      className={`${sizeClass}${size === 'fill' ? '' : ''}`}
      style={size === 'fill'
        ? {
          transform: `rotate(${rotationDeg}deg) scale(${scale})`,
          transformOrigin: 'center center',
        }
        : {
          aspectRatio: String(renderAspectRatio),
          transform: `rotate(${rotationDeg}deg) scale(${scale})`,
          transformOrigin: 'center center',
        }
      }
    >
      <div className="relative h-full w-full overflow-visible rounded-xl border border-[#0f2c5a]/20 bg-[radial-gradient(145%_125%_at_50%_0%,#2c75d8_0%,#12335f_40%,#081427_100%)]">
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          {shellSrc ? (
            <Image
              src={shellSrc}
              alt={`${resolvedModelCode} keypad shell preview`.replace(/\s+/g, ' ').trim()}
              fill
              className="object-contain"
              sizes={size === 'lg' ? '320px' : '120px'}
            />
          ) : (
            <div className="absolute inset-0 bg-[#040d1f]" />
          )}
        </div>

        {slotIds.map((slotId) => {
          const slot = configuration[slotId];
          const iconId = slot?.iconId ?? null;
          const icon = iconId ? iconLookup.get(iconId) : undefined;
          const matteAssetPath = resolveMatteAssetPath(iconId, icon);
          const matteSrc = matteAssetPath ? assetUrl(matteAssetPath) : '';
          const ringColor = resolveRingColor(slot?.color ?? null);

          const slotGeometry = geometry.slots[slotId];
          if (!slotGeometry) return null;

          const ringDiameter = geometry.buttonVisual.ringDiameterPctOfSlot;
          const iconDiameter = geometry.buttonVisual.iconDiameterPctOfSlot;
          const thumbnailGlowBlurPx = Math.max(
            2.5,
            CONFIGURATOR_THEME.glow.haloStdDeviation * 0.5,
          );
          const thumbnailGlowAlpha = Math.max(0.18, CONFIGURATOR_THEME.glow.thumbnailAlpha);
          const style: CSSProperties = {
            left: `${slotGeometry.cx * 100}%`,
            top: `${slotGeometry.cy * 100}%`,
            width: `${slotGeometry.r * 200}%`,
            height: `${slotGeometry.r * 200}%`,
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
                  {slotGeometry.label}
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
                    background: `radial-gradient(circle, transparent 51%, ${hexToRgba(ringColor, 0.30)} 63%, ${hexToRgba(ringColor, 0.06)} 74%, transparent 84%)`,
                    filter: `blur(${thumbnailGlowBlurPx}px)`,
                    opacity: thumbnailGlowAlpha,
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
                      alt={
                        iconId
                          ? `${resolvedModelCode} ${slotGeometry.label} keypad icon ${iconId}`.replace(/\s+/g, ' ').trim()
                          : `${resolvedModelCode} configured keypad icon`.replace(/\s+/g, ' ').trim()
                      }
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
