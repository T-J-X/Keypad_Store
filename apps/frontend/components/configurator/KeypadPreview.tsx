'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { SlotVisualState } from '../../lib/configuratorStore';
import type { SlotId } from '../../lib/keypadConfiguration';
import {
  cloneModelLayout,
  getLayoutForModel,
  getSlotIdsForLayout,
  type ModelLayout,
  type Slot,
} from '../../lib/keypad-layouts';
import { assetUrl } from '../../lib/vendure';
import BacklitGlow from './BacklitGlow';

const ROTATION_ANIMATION_MS = 360;
const WHITE_GLOW_LUMINANCE_THRESHOLD = 0.92;
const DEFAULT_ICON_SCALE = 0.94;
const DEFAULT_ICON_VISIBLE_COMP = 1;
const MIN_ICON_SCALE = 0.4;
const MAX_ICON_SCALE = 1.68;
const MIN_ICON_VISIBLE_COMP = 0.5;
const MAX_ICON_VISIBLE_COMP = 2;
const DEFAULT_ICON_SCALE_NUDGE = 0.01;
const FAST_ICON_SCALE_NUDGE = 0.05;
const DEFAULT_POSITION_NUDGE_PX = 1;
const FAST_POSITION_NUDGE_PX = 10;
const DEFAULT_DIAMETER_NUDGE_PX = 1;
const FAST_DIAMETER_NUDGE_PX = 10;
const MIN_SLOT_DIAMETER_PX = 4;
const SLOT_SELECT_KEYS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '0',
  'q',
  'w',
  'e',
  'r',
  't',
  'y',
  'u',
  'i',
  'o',
  'p',
  'a',
  's',
  'd',
  'f',
  'g',
  'h',
  'j',
  'k',
  'l',
];

const MODEL_LAYOUT_LABELS: Record<string, string> = {
  'PKP-2200-SI': '2x2',
  'PKP-2300-SI': '2x3',
  'PKP-2400-SI': '2x4',
  'PKP-2500-SI': '2x5',
  'PKP-2600-SI': '2x6',
  'PKP-3500-SI': '3x5',
};

type SlotBinding = {
  key: string;
  slotId: string;
  slotLabel: string;
};

type IntrinsicSize = {
  width: number;
  height: number;
};

