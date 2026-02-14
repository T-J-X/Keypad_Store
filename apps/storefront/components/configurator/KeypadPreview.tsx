'use client';

import { createContext, use, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  getGeometryForModel,
  getSlotIdsForGeometry,
  type KeypadModelGeometry,
} from '../../config/layouts/geometry';
import type { SlotVisualState } from '../../lib/configuratorStore';
import type { SlotId } from '../../lib/keypadConfiguration';
import { assetUrl } from '../../lib/vendure';
import BacklitGlow from './BacklitGlow';
import { KeypadContext } from './KeypadProvider';

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

type PreviewSlot = {
  id: string;
  label: string;
  cx: number;
  cy: number;
  insertD: number;
  bezelD: number;
};

type PreviewLayout = {
  model: string;
  baseW: number;
  baseH: number;
  slots: PreviewSlot[];
};

type PreviewInteractionContextValue = {
  selectedSlotId: string | null;
  hoveredSlotId: SlotId | null;
  showSelectedGuidesOnly: boolean;
  setSelectedSlotId: (slotId: string | null) => void;
  setHoveredSlotId: (slotId: SlotId | null) => void;
  setShowSelectedGuidesOnly: (next: boolean) => void;
};

const PreviewInteractionContext = createContext<PreviewInteractionContextValue | null>(null);

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
  layout: PreviewLayout,
  slotId: string,
  updater: (slotEntry: PreviewSlot) => PreviewSlot,
): PreviewLayout {
  return {
    ...layout,
    slots: layout.slots.map((slotEntry) => (slotEntry.id === slotId ? updater(slotEntry) : slotEntry)),
  };
}

function slotSizePercent(slot: KeypadModelGeometry['slots'][string]) {
  if (Number.isFinite(slot.sizePct)) return slot.sizePct;
  return slot.r * 200;
}

function geometryToPreviewLayout(geometry: KeypadModelGeometry): PreviewLayout {
  const baseW = Math.max(1, geometry.intrinsicSize.width);
  const baseH = Math.max(1, geometry.intrinsicSize.height);
  const slotIds = getSlotIdsForGeometry(geometry);

  return {
    model: geometry.modelCode,
    baseW,
    baseH,
    slots: slotIds.map((slotId) => {
      const slot = geometry.slots[slotId]!;
      const slotDiameterPx = (slotSizePercent(slot) / 100) * baseW;
      return {
        id: slotId,
        label: slot.label,
        cx: slot.cx * baseW,
        cy: slot.cy * baseH,
        insertD: slotDiameterPx * (geometry.buttonVisual.iconDiameterPctOfSlot / 100),
        bezelD: slotDiameterPx * (geometry.buttonVisual.ringDiameterPctOfSlot / 100),
      };
    }),
  };
}

function clonePreviewLayout(layout: PreviewLayout): PreviewLayout {
  return {
    ...layout,
    slots: layout.slots.map((slotEntry) => ({ ...slotEntry })),
  };
}

function buildSlotBindings(layout: PreviewLayout): SlotBinding[] {
  return layout.slots.map((slotEntry, index) => {
    const key = SLOT_SELECT_KEYS[index] ?? '';
    const numeric = slotEntry.id.match(/\d+/)?.[0] ?? String(index + 1);
    return {
      key,
      slotId: slotEntry.id,
      slotLabel: `Slot ${numeric}`,
    };
  });
}

function PreviewEditStatus({
  selectedSlot,
  iconScaleValue,
  iconVisibleCompValue,
  effectiveIconMultiplier,
  slotBindingList,
}: {
  selectedSlot: PreviewSlot | null;
  iconScaleValue: number;
  iconVisibleCompValue: number;
  effectiveIconMultiplier: number;
  slotBindingList: SlotBinding[];
}) {
  const interactions = use(PreviewInteractionContext);
  if (!interactions) return null;

  return (
    <>
      <div className="mt-2 text-blue-100/90">
        Selected: {interactions.selectedSlotId ?? 'none'} · Move: Arrows {DEFAULT_POSITION_NUDGE_PX}px (Shift {FAST_POSITION_NUDGE_PX}px, Alt {DEFAULT_POSITION_NUDGE_PX}px)
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
    </>
  );
}

