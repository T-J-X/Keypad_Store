'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  type KeypadModelGeometry,
  PKP_2200_SI_GEOMETRY,
  type SlotCoordMode,
  type SlotGeometry,
} from '../../config/layouts/geometry';
import type { SlotVisualState } from '../../lib/configuratorStore';
import { SLOT_IDS, type SlotId } from '../../lib/keypadConfiguration';
import { assetUrl } from '../../lib/vendure';

type IntrinsicSize = {
  width: number;
  height: number;
};

type SvgSlotMetrics = {
  label: string;
  cx: number;
  cy: number;
  sizePx: number;
  slotX: number;
  slotY: number;
  clipRadius: number;
  insertDiameterPx: number;
  buttonDiameterPx: number;
  buttonRadiusPx: number;
  rOuter: number;
  rInner: number;
};

const INSERT_TARGET_DIAMETER_MULTIPLIER = 2.06;
const ROTATION_ANIMATION_MS = 360;
const BUTTON_DIAMETER_MULT = 1.45;
const BEZEL_OUTER = 0.94;
const BEZEL_INNER = 0.8;
const RING_BLOOM_BLUR_FACTOR = 0.018;
const RING_BLOOM_OPACITY = 0.35;

const MODEL_FALLBACK_SIZES: Record<string, IntrinsicSize> = {
  [PKP_2200_SI_GEOMETRY.modelCode]: PKP_2200_SI_GEOMETRY.intrinsicSize,
};

const MODEL_GEOMETRIES: Record<string, KeypadModelGeometry> = {
  [PKP_2200_SI_GEOMETRY.modelCode]: PKP_2200_SI_GEOMETRY,
};