const EMPTY_SLOT_VISUAL_STATE: SlotVisualState = {
  iconId: null,
  iconName: null,
  matteAssetPath: null,
  glossyAssetPath: null,
  productId: null,
  variantId: null,
  category: null,
  sizeMm: null,
  color: null,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeIconScale(input: number | undefined) {
  if (!Number.isFinite(input)) return DEFAULT_ICON_SCALE;
  return clamp(input as number, MIN_ICON_SCALE, MAX_ICON_SCALE);
}

function normalizeIconVisibleComp(input: number | undefined) {
  if (!Number.isFinite(input)) return DEFAULT_ICON_VISIBLE_COMP;
  return clamp(input as number, MIN_ICON_VISIBLE_COMP, MAX_ICON_VISIBLE_COMP);
}

function parseHexColor(input: string | null | undefined): [number, number, number] | null {
  if (!input) return null;
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

function colorLuminance(color: string | null | undefined) {
  const rgb = parseHexColor(color);
  if (!rgb) return 0;
  const [r, g, b] = rgb;
  return ((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) / 255;
}

function sanitizeSvgId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

function withUpdatedSlot(
  layout: ModelLayout,
  slotId: string,
  updater: (slotEntry: Slot) => Slot,
): ModelLayout {
  return {
    ...layout,
    slots: layout.slots.map((slotEntry) => (slotEntry.id === slotId ? updater(slotEntry) : slotEntry)),
  };
}

function buildSlotBindings(layout: ModelLayout): SlotBinding[] {
  const slotIds = getSlotIdsForLayout(layout);
  return slotIds.map((slotId, index) => {
    const key = SLOT_SELECT_KEYS[index] ?? '';
    const numeric = slotId.match(/\d+/)?.[0] ?? String(index + 1);
    return {
      key,
      slotId,
      slotLabel: `Slot ${numeric}`,
    };
  });
}

export default function KeypadPreview({
  modelCode = 'PKP-2200-SI',
  shellAssetPath,
  slots,
  activeSlotId,
  onSlotClick,
  rotationDeg = 0,
  iconScale = DEFAULT_ICON_SCALE,
  iconVisibleComp = DEFAULT_ICON_VISIBLE_COMP,
  debugMode = false,
  editMode = false,
  descriptionText,
  showGlows = true,
  onRotate,
  onToggleGlows,
}: {
  modelCode?: string;
  shellAssetPath?: string | null;
  slots: Record<string, SlotVisualState>;
  activeSlotId: SlotId | null;
  onSlotClick: (slotId: SlotId) => void;
  rotationDeg?: number;
  iconScale?: number;
  iconVisibleComp?: number;
  debugMode?: boolean;
  editMode?: boolean;
  descriptionText?: string | null;
  showGlows?: boolean;
  onRotate?: () => void;
  onToggleGlows?: () => void;
}) {
  const baseLayout = useMemo(() => getLayoutForModel(modelCode), [modelCode]);
  const [editableLayout, setEditableLayout] = useState<ModelLayout>(() => cloneModelLayout(baseLayout));
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [showSelectedGuidesOnly, setShowSelectedGuidesOnly] = useState(false);
  const [hoveredSlotId, setHoveredSlotId] = useState<SlotId | null>(null);
  const [displayRotationDeg, setDisplayRotationDeg] = useState(rotationDeg);
  const [editableIconScale, setEditableIconScale] = useState(() => normalizeIconScale(iconScale));
  const [layoutCopyStatus, setLayoutCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [tuningCopyStatus, setTuningCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [shellNaturalSize, setShellNaturalSize] = useState<IntrinsicSize | null>(null);
  const displayRotationRef = useRef(rotationDeg);
  const rotationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setEditableLayout(cloneModelLayout(baseLayout));
  }, [baseLayout]);

  useEffect(() => {
    setEditableIconScale(normalizeIconScale(iconScale));
  }, [baseLayout.model, iconScale]);

  const renderLayout = editMode ? editableLayout : baseLayout;
  const slotIds = useMemo(() => getSlotIdsForLayout(renderLayout), [renderLayout]);
  const iconVisibleCompValue = useMemo(() => normalizeIconVisibleComp(iconVisibleComp), [iconVisibleComp]);
  const iconScaleValue = useMemo(
    () => (editMode ? editableIconScale : normalizeIconScale(iconScale)),
    [editMode, editableIconScale, iconScale],
  );
  const effectiveIconMultiplier = useMemo(
    () => round2(iconScaleValue * iconVisibleCompValue),
    [iconScaleValue, iconVisibleCompValue],
  );
  const slotBindingList = useMemo(() => buildSlotBindings(renderLayout), [renderLayout]);
  const slotIdByKey = useMemo(
    () => slotBindingList.reduce<Record<string, string>>((map, binding) => {
      if (binding.key) {
        map[binding.key] = binding.slotId;
      }
      return map;
    }, {}),
    [slotBindingList],
  );

  useEffect(() => {
    if (!editMode) {
      setSelectedSlotId(null);
      setShowSelectedGuidesOnly(false);
      return;
    }

    setSelectedSlotId((previous) => {
      if (previous && slotIds.includes(previous)) return previous;
      return slotIds[0] ?? null;
    });
  }, [editMode, slotIds]);

  const selectedSlot = useMemo(
    () => (selectedSlotId
      ? (renderLayout.slots.find((slotEntry) => slotEntry.id === selectedSlotId) ?? null)
      : null),
    [renderLayout.slots, selectedSlotId],
  );

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

  useEffect(() => {
    if (!editMode || typeof window === 'undefined') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const lowerKey = event.key.toLowerCase();
      const mappedSlotId = slotIdByKey[lowerKey];
      if (mappedSlotId) {
        event.preventDefault();
        setSelectedSlotId(mappedSlotId);
        return;
      }

      const positionStep = event.shiftKey ? FAST_POSITION_NUDGE_PX : DEFAULT_POSITION_NUDGE_PX;
      const diameterStep = event.shiftKey ? FAST_DIAMETER_NUDGE_PX : DEFAULT_DIAMETER_NUDGE_PX;
      const iconScaleStep = event.shiftKey ? FAST_ICON_SCALE_NUDGE : DEFAULT_ICON_SCALE_NUDGE;

      let dx = 0;
      let dy = 0;
      let dInsert = 0;
      let dBezel = 0;
      let dIconScale = 0;

      switch (event.key) {
        case 'ArrowLeft':
          dx = -positionStep;
          break;
        case 'ArrowRight':
          dx = positionStep;
          break;
        case 'ArrowUp':
          dy = -positionStep;
          break;
        case 'ArrowDown':
          dy = positionStep;
          break;
        case '[':
        case '{':
          dInsert = -diameterStep;
          break;
        case ']':
        case '}':
          dInsert = diameterStep;
          break;
        case '-':
        case '_':
          dBezel = -diameterStep;
          break;
        case '=':
        case '+':
          dBezel = diameterStep;
          break;
        case ',':
        case '<':
          dIconScale = -iconScaleStep;
          break;
        case '.':
        case '>':
          dIconScale = iconScaleStep;
          break;
        default:
          return;
      }

      event.preventDefault();
      if (dIconScale !== 0) {
        setEditableIconScale((previous) => round2(clamp(previous + dIconScale, MIN_ICON_SCALE, MAX_ICON_SCALE)));
        return;
      }

      if (!selectedSlotId) return;

      setEditableLayout((previous) => withUpdatedSlot(previous, selectedSlotId, (slotEntry) => ({
        ...slotEntry,
        cx: round2(slotEntry.cx + dx),
        cy: round2(slotEntry.cy + dy),
        insertD: round2(Math.max(MIN_SLOT_DIAMETER_PX, slotEntry.insertD + dInsert)),
        bezelD: round2(Math.max(MIN_SLOT_DIAMETER_PX, slotEntry.bezelD + dBezel)),
      })));
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [editMode, selectedSlotId, slotIdByKey]);

  useEffect(() => {
    if (layoutCopyStatus === 'idle') return;
    if (typeof window === 'undefined') return;

    const timeoutId = window.setTimeout(() => {
      setLayoutCopyStatus('idle');
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [layoutCopyStatus]);

  useEffect(() => {
    if (tuningCopyStatus === 'idle') return;
    if (typeof window === 'undefined') return;

    const timeoutId = window.setTimeout(() => {
      setTuningCopyStatus('idle');
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [tuningCopyStatus]);

  const onCopyJson = async () => {
    if (!editMode || typeof navigator === 'undefined' || !navigator.clipboard) {
      setLayoutCopyStatus('error');
      return;
    }

    try {
      const normalized: ModelLayout = {
        model: editableLayout.model,
        baseW: editableLayout.baseW,
        baseH: editableLayout.baseH,
        slots: editableLayout.slots.map((slotEntry) => ({
          id: slotEntry.id,
          cx: round2(slotEntry.cx),
          cy: round2(slotEntry.cy),
          insertD: round2(slotEntry.insertD),
          bezelD: round2(slotEntry.bezelD),
        })),
      };

      await navigator.clipboard.writeText(JSON.stringify(normalized, null, 2));
      setLayoutCopyStatus('copied');
    } catch {
      setLayoutCopyStatus('error');
    }
  };

  const onCopyTuningJson = async () => {
    if (!editMode || typeof navigator === 'undefined' || !navigator.clipboard) {
      setTuningCopyStatus('error');
      return;
    }

    try {
      const tuning = {
        model: renderLayout.model,
        iconScale: round2(editableIconScale),
        iconVisibleComp: round2(iconVisibleCompValue),
      };
      await navigator.clipboard.writeText(JSON.stringify(tuning, null, 2));
      setTuningCopyStatus('copied');
    } catch {
      setTuningCopyStatus('error');
    }
  };

  const shellSrc = shellAssetPath ? assetUrl(shellAssetPath) : '';
  const showCalibrationGuides = debugMode || editMode;
  const baseW = Math.max(renderLayout.baseW, 1);
  const baseH = Math.max(renderLayout.baseH, 1);

  // Expand the viewBox so the keypad can rotate without clipping.
  // The bounding circle diagonal is the minimum side that contains every rotation.
  const diagonal = Math.ceil(Math.sqrt(baseW * baseW + baseH * baseH));
  const padX = (diagonal - baseW) / 2;
  const padY = (diagonal - baseH) / 2;
  const vbW = diagonal;
  const vbH = diagonal;

  const hasNaturalSizeMismatch = Boolean(
    shellNaturalSize
    && (shellNaturalSize.width !== baseW || shellNaturalSize.height !== baseH),
  );
  const svgIdPrefix = useId();
  const safeSvgIdPrefix = useMemo(() => sanitizeSvgId(svgIdPrefix), [svgIdPrefix]);
  const visualRotationDeg = Math.abs(displayRotationDeg) < 0.001 ? 0 : displayRotationDeg;
  const groupTransform = [
    `translate(${padX} ${padY})`,
    visualRotationDeg ? `rotate(${visualRotationDeg} ${baseW / 2} ${baseH / 2})` : '',
  ].filter(Boolean).join(' ');
  const layoutLabel = MODEL_LAYOUT_LABELS[renderLayout.model] ?? `${renderLayout.slots.length} slots`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!shellSrc) {
      setShellNaturalSize(null);
      return;
    }

    let cancelled = false;
    const image = new window.Image();
    image.decoding = 'async';
    image.onload = () => {
      if (cancelled) return;
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (!width || !height) {
        setShellNaturalSize(null);
        return;
      }
      setShellNaturalSize((previous) => {
        if (previous?.width === width && previous?.height === height) return previous;
        return { width, height };
      });
    };
    image.onerror = () => {
      if (cancelled) return;
      setShellNaturalSize(null);
    };
    image.src = shellSrc;

    return () => {
      cancelled = true;
    };
  }, [shellSrc]);

  useEffect(() => {
    if (!debugMode || !hasNaturalSizeMismatch || !shellNaturalSize) return;
    console.warn(
      `[KeypadPreview] base size mismatch for ${renderLayout.model}: base=${baseW}x${baseH}, natural=${shellNaturalSize.width}x${shellNaturalSize.height}`,
    );
  }, [baseH, baseW, debugMode, hasNaturalSizeMismatch, renderLayout.model, shellNaturalSize]);

  return (
    <div className="card glow-isolate relative overflow-hidden border border-white/10 bg-deep-navy p-5 shadow-2xl sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">{renderLayout.model} Preview</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRotate}
            className="inline-flex min-h-9 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-100 transition hover:border-white/30 hover:bg-white/10"
          >
            Rotate
          </button>
          <button
            type="button"
            onClick={onToggleGlows}
            className="inline-flex min-h-9 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-100 transition hover:border-white/30 hover:bg-white/10"
          >
            {showGlows ? 'Glows on' : 'Glows off'}
          </button>
          <div className="rounded-full border border-white/20 bg-[#06122a]/65 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-blue-100">
            {layoutLabel}
          </div>
        </div>
      </div>

      {editMode ? (
        <div className="mb-4 rounded-2xl border border-white/20 bg-[#071634]/70 px-4 py-3 text-xs text-blue-100/95">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold uppercase tracking-[0.14em] text-blue-100">Edit mode</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSelectedGuidesOnly((previous) => !previous)}
                className="inline-flex min-h-8 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100 transition hover:border-white/30 hover:bg-white/10"
              >
                {showSelectedGuidesOnly ? 'Guides: selected' : 'Guides: all'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void onCopyJson();
                }}
                className="inline-flex min-h-8 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100 transition hover:border-white/30 hover:bg-white/10"
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  void onCopyTuningJson();
                }}
                className="inline-flex min-h-8 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100 transition hover:border-white/30 hover:bg-white/10"
              >
                Copy Tuning JSON
              </button>
            </div>
          </div>
          <div className="mt-2 text-blue-100/90">
            Selected: {selectedSlotId ?? 'none'} · Move: Arrows {DEFAULT_POSITION_NUDGE_PX}px (Shift {FAST_POSITION_NUDGE_PX}px, Alt {DEFAULT_POSITION_NUDGE_PX}px)
          </div>
          <div className="mt-1 text-blue-100/90">
            {selectedSlot
              ? `cx ${round2(selectedSlot.cx)} · cy ${round2(selectedSlot.cy)} · insertD ${round2(selectedSlot.insertD)} · bezelD ${round2(selectedSlot.bezelD)}`
              : 'Select a slot to see live cx/cy/insertD/bezelD values.'}
          </div>
          <div className="mt-1 text-blue-100/90">
            Insert: [ ] ({DEFAULT_DIAMETER_NUDGE_PX}px, Shift {FAST_DIAMETER_NUDGE_PX}px) · Bezel: - = ({DEFAULT_DIAMETER_NUDGE_PX}px, Shift {FAST_DIAMETER_NUDGE_PX}px)
          </div>
          <div className="mt-1 text-blue-100/80">
            Render: iconScale {round2(iconScaleValue)} · iconVisibleComp {round2(iconVisibleCompValue)} · effective {effectiveIconMultiplier}
          </div>
          <div className="mt-1 text-blue-100/80">
            Scale: , . ({DEFAULT_ICON_SCALE_NUDGE}, Shift {FAST_ICON_SCALE_NUDGE})
          </div>
          <div className="mt-1 text-blue-100/80">
            Keys: {slotBindingList.filter((binding) => binding.key).map((binding) => `${binding.key}=${binding.slotLabel}`).join(' · ')}
          </div>
          {layoutCopyStatus !== 'idle' ? (
            <div className={`mt-1 ${layoutCopyStatus === 'copied' ? 'text-emerald-200' : 'text-rose-200'}`}>
              {layoutCopyStatus === 'copied' ? 'Layout JSON copied to clipboard.' : 'Could not copy layout JSON.'}
            </div>
          ) : null}
          {tuningCopyStatus !== 'idle' ? (
            <div className={`mt-1 ${tuningCopyStatus === 'copied' ? 'text-emerald-200' : 'text-rose-200'}`}>
              {tuningCopyStatus === 'copied' ? 'Tuning JSON copied to clipboard.' : 'Could not copy tuning JSON.'}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex w-full justify-center">
        <div
          className="relative h-auto w-[clamp(360px,64vw,920px)] max-w-full rounded-[28px] border border-white/20 bg-[#010714]"
          style={{ aspectRatio: `${vbW} / ${vbH}` }}
        >
          {showCalibrationGuides ? (
            <div className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-[#020d26]/75 px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-blue-100">
              <div>baseW {baseW} · baseH {baseH}</div>
              {debugMode && shellNaturalSize ? (
                <div>naturalW {shellNaturalSize.width} · naturalH {shellNaturalSize.height}</div>
              ) : null}
              {debugMode && hasNaturalSizeMismatch ? (
                <div className="text-amber-300">WARNING: base and natural sizes differ.</div>
              ) : null}
            </div>
          ) : null}

          {shellSrc ? (
            <svg
              className="h-full w-full"
              viewBox={`0 0 ${vbW} ${vbH}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={`${renderLayout.model} shell preview`}
            >
              <g transform={groupTransform}>
                <defs>
                  {slotIds.map((slotId) => {
                    const slotEntry = renderLayout.slots.find((item) => item.id === slotId);
                    if (!slotEntry) return null;
                    return (
                      <clipPath key={`${slotId}-clip`} id={`${safeSvgIdPrefix}-insert-${slotId}`}>
                        <circle cx={slotEntry.cx} cy={slotEntry.cy} r={slotEntry.insertD / 2} />
                      </clipPath>
                    );
                  })}
                </defs>
                <image href={shellSrc} x={0} y={0} width={baseW} height={baseH} preserveAspectRatio="xMidYMid meet" />

                {slotIds.map((slotId, slotIndex) => {
                  const slotEntry = renderLayout.slots.find((item) => item.id === slotId);
                  if (!slotEntry) return null;

                  const slotVisual = slots[slotId] ?? EMPTY_SLOT_VISUAL_STATE;
                  const matteSrc = slotVisual.matteAssetPath ? assetUrl(slotVisual.matteAssetPath) : '';
                  const ringColor = slotVisual.color;
                  const ringLuminance = colorLuminance(ringColor);
                  const isWhiteGlow = ringLuminance >= WHITE_GLOW_LUMINANCE_THRESHOLD;
                  const hitRadius = Math.max(slotEntry.insertD, slotEntry.bezelD) / 2;
                  const ringOuter = slotEntry.bezelD / 2;
                  const ringBand = Math.max(3, slotEntry.bezelD * 0.075);
                  const ringInner = Math.max(1, ringOuter - ringBand);
                  const iconSize = slotEntry.insertD * iconScaleValue * iconVisibleCompValue;
                  const iconX = slotEntry.cx - (iconSize / 2);
                  const iconY = slotEntry.cy - (iconSize / 2);
                  const isActive = slotId === activeSlotId;
                  const isSelected = editMode && slotId === selectedSlotId;
                  const showSlotGuides = showCalibrationGuides
                    && (!showSelectedGuidesOnly || !editMode || slotId === selectedSlotId);

                  return (
                    <g
                      key={slotId}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      aria-label={`Configure Slot ${slotIndex + 1}`}
                      onMouseEnter={() => {
                        setHoveredSlotId(slotId as SlotId);
                      }}
                      onMouseLeave={() => {
                        if (hoveredSlotId === slotId) {
                          setHoveredSlotId(null);
                        }
                      }}
                      onFocus={() => {
                        setHoveredSlotId(slotId as SlotId);
                      }}
                      onBlur={() => {
                        if (hoveredSlotId === slotId) {
                          setHoveredSlotId(null);
                        }
                      }}
                      onClick={() => {
                        if (editMode) {
                          setSelectedSlotId(slotId);
                          return;
                        }
                        onSlotClick(slotId as SlotId);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          if (editMode) {
                            setSelectedSlotId(slotId);
                            return;
                          }
                          onSlotClick(slotId as SlotId);
                        }
                      }}
                    >
                      <circle cx={slotEntry.cx} cy={slotEntry.cy} r={hitRadius} fill="transparent" />

                      {isActive ? (
                        <circle
                          cx={slotEntry.cx}
                          cy={slotEntry.cy}
                          r={Math.max(slotEntry.insertD / 2, ringInner)}
                          fill="rgba(255,255,255,0.04)"
                          stroke="rgba(170,189,216,0.45)"
                          strokeWidth={Math.max(1, slotEntry.bezelD * 0.015)}
                        />
                      ) : null}

                      {ringColor && showGlows ? (
                        <BacklitGlow
                          idBase={`${safeSvgIdPrefix}-slot-${slotId}`}
                          cx={slotEntry.cx}
                          cy={slotEntry.cy}
                          rOuter={ringOuter}
                          rInner={ringInner}
                          buttonDiameterPx={slotEntry.bezelD}
                          color={ringColor}
                          opacity={0.46}
                          transitionMs={190}
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
                          transform={visualRotationDeg ? `rotate(${-visualRotationDeg} ${slotEntry.cx} ${slotEntry.cy})` : undefined}
                          clipPath={`url(#${safeSvgIdPrefix}-insert-${slotId})`}
                          style={{
                            filter: isWhiteGlow ? 'brightness(0.82)' : 'brightness(0.9)',
                            transition: 'filter 180ms ease-out',
                          }}
                        />
                      ) : (
                        <>
                          <circle
                            cx={slotEntry.cx}
                            cy={slotEntry.cy}
                            r={slotEntry.insertD / 2}
                            fill="rgba(255,255,255,0.04)"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth={Math.max(1, slotEntry.insertD * 0.02)}
                          />
                          <text
                            x={slotEntry.cx}
                            y={slotEntry.cy + Math.max(6, slotEntry.insertD * 0.08)}
                            textAnchor="middle"
                            fontSize={Math.max(16, slotEntry.insertD * 0.34)}
                            fontWeight={600}
                            fill="rgba(255,255,255,0.65)"
                          >
                            +
                          </text>
                        </>
                      )}

                      {isSelected ? (
                        <circle
                          cx={slotEntry.cx}
                          cy={slotEntry.cy}
                          r={(slotEntry.bezelD / 2) + 6}
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth={Math.max(2, slotEntry.bezelD * 0.03)}
                          strokeDasharray="4 3"
                          vectorEffect="non-scaling-stroke"
                        />
                      ) : null}

                      {showSlotGuides ? (
                        <>
                          <line
                            x1={slotEntry.cx - Math.max(8, slotEntry.insertD * 0.26)}
                            y1={slotEntry.cy}
                            x2={slotEntry.cx + Math.max(8, slotEntry.insertD * 0.26)}
                            y2={slotEntry.cy}
                            stroke="#ff3b30"
                            strokeWidth={1.4}
                            vectorEffect="non-scaling-stroke"
                          />
                          <line
                            x1={slotEntry.cx}
                            y1={slotEntry.cy - Math.max(8, slotEntry.insertD * 0.26)}
                            x2={slotEntry.cx}
                            y2={slotEntry.cy + Math.max(8, slotEntry.insertD * 0.26)}
                            stroke="#ff3b30"
                            strokeWidth={1.4}
                            vectorEffect="non-scaling-stroke"
                          />
                          <circle
                            cx={slotEntry.cx}
                            cy={slotEntry.cy}
                            r={slotEntry.insertD / 2}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={1.2}
                            strokeDasharray="4 3"
                            vectorEffect="non-scaling-stroke"
                          />
                          <circle
                            cx={slotEntry.cx}
                            cy={slotEntry.cy}
                            r={slotEntry.bezelD / 2}
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth={1.2}
                            vectorEffect="non-scaling-stroke"
                          />
                          <text
                            x={slotEntry.cx + Math.max(10, slotEntry.insertD * 0.28)}
                            y={slotEntry.cy - Math.max(10, slotEntry.insertD * 0.2)}
                            fontSize={Math.max(10, slotEntry.insertD * 0.16)}
                            fontWeight={700}
                            fill="#fef08a"
                          >
                            {slotIndex + 1}
                          </text>
                        </>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            </svg>
          ) : (
            <div className="grid h-full w-full place-items-center text-sm font-semibold text-blue-100/80">
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