export default function KeypadPreview({
  modelCode,
  shellAssetPath,
  slots,
  activeSlotId,
  onSlotClick,
  rotationDeg,
  iconScale,
  iconVisibleComp,
  debugMode,
  editMode,
  descriptionText,
  showGlows,
  onRotate,
  onToggleGlows,
}: {
  modelCode?: string;
  shellAssetPath?: string | null;
  slots?: Record<string, SlotVisualState>;
  activeSlotId?: SlotId | null;
  onSlotClick?: (slotId: SlotId) => void;
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
  const keypadContext = use(KeypadContext);
  const fallbackModelCode = modelCode ?? keypadContext?.state.modelCode ?? 'PKP-2200-SI';
  const resolvedGeometry = keypadContext?.meta.geometry ?? getGeometryForModel(fallbackModelCode);
  const resolvedShellAssetPath = shellAssetPath ?? keypadContext?.meta.keypad.shellAssetPath ?? null;
  const resolvedSlots = slots ?? keypadContext?.state.slots ?? {};
  const resolvedActiveSlotId = activeSlotId ?? keypadContext?.state.popupSlotId ?? null;
  const resolvedOnSlotClick = onSlotClick ?? keypadContext?.actions.openSlot ?? (() => {});
  const resolvedRotationDeg = rotationDeg ?? keypadContext?.state.preview.rotationDeg ?? 0;
  const resolvedIconScale = iconScale ?? keypadContext?.state.preview.iconScale ?? DEFAULT_ICON_SCALE;
  const resolvedIconVisibleComp = iconVisibleComp ?? keypadContext?.state.preview.iconVisibleComp ?? DEFAULT_ICON_VISIBLE_COMP;
  const resolvedDebugMode = debugMode ?? keypadContext?.state.preview.debugMode ?? false;
  const resolvedEditMode = editMode ?? keypadContext?.state.preview.editMode ?? false;
  const resolvedDescriptionText = descriptionText ?? keypadContext?.state.preview.descriptionText ?? null;
  const resolvedShowGlows = showGlows ?? keypadContext?.state.preview.showGlows ?? true;
  const resolvedOnRotate = onRotate ?? keypadContext?.actions.rotatePreview;
  const resolvedOnToggleGlows = onToggleGlows ?? keypadContext?.actions.togglePreviewGlows;

  const baseLayout = useMemo(() => geometryToPreviewLayout(resolvedGeometry), [resolvedGeometry]);
  const [editableLayout, setEditableLayout] = useState<PreviewLayout>(() => clonePreviewLayout(baseLayout));
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [showSelectedGuidesOnly, setShowSelectedGuidesOnly] = useState(false);
  const [hoveredSlotId, setHoveredSlotId] = useState<SlotId | null>(null);
  const [displayRotationDeg, setDisplayRotationDeg] = useState(resolvedRotationDeg);
  const [editableIconScale, setEditableIconScale] = useState(() => normalizeIconScale(resolvedIconScale));
  const [layoutCopyStatus, setLayoutCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [tuningCopyStatus, setTuningCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [shellNaturalSize, setShellNaturalSize] = useState<IntrinsicSize | null>(null);
  const displayRotationRef = useRef(resolvedRotationDeg);
  const rotationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setEditableLayout(clonePreviewLayout(baseLayout));
  }, [baseLayout]);

  useEffect(() => {
    setEditableIconScale(normalizeIconScale(resolvedIconScale));
  }, [baseLayout.model, resolvedIconScale]);

  const renderLayout = resolvedEditMode ? editableLayout : baseLayout;
  const slotIds = useMemo(() => renderLayout.slots.map((slotEntry) => slotEntry.id), [renderLayout.slots]);
  const slotsById = useMemo(
    () => new Map(renderLayout.slots.map((slotEntry) => [slotEntry.id, slotEntry])),
    [renderLayout.slots],
  );
  const iconVisibleCompValue = useMemo(
    () => normalizeIconVisibleComp(resolvedIconVisibleComp),
    [resolvedIconVisibleComp],
  );
  const iconScaleValue = useMemo(
    () => (resolvedEditMode ? editableIconScale : normalizeIconScale(resolvedIconScale)),
    [resolvedEditMode, editableIconScale, resolvedIconScale],
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
    if (!resolvedEditMode) {
      setSelectedSlotId(null);
      setShowSelectedGuidesOnly(false);
      return;
    }

    setSelectedSlotId((previous) => {
      if (previous && slotIds.includes(previous)) return previous;
      return slotIds[0] ?? null;
    });
  }, [resolvedEditMode, slotIds]);

  const selectedSlot = useMemo(
    () => (selectedSlotId ? (slotsById.get(selectedSlotId) ?? null) : null),
    [selectedSlotId, slotsById],
  );

  useEffect(() => {
    displayRotationRef.current = displayRotationDeg;
  }, [displayRotationDeg]);

  useEffect(() => {
    if (Math.abs(displayRotationRef.current - resolvedRotationDeg) < 0.001) return;
    if (typeof window === 'undefined') {
      setDisplayRotationDeg(resolvedRotationDeg);
      return;
    }

    if (rotationFrameRef.current != null) {
      window.cancelAnimationFrame(rotationFrameRef.current);
      rotationFrameRef.current = null;
    }

    const startRotation = displayRotationRef.current;
    const delta = resolvedRotationDeg - startRotation;
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
        setDisplayRotationDeg(resolvedRotationDeg);
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
  }, [resolvedRotationDeg]);

  useEffect(() => {
    if (!resolvedEditMode || typeof window === 'undefined') return;

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
  }, [resolvedEditMode, selectedSlotId, slotIdByKey]);

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
    if (!resolvedEditMode || typeof navigator === 'undefined' || !navigator.clipboard) {
      setLayoutCopyStatus('error');
      return;
    }

    try {
      const normalized = {
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
    if (!resolvedEditMode || typeof navigator === 'undefined' || !navigator.clipboard) {
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

  const shellSrc = resolvedShellAssetPath ? assetUrl(resolvedShellAssetPath) : '';
  const showCalibrationGuides = resolvedDebugMode || resolvedEditMode;
  const baseW = Math.max(renderLayout.baseW, 1);
  const baseH = Math.max(renderLayout.baseH, 1);
  const hasNaturalSizeMismatch = Boolean(
    shellNaturalSize
      && (shellNaturalSize.width !== baseW || shellNaturalSize.height !== baseH),
  );
  const svgIdPrefix = useId();
  const safeSvgIdPrefix = useMemo(() => sanitizeSvgId(svgIdPrefix), [svgIdPrefix]);
  const visualRotationDeg = Math.abs(displayRotationDeg) < 0.001 ? 0 : displayRotationDeg;
  const groupTransform = visualRotationDeg ? `rotate(${visualRotationDeg} ${baseW / 2} ${baseH / 2})` : undefined;
  const layoutLabel = resolvedGeometry.layoutLabel || MODEL_LAYOUT_LABELS[renderLayout.model] || `${renderLayout.slots.length} slots`;

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
    if (!resolvedDebugMode || !hasNaturalSizeMismatch || !shellNaturalSize) return;
    console.warn(
      `[KeypadPreview] base size mismatch for ${renderLayout.model}: base=${baseW}x${baseH}, natural=${shellNaturalSize.width}x${shellNaturalSize.height}`,
    );
  }, [baseH, baseW, hasNaturalSizeMismatch, renderLayout.model, resolvedDebugMode, shellNaturalSize]);

  const previewInteractions = useMemo<PreviewInteractionContextValue>(() => ({
    selectedSlotId,
    hoveredSlotId,
    showSelectedGuidesOnly,
    setSelectedSlotId,
    setHoveredSlotId,
    setShowSelectedGuidesOnly,
  }), [hoveredSlotId, selectedSlotId, showSelectedGuidesOnly]);

  return (
    <PreviewInteractionContext value={previewInteractions}>
      <div className="card glow-isolate relative overflow-hidden border border-white/18 bg-[radial-gradient(140%_120%_at_60%_-10%,#2e79dd_0%,#17305f_36%,#0a1429_72%)] p-5 shadow-[0_28px_70px_rgba(2,9,24,0.42)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">Command View</div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">{renderLayout.model} Preview</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resolvedOnRotate}
            className="inline-flex min-h-9 items-center rounded-full border border-white/24 bg-[#0a1b3a]/70 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-100 transition hover:border-white/40 hover:bg-[#12305e]"
          >
            Rotate
          </button>
          <button
            type="button"
            onClick={resolvedOnToggleGlows}
            className="inline-flex min-h-9 items-center rounded-full border border-white/24 bg-[#0a1b3a]/70 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-100 transition hover:border-white/40 hover:bg-[#12305e]"
          >
            {resolvedShowGlows ? 'Glows on' : 'Glows off'}
          </button>
          <div className="rounded-full border border-white/20 bg-[#06122a]/65 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-blue-100">
            {layoutLabel}
          </div>
        </div>
      </div>

      {resolvedEditMode ? (
        <div className="mb-4 rounded-2xl border border-white/20 bg-[#071634]/70 px-4 py-3 text-xs text-blue-100/95">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold uppercase tracking-[0.14em] text-blue-100">Edit mode</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSelectedGuidesOnly((previous) => !previous)}
                className="inline-flex min-h-8 items-center rounded-full border border-white/28 bg-[#0f2a58]/80 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100 transition hover:border-white/45 hover:bg-[#184080]"
              >
                {showSelectedGuidesOnly ? 'Guides: selected' : 'Guides: all'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void onCopyJson();
                }}
                className="inline-flex min-h-8 items-center rounded-full border border-white/28 bg-[#0f2a58]/80 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100 transition hover:border-white/45 hover:bg-[#184080]"
              >
                Copy JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  void onCopyTuningJson();
                }}
                className="inline-flex min-h-8 items-center rounded-full border border-white/28 bg-[#0f2a58]/80 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100 transition hover:border-white/45 hover:bg-[#184080]"
              >
                Copy Tuning JSON
              </button>
            </div>
          </div>
          <PreviewEditStatus
            selectedSlot={selectedSlot}
            iconScaleValue={iconScaleValue}
            iconVisibleCompValue={iconVisibleCompValue}
            effectiveIconMultiplier={effectiveIconMultiplier}
            slotBindingList={slotBindingList}
          />
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
          className="relative h-auto w-[clamp(360px,64vw,920px)] max-w-full overflow-hidden rounded-[28px] border border-white/20 bg-[#010714]"
          style={{ aspectRatio: `${baseW} / ${baseH}` }}
        >
          {showCalibrationGuides ? (
            <div className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-[#020d26]/75 px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-blue-100">
              <div>baseW {baseW} · baseH {baseH}</div>
              {resolvedDebugMode && shellNaturalSize ? (
                <div>naturalW {shellNaturalSize.width} · naturalH {shellNaturalSize.height}</div>
              ) : null}
              {resolvedDebugMode && hasNaturalSizeMismatch ? (
                <div className="text-amber-300">WARNING: base and natural sizes differ.</div>
              ) : null}
            </div>
          ) : null}

          {shellSrc ? (
            <svg
              className="h-full w-full"
              viewBox={`0 0 ${baseW} ${baseH}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={`${renderLayout.model} shell preview`}
            >
              <defs>
                {slotIds.map((slotId) => {
                  const slotEntry = slotsById.get(slotId);
                  if (!slotEntry) return null;
                  return (
                    <clipPath key={`${slotId}-clip`} id={`${safeSvgIdPrefix}-insert-${slotId}`}>
                      <circle cx={slotEntry.cx} cy={slotEntry.cy} r={slotEntry.insertD / 2} />
                    </clipPath>
                  );
                })}
              </defs>

              <g transform={groupTransform}>
                <image href={shellSrc} x={0} y={0} width={baseW} height={baseH} preserveAspectRatio="xMidYMid meet" />

                {slotIds.map((slotId, slotIndex) => {
                  const slotEntry = slotsById.get(slotId);
                  if (!slotEntry) return null;

                  const slotVisual = resolvedSlots[slotId] ?? EMPTY_SLOT_VISUAL_STATE;
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
                  const isActive = slotId === resolvedActiveSlotId;
                  const isSelected = resolvedEditMode && slotId === selectedSlotId;
                  const showSlotGuides = showCalibrationGuides
                    && (!showSelectedGuidesOnly || !resolvedEditMode || slotId === selectedSlotId);

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
                        if (resolvedEditMode) {
                          setSelectedSlotId(slotId);
                          return;
                        }
                        resolvedOnSlotClick(slotId as SlotId);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          if (resolvedEditMode) {
                            setSelectedSlotId(slotId);
                            return;
                          }
                          resolvedOnSlotClick(slotId as SlotId);
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

                      {ringColor && resolvedShowGlows ? (
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
        {resolvedDescriptionText ? <p className="text-[#d7e8ff]/90">{resolvedDescriptionText}</p> : null}
      </div>
    </div>
    </PreviewInteractionContext>
  );
}