function resolveModelGeometry(modelCode: string) {
  return MODEL_GEOMETRIES[modelCode] ?? PKP_2200_SI_GEOMETRY;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function parseHexColor(input: string): [number, number, number] | null {
  const normalized = input.trim();
  if (!normalized.startsWith('#')) return null;
  const hex = normalized.slice(1);

  if (hex.length === 3) {
    const r = Number.parseInt(hex[0] + hex[0], 16);
    const g = Number.parseInt(hex[1] + hex[1], 16);
    const b = Number.parseInt(hex[2] + hex[2], 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return [r, g, b];
  }

  if (hex.length === 6) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return [r, g, b];
  }

  return null;
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (channel: number) => Math.round(channel).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixColor(base: string, target: string, t: number) {
  const baseRgb = parseHexColor(base);
  const targetRgb = parseHexColor(target);
  if (!baseRgb || !targetRgb) return base;

  const weight = clamp01(t);
  const [br, bg, bb] = baseRgb;
  const [tr, tg, tb] = targetRgb;

  return rgbToHex(
    br + ((tr - br) * weight),
    bg + ((tg - bg) * weight),
    bb + ((tb - bb) * weight),
  );
}

function donutPath(cx: number, cy: number, ro: number, ri: number) {
  return `
    M ${cx} ${cy - ro}
    A ${ro} ${ro} 0 1 1 ${cx} ${cy + ro}
    A ${ro} ${ro} 0 1 1 ${cx} ${cy - ro}
    M ${cx} ${cy - ri}
    A ${ri} ${ri} 0 1 0 ${cx} ${cy + ri}
    A ${ri} ${ri} 0 1 0 ${cx} ${cy - ri}
    Z
  `;
}

function buildSlotMetrics(
  slot: SlotGeometry,
  baseW: number,
  baseH: number,
  defaultCoordMode: SlotCoordMode,
): SvgSlotMetrics {
  const coordMode = slot.coordMode ?? defaultCoordMode;
  const sizePct = Number.isFinite(slot.sizePct) ? slot.sizePct : slot.r * 200;
  const sizePx = (sizePct / 100) * baseW;

  const leftPct = Number.isFinite(slot.leftPct)
    ? slot.leftPct
    : coordMode === 'topLeft'
      ? (slot.cx - slot.r) * 100
      : slot.cx * 100;
  const topPct = Number.isFinite(slot.topPct)
    ? slot.topPct
    : coordMode === 'topLeft'
      ? (slot.cy - slot.r) * 100
      : slot.cy * 100;

  let cx = (leftPct / 100) * baseW;
  let cy = (topPct / 100) * baseH;

  if (coordMode === 'topLeft') {
    cx += sizePx / 2;
    cy += sizePx / 2;
  }

  const insertDiameterPx = sizePx;
  const buttonDiameterPx = insertDiameterPx * BUTTON_DIAMETER_MULT;
  const buttonRadiusPx = buttonDiameterPx / 2;
  const rOuter = buttonRadiusPx * BEZEL_OUTER;
  const rInner = buttonRadiusPx * BEZEL_INNER;

  return {
    label: slot.label,
    cx,
    cy,
    sizePx,
    slotX: cx - (sizePx / 2),
    slotY: cy - (sizePx / 2),
    clipRadius: sizePx * 0.47,
    insertDiameterPx,
    buttonDiameterPx,
    buttonRadiusPx,
    rOuter,
    rInner,
  };
}

function sanitizeSvgId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

export default function KeypadPreview({
  modelCode = PKP_2200_SI_GEOMETRY.modelCode,
  shellAssetPath,
  slots,
  activeSlotId,
  onSlotClick,
  rotationDeg = 0,
  debugSlots = false,
  descriptionText,
  showGlows = true,
  onRotate,
  onToggleGlows,
}: {
  modelCode?: string;
  shellAssetPath?: string | null;
  slots: Record<SlotId, SlotVisualState>;
  activeSlotId: SlotId | null;
  onSlotClick: (slotId: SlotId) => void;
  rotationDeg?: number;
  debugSlots?: boolean;
  descriptionText?: string | null;
  showGlows?: boolean;
  onRotate?: () => void;
  onToggleGlows?: () => void;
}) {
  const modelGeometry = useMemo(() => resolveModelGeometry(modelCode), [modelCode]);
  const shellSrc = shellAssetPath ? assetUrl(shellAssetPath) : '';
  const fallbackSize = useMemo(
    () => MODEL_FALLBACK_SIZES[modelGeometry.modelCode] ?? modelGeometry.intrinsicSize,
    [modelGeometry],
  );
  const [baseSize, setBaseSize] = useState<IntrinsicSize>(fallbackSize);
  const [hoveredSlotId, setHoveredSlotId] = useState<SlotId | null>(null);
  const [displayRotationDeg, setDisplayRotationDeg] = useState(rotationDeg);
  const displayRotationRef = useRef(rotationDeg);
  const rotationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setBaseSize((previous) => {
      if (previous.width === fallbackSize.width && previous.height === fallbackSize.height) return previous;
      return fallbackSize;
    });
  }, [fallbackSize]);

  useEffect(() => {
    if (!shellSrc) {
      setBaseSize((previous) => {
        if (previous.width === fallbackSize.width && previous.height === fallbackSize.height) return previous;
        return fallbackSize;
      });
      return;
    }
    if (typeof window === 'undefined') return;

    let cancelled = false;
    const image = new window.Image();
    image.decoding = 'async';
    image.onload = () => {
      if (cancelled) return;
      const width = image.naturalWidth || fallbackSize.width;
      const height = image.naturalHeight || fallbackSize.height;

      setBaseSize((previous) => {
        if (previous.width === width && previous.height === height) return previous;
        return { width, height };
      });
    };
    image.onerror = () => {
      if (cancelled) return;
      setBaseSize((previous) => {
        if (previous.width === fallbackSize.width && previous.height === fallbackSize.height) return previous;
        return fallbackSize;
      });
    };
    image.src = shellSrc;

    return () => {
      cancelled = true;
    };
  }, [fallbackSize, shellSrc]);

  const baseW = Math.max(baseSize.width, 1);
  const baseH = Math.max(baseSize.height, 1);
  const canvasSize = Math.max(baseW, baseH);
  const canvasOffsetX = (canvasSize - baseW) / 2;
  const canvasOffsetY = (canvasSize - baseH) / 2;

  useEffect(() => {
    if (activeSlotId != null) {
      setHoveredSlotId(null);
    }
  }, [activeSlotId]);

  useEffect(() => {
    displayRotationRef.current = displayRotationDeg;
  }, [displayRotationDeg]);

  useEffect(() => {
    if (Math.abs(displayRotationRef.current - rotationDeg) < 0.001) return;
    if (typeof window === 'undefined') {
      setDisplayRotationDeg(rotationDeg);
      return;
    }

    if (rotationFrameRef.current != null) {
      window.cancelAnimationFrame(rotationFrameRef.current);
      rotationFrameRef.current = null;
    }

    const startRotation = displayRotationRef.current;
    const delta = rotationDeg - startRotation;
    const startTime = window.performance.now();

    const easeInOutCubic = (progress: number) => {
      if (progress < 0.5) return 4 * progress * progress * progress;
      return 1 - Math.pow(-2 * progress + 2, 3) / 2;
    };

    const tick = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.max(0, Math.min(1, elapsed / ROTATION_ANIMATION_MS));
      const eased = easeInOutCubic(progress);
      const nextRotation = startRotation + (delta * eased);
      setDisplayRotationDeg(nextRotation);

      if (progress < 1) {
        rotationFrameRef.current = window.requestAnimationFrame(tick);
      } else {
        setDisplayRotationDeg(rotationDeg);
        rotationFrameRef.current = null;
      }
    };

    rotationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rotationFrameRef.current != null) {
        window.cancelAnimationFrame(rotationFrameRef.current);
        rotationFrameRef.current = null;
      }
    };
  }, [rotationDeg]);

  const slotCoordMode = modelGeometry.slotCoordMode;
  const slotMetrics = useMemo(
    () => SLOT_IDS.map((slotId) => ({
      slotId,
      metrics: buildSlotMetrics(
        modelGeometry.slots[slotId],
        baseW,
        baseH,
        slotCoordMode,
      ),
    })),
    [baseH, baseW, modelGeometry.slots, slotCoordMode],
  );
  const svgIdPrefix = useId();
  const safeSvgIdPrefix = useMemo(() => sanitizeSvgId(svgIdPrefix), [svgIdPrefix]);
  const visualRotationDeg = Math.abs(displayRotationDeg) < 0.001 ? 0 : displayRotationDeg;
  const groupTransform = visualRotationDeg ? `rotate(${visualRotationDeg} ${baseW / 2} ${baseH / 2})` : undefined;
  const shellTranslateTransform = `translate(${canvasOffsetX} ${canvasOffsetY})`;
  const hoverPromptBlur = Math.max(1.2, baseW * 0.0022);
  const hoverPromptShadowOffset = Math.max(1, baseW * 0.0012);

  return (
    <div className="card relative overflow-hidden border border-white/18 bg-[radial-gradient(140%_120%_at_60%_-10%,#2e79dd_0%,#17305f_36%,#0a1429_72%)] p-5 shadow-[0_28px_70px_rgba(2,9,24,0.42)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">Command View</div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">{modelCode} Preview</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRotate}
            className="inline-flex min-h-9 items-center rounded-full border border-white/24 bg-[#0a1b3a]/70 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-100 transition hover:border-white/40 hover:bg-[#12305e]"
          >
            Rotate
          </button>
          <button
            type="button"
            onClick={onToggleGlows}
            className="inline-flex min-h-9 items-center rounded-full border border-white/24 bg-[#0a1b3a]/70 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-100 transition hover:border-white/40 hover:bg-[#12305e]"
          >
            {showGlows ? 'Glows on' : 'Glows off'}
          </button>
          <div className="rounded-full border border-white/20 bg-[#06122a]/65 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-blue-100">
            2x2
          </div>
        </div>
      </div>

      <div className="flex w-full justify-center">
        <div className="h-auto w-[clamp(360px,64vw,920px)] max-w-full aspect-square overflow-hidden rounded-[28px] border border-white/20 bg-[#010714]">
          {shellSrc ? (
            <div className="h-full w-full p-[7%]">
              <svg
                className="h-full w-full"
                viewBox={`0 0 ${canvasSize} ${canvasSize}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={`${modelCode} shell preview`}
              >
              <defs>
                {slotMetrics.map(({ slotId, metrics }) => (
                  <clipPath key={`${slotId}-clip`} id={`${safeSvgIdPrefix}-clip-${slotId}`}>
                    <circle cx={metrics.cx} cy={metrics.cy} r={metrics.clipRadius} />
                  </clipPath>
                ))}

                {slotMetrics.map(({ slotId, metrics }) => {
                  const ringColor = slots[slotId]?.color;
                  if (!ringColor) return null;

                  return (
                    <linearGradient
                      key={`${slotId}-ring-grad`}
                      id={`${safeSvgIdPrefix}-ringGrad-${slotId}`}
                      gradientUnits="userSpaceOnUse"
                      x1={metrics.cx - metrics.rOuter}
                      y1={metrics.cy - metrics.rOuter}
                      x2={metrics.cx + metrics.rOuter}
                      y2={metrics.cy + metrics.rOuter}
                    >
                      <stop offset="0%" stopColor={mixColor(ringColor, '#ffffff', 0.28)} stopOpacity={0.95} />
                      <stop offset="45%" stopColor={ringColor} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={mixColor(ringColor, '#000000', 0.22)} stopOpacity={0.85} />
                    </linearGradient>
                  );
                })}

                {slotMetrics.map(({ slotId, metrics }) => {
                  const ringColor = slots[slotId]?.color;
                  if (!ringColor) return null;

                  return (
                    <filter
                      key={`${slotId}-ring-bloom`}
                      id={`${safeSvgIdPrefix}-ringBloom-${slotId}`}
                      filterUnits="userSpaceOnUse"
                      x={metrics.cx - metrics.buttonDiameterPx}
                      y={metrics.cy - metrics.buttonDiameterPx}
                      width={metrics.buttonDiameterPx * 2}
                      height={metrics.buttonDiameterPx * 2}
                    >
                      <feGaussianBlur stdDeviation={metrics.buttonDiameterPx * RING_BLOOM_BLUR_FACTOR} result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  );
                })}

                <linearGradient id={`${safeSvgIdPrefix}-hover-gradient`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#203257" stopOpacity={0.72} />
                  <stop offset="55%" stopColor="#101b34" stopOpacity={0.84} />
                  <stop offset="100%" stopColor="#090f1e" stopOpacity={0.92} />
                </linearGradient>

                <filter
                  id={`${safeSvgIdPrefix}-hover-glass`}
                  x="-50%"
                  y="-90%"
                  width="200%"
                  height="280%"
                >
                  <feGaussianBlur in="SourceAlpha" stdDeviation={hoverPromptBlur} result="shadowBlur" />
                  <feOffset in="shadowBlur" dy={hoverPromptShadowOffset} result="shadowOffset" />
                  <feColorMatrix
                    in="shadowOffset"
                    type="matrix"
                    values="0 0 0 0 0.03 0 0 0 0 0.07 0 0 0 0 0.14 0 0 0 0.72 0"
                    result="shadowColor"
                  />
                  <feMerge>
                    <feMergeNode in="shadowColor" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g transform={shellTranslateTransform}>
                <g transform={groupTransform}>
                <image href={shellSrc} x={0} y={0} width={baseW} height={baseH} preserveAspectRatio="xMidYMid meet" />

                {slotMetrics.map(({ slotId, metrics }) => {
                  const slot = slots[slotId];
                  const matteSrc = slot.matteAssetPath ? assetUrl(slot.matteAssetPath) : '';
                  const isEmptySlot = !matteSrc;
                  const showHoverPrompt = isEmptySlot && hoveredSlotId === slotId && activeSlotId == null;
                  const hoverPromptWidth = Math.max(166, metrics.sizePx * 1.72);
                  const hoverPromptHeight = Math.max(56, metrics.sizePx * 0.74);
                  const hoverPromptRadius = Math.max(14, hoverPromptHeight * 0.28);
                  const isTopSlot = metrics.cy <= baseH / 2;
                  const arrowWidth = Math.max(12, hoverPromptHeight * 0.3);
                  const arrowHeight = Math.max(8, hoverPromptHeight * 0.22);
                  const slotOffset = Math.max(10, metrics.sizePx * 0.16);
                  const hoverPromptX = metrics.cx - (hoverPromptWidth / 2);
                  const hoverPromptY = isTopSlot
                    ? metrics.cy + (metrics.sizePx / 2) + slotOffset
                    : metrics.cy - (metrics.sizePx / 2) - slotOffset - hoverPromptHeight;
                  const arrowCenterX = hoverPromptX + (hoverPromptWidth / 2);
                  const textCenterX = hoverPromptX + (hoverPromptWidth / 2);
                  const textBaselineY = hoverPromptY + (hoverPromptHeight / 2) + Math.max(4, hoverPromptHeight * 0.08);
                  const iconSize = metrics.clipRadius * INSERT_TARGET_DIAMETER_MULTIPLIER;
                  const iconX = metrics.cx - (iconSize / 2);
                  const iconY = metrics.cy - (iconSize / 2);
                  const ringColor = slot.color;
                  const isActive = slotId === activeSlotId;

                  return (
                    <g
                      key={slotId}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      aria-label={`Configure ${metrics.label}`}
                      onMouseEnter={() => {
                        setHoveredSlotId(slotId);
                      }}
                      onMouseLeave={() => {
                        if (hoveredSlotId === slotId) {
                          setHoveredSlotId(null);
                        }
                      }}
                      onFocus={() => {
                        setHoveredSlotId(slotId);
                      }}
                      onBlur={() => {
                        if (hoveredSlotId === slotId) {
                          setHoveredSlotId(null);
                        }
                      }}
                      onClick={() => onSlotClick(slotId)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSlotClick(slotId);
                        }
                      }}
                    >
                      <circle cx={metrics.cx} cy={metrics.cy} r={metrics.sizePx / 2} fill="transparent" />

                      {isActive ? (
                        <circle
                          cx={metrics.cx}
                          cy={metrics.cy}
                          r={metrics.sizePx * 0.55}
                          fill="rgba(255,255,255,0.04)"
                          stroke="rgba(170,189,216,0.45)"
                          strokeWidth={Math.max(1, metrics.sizePx * 0.016)}
                        />
                      ) : null}

                      {matteSrc ? (
                        <image
                          href={matteSrc}
                          x={iconX}
                          y={iconY}
                          width={iconSize}
                          height={iconSize}
                          preserveAspectRatio="xMidYMid meet"
                          transform={visualRotationDeg ? `rotate(${-visualRotationDeg} ${metrics.cx} ${metrics.cy})` : undefined}
                          clipPath={`url(#${safeSvgIdPrefix}-clip-${slotId})`}
                        />
                      ) : showHoverPrompt ? null : (
                        <>
                          <circle
                            cx={metrics.cx}
                            cy={metrics.cy}
                            r={metrics.clipRadius}
                            fill="rgba(255,255,255,0.04)"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth={Math.max(1, metrics.sizePx * 0.01)}
                          />
                          <text
                            x={metrics.cx}
                            y={metrics.cy + Math.max(7, metrics.sizePx * 0.08)}
                            textAnchor="middle"
                            fontSize={Math.max(18, metrics.sizePx * 0.36)}
                            fontWeight={600}
                            fill="rgba(255,255,255,0.65)"
                          >
                            +
                          </text>
                        </>
                      )}

                      {ringColor && showGlows ? (
                        <>
                          <path
                            d={donutPath(metrics.cx, metrics.cy, metrics.rOuter, metrics.rInner)}
                            fill={ringColor}
                            fillRule="evenodd"
                            opacity={RING_BLOOM_OPACITY}
                            filter={`url(#${safeSvgIdPrefix}-ringBloom-${slotId})`}
                            style={{ mixBlendMode: 'screen' }}
                          />
                          <path
                            d={donutPath(metrics.cx, metrics.cy, metrics.rOuter, metrics.rInner)}
                            fill={`url(#${safeSvgIdPrefix}-ringGrad-${slotId})`}
                            fillRule="evenodd"
                            opacity={0.92}
                            style={{ mixBlendMode: 'screen' }}
                          />
                        </>
                      ) : null}

                      {showHoverPrompt ? (
                        <g pointerEvents="none" filter={`url(#${safeSvgIdPrefix}-hover-glass)`}>
                          <rect
                            x={hoverPromptX}
                            y={hoverPromptY}
                            width={hoverPromptWidth}
                            height={hoverPromptHeight}
                            rx={hoverPromptRadius}
                            fill={`url(#${safeSvgIdPrefix}-hover-gradient)`}
                            stroke="rgba(190,211,245,0.38)"
                            strokeWidth={Math.max(1, metrics.sizePx * 0.012)}
                          />
                          <rect
                            x={hoverPromptX + 3}
                            y={hoverPromptY + 3}
                            width={hoverPromptWidth - 6}
                            height={Math.max(16, hoverPromptHeight * 0.46)}
                            rx={Math.max(10, hoverPromptRadius - 3)}
                            fill="rgba(255,255,255,0.08)"
                          />
                          <polygon
                            points={isTopSlot
                              ? `${arrowCenterX - (arrowWidth / 2)},${hoverPromptY} ${arrowCenterX + (arrowWidth / 2)},${hoverPromptY} ${metrics.cx},${hoverPromptY - arrowHeight}`
                              : `${arrowCenterX - (arrowWidth / 2)},${hoverPromptY + hoverPromptHeight} ${arrowCenterX + (arrowWidth / 2)},${hoverPromptY + hoverPromptHeight} ${metrics.cx},${hoverPromptY + hoverPromptHeight + arrowHeight}`}
                            fill={`url(#${safeSvgIdPrefix}-hover-gradient)`}
                            stroke="rgba(190,211,245,0.38)"
                            strokeWidth={Math.max(1, metrics.sizePx * 0.012)}
                            strokeLinejoin="round"
                          />
                          <text
                            x={textCenterX}
                            y={textBaselineY}
                            textAnchor="middle"
                            fontSize={Math.max(11, metrics.sizePx * 0.13)}
                            fontWeight={600}
                            letterSpacing={0.15}
                            fill="rgba(230,240,255,0.95)"
                          >
                            Choose a button insert
                          </text>
                        </g>
                      ) : null}

                      {debugSlots ? (
                        <>
                          <circle cx={metrics.cx} cy={metrics.cy} r={Math.max(2, metrics.sizePx * 0.03)} fill="#ff3b30" />
                          <circle
                            cx={metrics.cx}
                            cy={metrics.cy}
                            r={metrics.insertDiameterPx / 2}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={Math.max(1, metrics.sizePx * 0.008)}
                          />
                          <circle
                            cx={metrics.cx}
                            cy={metrics.cy}
                            r={metrics.rOuter}
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth={Math.max(1, metrics.sizePx * 0.008)}
                          />
                          <circle
                            cx={metrics.cx}
                            cy={metrics.cy}
                            r={metrics.rInner}
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth={Math.max(1, metrics.sizePx * 0.008)}
                          />
                        </>
                      ) : null}
                    </g>
                  );
                })}
                </g>
              </g>
              </svg>
            </div>
          ) : (
            <div
              className="grid h-full w-full place-items-center text-sm font-semibold text-blue-100/80"
            >
              Shell render pending
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-1 text-xs text-white/90">
        <p className="text-[#f0f7ff]">Select a button insert for each slot, then pick a ring glow color to preview your final keypad layout.</p>
        {descriptionText ? <p className="text-[#d7e8ff]/90">{descriptionText}</p> : null}
      </div>
    </div>
  );
}
