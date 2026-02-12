'use client';

import { useEffect, useId, useMemo, useState } from 'react';
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
  ringRadius: number;
  ringStroke: number;
  blurStdDeviation: number;
};

const DEFAULT_ICON_SCALE = 0.94;
const MAX_EFFECTIVE_ICON_SCALE = 1.26;

const MODEL_FALLBACK_SIZES: Record<string, IntrinsicSize> = {
  [PKP_2200_SI_GEOMETRY.modelCode]: PKP_2200_SI_GEOMETRY.intrinsicSize,
};

const MODEL_GEOMETRIES: Record<string, KeypadModelGeometry> = {
  [PKP_2200_SI_GEOMETRY.modelCode]: PKP_2200_SI_GEOMETRY,
};

function resolveModelGeometry(modelCode: string) {
  return MODEL_GEOMETRIES[modelCode] ?? PKP_2200_SI_GEOMETRY;
}

function analyzeAssetVisibleRatio(image: HTMLImageElement) {
  const width = image.naturalWidth || 0;
  const height = image.naturalHeight || 0;
  if (width <= 0 || height <= 0 || typeof document === 'undefined') return 1;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 1;

  ctx.drawImage(image, 0, 0, width, height);

  let pixels: ImageData;
  try {
    pixels = ctx.getImageData(0, 0, width, height);
  } catch {
    return 1;
  }

  const data = pixels.data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[((y * width) + x) * 4 + 3];
      if (alpha <= 8) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0 || maxY < 0) return 1;
  const bboxW = maxX - minX + 1;
  const bboxH = maxY - minY + 1;
  const ratio = Math.max(bboxW / width, bboxH / height);
  if (!Number.isFinite(ratio) || ratio <= 0) return 1;
  return Math.max(0.1, Math.min(1, ratio));
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

  return {
    label: slot.label,
    cx,
    cy,
    sizePx,
    slotX: cx - (sizePx / 2),
    slotY: cy - (sizePx / 2),
    clipRadius: sizePx * 0.47,
    ringRadius: sizePx * 0.48,
    ringStroke: sizePx * 0.1,
    blurStdDeviation: sizePx * 0.08,
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
  iconScale = DEFAULT_ICON_SCALE,
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
  iconScale?: number;
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
  const [matteVisibleRatioBySrc, setMatteVisibleRatioBySrc] = useState<Record<string, number>>({});
  const [hoveredSlotId, setHoveredSlotId] = useState<SlotId | null>(null);

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
  const matteSources = useMemo(
    () => SLOT_IDS
      .map((slotId) => {
        const matteAssetPath = slots[slotId]?.matteAssetPath;
        return matteAssetPath ? assetUrl(matteAssetPath) : '';
      })
      .filter(Boolean),
    [slots],
  );

  useEffect(() => {
    if (activeSlotId != null) {
      setHoveredSlotId(null);
    }
  }, [activeSlotId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pendingSources = Array.from(new Set(matteSources))
      .filter((src) => matteVisibleRatioBySrc[src] == null);
    if (pendingSources.length === 0) return;

    let cancelled = false;

    const measureSource = (src: string) => new Promise<{ src: string; ratio: number }>((resolve) => {
      const image = new window.Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';
      image.onload = () => {
        resolve({ src, ratio: analyzeAssetVisibleRatio(image) });
      };
      image.onerror = () => {
        resolve({ src, ratio: 1 });
      };
      image.src = src;
    });

    void Promise.all(pendingSources.map((src) => measureSource(src))).then((results) => {
      if (cancelled) return;
      setMatteVisibleRatioBySrc((previous) => {
        const next = { ...previous };
        for (const result of results) {
          next[result.src] = result.ratio;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [matteSources, matteVisibleRatioBySrc]);

  const slotCoordMode = modelGeometry.slotCoordMode;
  const slotMetrics = useMemo(
    () => SLOT_IDS.map((slotId) => ({
      slotId,
      metrics: buildSlotMetrics(modelGeometry.slots[slotId], baseW, baseH, slotCoordMode),
    })),
    [baseH, baseW, modelGeometry.slots, slotCoordMode],
  );
  const svgIdPrefix = useId();
  const safeSvgIdPrefix = useMemo(() => sanitizeSvgId(svgIdPrefix), [svgIdPrefix]);
  const groupTransform = rotationDeg ? `rotate(${rotationDeg} ${baseW / 2} ${baseH / 2})` : undefined;
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
        <div className="w-[clamp(320px,60vw,900px)] max-w-full overflow-hidden rounded-[28px] border border-white/20 bg-[#010714]">
          {shellSrc ? (
            <div className="w-full p-[7%]">
              <svg
                className="w-full h-auto"
                viewBox={`0 0 ${baseW} ${baseH}`}
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

                {slotMetrics.map(({ slotId, metrics }) => (
                  <filter
                    key={`${slotId}-glow`}
                    id={`${safeSvgIdPrefix}-glow-${slotId}`}
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feGaussianBlur stdDeviation={metrics.blurStdDeviation} result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}

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

              <g transform={groupTransform}>
                <image href={shellSrc} x={0} y={0} width={baseW} height={baseH} preserveAspectRatio="xMidYMid meet" />

                {slotMetrics.map(({ slotId, metrics }) => {
                  const slot = slots[slotId];
                  const matteSrc = slot.matteAssetPath ? assetUrl(slot.matteAssetPath) : '';
                  const isEmptySlot = !matteSrc;
                  const showHoverPrompt = isEmptySlot && hoveredSlotId === slotId && activeSlotId == null;
                  const hoverPromptWidth = Math.max(132, metrics.sizePx * 1.34);
                  const hoverPromptHeight = Math.max(40, metrics.sizePx * 0.42);
                  const isTopSlot = metrics.cy <= baseH / 2;
                  const arrowLineHalf = Math.max(6, hoverPromptHeight * 0.18);
                  const arrowHead = Math.max(3, hoverPromptHeight * 0.1);
                  const matteVisibleRatio = matteSrc ? (matteVisibleRatioBySrc[matteSrc] ?? 1) : 1;
                  const normalizedVisibleRatio = Math.max(0.1, Math.min(1, matteVisibleRatio));
                  const effectiveIconScale = Math.min(MAX_EFFECTIVE_ICON_SCALE, iconScale / normalizedVisibleRatio);
                  const iconSize = metrics.sizePx * effectiveIconScale;
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

                      <circle
                        cx={metrics.cx}
                        cy={metrics.cy}
                        r={metrics.ringRadius}
                        fill="none"
                        stroke="rgba(178,188,206,0.58)"
                        strokeWidth={Math.max(1, metrics.sizePx * 0.07)}
                      />

                      {ringColor && showGlows ? (
                        <circle
                          cx={metrics.cx}
                          cy={metrics.cy}
                          r={metrics.ringRadius}
                          stroke={ringColor}
                          strokeWidth={metrics.ringStroke}
                          fill="none"
                          opacity={0.9}
                          filter={`url(#${safeSvgIdPrefix}-glow-${slotId})`}
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

                      {showHoverPrompt ? (
                        <g pointerEvents="none" filter={`url(#${safeSvgIdPrefix}-hover-glass)`}>
                          <rect
                            x={metrics.cx - (hoverPromptWidth / 2)}
                            y={metrics.cy - (hoverPromptHeight / 2)}
                            width={hoverPromptWidth}
                            height={hoverPromptHeight}
                            rx={hoverPromptHeight / 2}
                            fill={`url(#${safeSvgIdPrefix}-hover-gradient)`}
                            stroke="rgba(190,211,245,0.38)"
                            strokeWidth={Math.max(1, metrics.sizePx * 0.012)}
                          />
                          <rect
                            x={metrics.cx - ((hoverPromptWidth - 6) / 2)}
                            y={metrics.cy - (hoverPromptHeight / 2) + 3}
                            width={hoverPromptWidth - 6}
                            height={Math.max(10, hoverPromptHeight * 0.46)}
                            rx={(hoverPromptHeight - 6) / 2}
                            fill="rgba(255,255,255,0.08)"
                          />
                          <line
                            x1={metrics.cx}
                            x2={metrics.cx}
                            y1={metrics.cy - (isTopSlot ? arrowLineHalf : -arrowLineHalf)}
                            y2={metrics.cy + (isTopSlot ? arrowLineHalf : -arrowLineHalf)}
                            stroke="rgba(230,240,255,0.92)"
                            strokeWidth={Math.max(1, metrics.sizePx * 0.016)}
                            strokeLinecap="round"
                          />
                          <polygon
                            points={isTopSlot
                              ? `${metrics.cx - arrowHead},${metrics.cy + arrowLineHalf - arrowHead} ${metrics.cx + arrowHead},${metrics.cy + arrowLineHalf - arrowHead} ${metrics.cx},${metrics.cy + arrowLineHalf + arrowHead}`
                              : `${metrics.cx - arrowHead},${metrics.cy - arrowLineHalf + arrowHead} ${metrics.cx + arrowHead},${metrics.cy - arrowLineHalf + arrowHead} ${metrics.cx},${metrics.cy - arrowLineHalf - arrowHead}`}
                            fill="rgba(230,240,255,0.92)"
                          />
                          <text
                            x={metrics.cx}
                            y={isTopSlot
                              ? metrics.cy - Math.max(6, hoverPromptHeight * 0.18)
                              : metrics.cy + Math.max(8, hoverPromptHeight * 0.24)}
                            textAnchor="middle"
                            fontSize={Math.max(12, metrics.sizePx * 0.15)}
                            fontWeight={600}
                            letterSpacing={0.2}
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
                            r={metrics.sizePx / 2}
                            fill="none"
                            stroke="#ff3b30"
                            strokeWidth={Math.max(1, metrics.sizePx * 0.01)}
                          />
                        </>
                      ) : null}
                    </g>
                  );
                })}
              </g>
              </svg>
            </div>
          ) : (
            <div
              className="grid w-full place-items-center text-sm font-semibold text-blue-100/80"
              style={{ aspectRatio: `${baseW} / ${baseH}` }}
            >
              Shell render pending
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-1 text-xs text-blue-100/78">
        <p>Select a button insert for each slot, then pick a ring glow color to preview your final keypad layout.</p>
        {descriptionText ? <p className="text-blue-100/65">{descriptionText}</p> : null}
      </div>
    </div>
  );
}
