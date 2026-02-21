'use client';

import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState, memo, type Dispatch, type SetStateAction } from 'react';
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

type CopyStatus = 'idle' | 'copied' | 'error';

type PreviewUiState = {
  selectedSlotId: string | null;
  showSelectedGuidesOnly: boolean;
  hoveredSlotId: SlotId | null;
  layoutCopyStatus: CopyStatus;
  tuningCopyStatus: CopyStatus;
  editableIconScale: number;
};

type PreviewUiAction =
  | { type: 'setSelectedSlot'; slotId: string | null }
  | { type: 'toggleShowSelectedGuidesOnly' }
  | { type: 'setHoveredSlot'; slotId: SlotId | null }
  | { type: 'clearHoveredSlotIfMatch'; slotId: SlotId }
  | { type: 'setLayoutCopyStatus'; status: CopyStatus }
  | { type: 'setTuningCopyStatus'; status: CopyStatus }
  | { type: 'setEditableIconScale'; value: number }
  | { type: 'nudgeEditableIconScale'; delta: number }
  | { type: 'syncEditMode'; editMode: boolean; slotIds: string[] };

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

function previewUiReducer(state: PreviewUiState, action: PreviewUiAction): PreviewUiState {
  switch (action.type) {
    case 'setSelectedSlot':
      return { ...state, selectedSlotId: action.slotId };
    case 'toggleShowSelectedGuidesOnly':
      return { ...state, showSelectedGuidesOnly: !state.showSelectedGuidesOnly };
    case 'setHoveredSlot':
      return state.hoveredSlotId === action.slotId ? state : { ...state, hoveredSlotId: action.slotId };
    case 'clearHoveredSlotIfMatch':
      return state.hoveredSlotId === action.slotId
        ? { ...state, hoveredSlotId: null }
        : state;
    case 'setLayoutCopyStatus':
      return state.layoutCopyStatus === action.status ? state : { ...state, layoutCopyStatus: action.status };
    case 'setTuningCopyStatus':
      return state.tuningCopyStatus === action.status ? state : { ...state, tuningCopyStatus: action.status };
    case 'setEditableIconScale':
      return state.editableIconScale === action.value
        ? state
        : { ...state, editableIconScale: action.value };
    case 'nudgeEditableIconScale': {
      const next = round2(clamp(state.editableIconScale + action.delta, MIN_ICON_SCALE, MAX_ICON_SCALE));
      return next === state.editableIconScale ? state : { ...state, editableIconScale: next };
    }
    case 'syncEditMode': {
      if (!action.editMode) {
        if (state.selectedSlotId === null && !state.showSelectedGuidesOnly) return state;
        return { ...state, selectedSlotId: null, showSelectedGuidesOnly: false };
      }
      const hasValidSelection = Boolean(state.selectedSlotId && action.slotIds.includes(state.selectedSlotId));
      const nextSelectedSlotId = hasValidSelection ? state.selectedSlotId : (action.slotIds[0] ?? null);
      return nextSelectedSlotId === state.selectedSlotId
        ? state
        : { ...state, selectedSlotId: nextSelectedSlotId };
    }
    default:
      return state;
  }
}

// --- Extracted Slot Component for Performance ---
const MemoizedKeypadSlot = memo(function KeypadSlot({
  slotId,
  slotIndex,
  slotEntry,
  slotVisual,
  isActive,
  isSelected,
  isNextSlot,
  showSlotGuides,
  iconScaleValue,
  iconVisibleCompValue,
  onSlotClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  editMode,
  setSelectedSlotId,
  safeSvgIdPrefix,
  modelCode,
  shouldShowTooltip,
  visualRotationDeg,
  showGlows,
}: {
  slotId: string;
  slotIndex: number;
  slotEntry: Slot;
  slotVisual: SlotVisualState;
  isActive: boolean;
  isSelected: boolean;
  isNextSlot: boolean;
  showSlotGuides: boolean;
  iconScaleValue: number;
  iconVisibleCompValue: number;
  onSlotClick: (id: SlotId) => void;
  onMouseEnter: (id: SlotId) => void;
  onMouseLeave: (id: SlotId) => void;
  onFocus: (id: SlotId) => void;
  onBlur: (id: SlotId) => void;
  editMode: boolean;
  setSelectedSlotId: (id: string) => void;
  safeSvgIdPrefix: string;
  modelCode: string | undefined;
  shouldShowTooltip: boolean;
  visualRotationDeg: number;
  showGlows: boolean;
}) {
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
  const isPulsating = isNextSlot && !isActive;

  return (
    <g
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer', outline: 'none' }}
      aria-label={`Configure Slot ${slotIndex + 1}`}
      onMouseEnter={() => onMouseEnter(slotId as SlotId)}
      onMouseLeave={() => onMouseLeave(slotId as SlotId)}
      onFocus={() => onFocus(slotId as SlotId)}
      onBlur={() => onBlur(slotId as SlotId)}
      onClick={(e) => {
        e.stopPropagation();
        if (editMode) {
          setSelectedSlotId(slotId);
          return;
        }
        onSlotClick(slotId as SlotId);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
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
          className="animate-pulse"
        />
      ) : null}

      {/* Ring / Bezel */}
      {/* We use fill for body and separate stroke if needed, but original code used circles with fills */}
      {/* Wait, original code at 822 had logic for isActive ring.
          Then logic for BacklitGlow.
          Then logic for Matte Insert or Placeholder.
          Then logic for Selection Ring.
          Then logic for Guides.
      */}

      {/* Backlit Glow (if any) */}
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

      {/* Matte Insert */}
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
          className={isPulsating ? 'animate-icon-pulse-blue' : ''}
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
          {!isPulsating && (
            <text
              x={slotEntry.cx}
              y={slotEntry.cy + Math.max(6, slotEntry.insertD * 0.08)}
              textAnchor="middle"
              fontSize={Math.max(16, slotEntry.insertD * 0.34)}
              fontWeight={200}
              fill="rgba(255,0,0,0.5)"
            >
              +
            </text>
          )}
          {isPulsating && (
            <>
              <circle
                cx={slotEntry.cx}
                cy={slotEntry.cy}
                r={slotEntry.insertD / (modelCode === 'PKP-2200-SI' ? 2.35 : 1.8)}
                fill="none"
                stroke="rgba(2, 6, 23, 0.53)"
                strokeWidth="1.5"
                strokeDasharray="3 2"
                className="animate-spin-slow"
                style={{ transformOrigin: `${slotEntry.cx}px ${slotEntry.cy}px`, animationDuration: '10s' }}
              />
              <g className="animate-icon-pulse-blue" style={{ transformOrigin: `${slotEntry.cx}px ${slotEntry.cy}px` }}>
                <circle
                  cx={slotEntry.cx}
                  cy={slotEntry.cy}
                  r={slotEntry.insertD / (modelCode === 'PKP-2200-SI' ? 2.4 : 1.85)}
                  fill="rgba(2, 6, 23, 0.64)"
                />
                <text
                  x={slotEntry.cx}
                  y={slotEntry.cy + Math.max(6, slotEntry.insertD * 0.08)}
                  textAnchor="middle"
                  fontSize={Math.max(16, slotEntry.insertD * 0.34)}
                  fontWeight={200}
                  fill="rgba(255,0,0,0.5)"
                >
                  +
                </text>
                <image
                  href="/vct-logo.png"
                  x={slotEntry.cx - (slotEntry.insertD * (modelCode === 'PKP-2200-SI' ? 0.65 : 0.85)) / 2}
                  y={slotEntry.cy - (slotEntry.insertD * (modelCode === 'PKP-2200-SI' ? 0.65 : 0.85) * 0.32) / 2}
                  width={slotEntry.insertD * (modelCode === 'PKP-2200-SI' ? 0.65 : 0.85)}
                  height={slotEntry.insertD * (modelCode === 'PKP-2200-SI' ? 0.65 : 0.85) * 0.32}
                  style={{
                    filter: 'brightness(0) invert(1)',
                    opacity: 0.95,
                  }}
                  transform={visualRotationDeg ? `rotate(${-visualRotationDeg} ${slotEntry.cx} ${slotEntry.cy})` : undefined}
                />
              </g>
              {shouldShowTooltip && (() => {
                const isMassiveTooltipModel = [
                  'PKP-3500-SI',
                  'PKP-2500-SI',
                  'PKP-2400-SI',
                  'PKP-2300-SI'
                ].includes(modelCode || '');
                const isMidLargeTooltipModel = [
                  'PKP-2600-SI',
                  'PKP-2200-SI'
                ].includes(modelCode || '');

                let width = 190;
                let height = 70;
                let dx = 95;
                let dy = 55;
                let style: React.CSSProperties | undefined = { fontSize: '13px', padding: '10px 20px' };

                if (isMassiveTooltipModel) {
                  width = 280;
                  height = 100;
                  dx = 140;
                  dy = 85;
                  style = { fontSize: '22px', padding: '18px 32px' };
                } else if (isMidLargeTooltipModel) {
                  width = 230;
                  height = 86;
                  dx = 115;
                  dy = 75;
                  style = { fontSize: '17px', padding: '15px 26px' };
                }

                return (
                  <foreignObject
                    x={slotEntry.cx - dx}
                    y={slotEntry.cy - slotEntry.insertD / 1.4 - dy}
                    width={width}
                    height={height}
                    className="overflow-visible"
                    transform={visualRotationDeg ? `rotate(${-visualRotationDeg} ${slotEntry.cx} ${slotEntry.cy})` : undefined}
                  >
                    <div className="flex justify-center">
                      <div
                        className="tooltip-bubble"
                        style={style}
                      >
                        Please select an icon
                      </div>
                    </div>
                  </foreignObject>
                );
              })()}
            </>
          )}
        </>
      )}

      {/* Selected Ring */}
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

      {/* Calibration Guides */}
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
}, (prev, next) => {
  return (
    prev.slotId === next.slotId &&
    prev.slotIndex === next.slotIndex &&
    prev.isActive === next.isActive &&
    prev.isSelected === next.isSelected &&
    prev.isNextSlot === next.isNextSlot &&
    prev.showSlotGuides === next.showSlotGuides &&
    prev.iconScaleValue === next.iconScaleValue &&
    prev.iconVisibleCompValue === next.iconVisibleCompValue &&
    prev.editMode === next.editMode &&
    prev.safeSvgIdPrefix === next.safeSvgIdPrefix &&
    prev.modelCode === next.modelCode &&
    prev.shouldShowTooltip === next.shouldShowTooltip &&
    prev.visualRotationDeg === next.visualRotationDeg &&
    prev.showGlows === next.showGlows &&
    prev.slotEntry === next.slotEntry &&
    prev.slotVisual === next.slotVisual
  );
});

function KeypadPreviewEditPanel({
  showSelectedGuidesOnly,
  onToggleShowSelectedGuidesOnly,
  onCopyJson,
  onCopyTuningJson,
  selectedSlotId,
  selectedSlot,
  iconScaleValue,
  iconVisibleCompValue,
  effectiveIconMultiplier,
  slotBindingList,
  layoutCopyStatus,
  tuningCopyStatus,
}: {
  showSelectedGuidesOnly: boolean;
  onToggleShowSelectedGuidesOnly: () => void;
  onCopyJson: () => void;
  onCopyTuningJson: () => void;
  selectedSlotId: string | null;
  selectedSlot: Slot | null;
  iconScaleValue: number;
  iconVisibleCompValue: number;
  effectiveIconMultiplier: number;
  slotBindingList: SlotBinding[];
  layoutCopyStatus: CopyStatus;
  tuningCopyStatus: CopyStatus;
}) {
  return (
    <div className="mb-4 flex-shrink-0 rounded-2xl border border-white/20 bg-[#071634]/70 px-4 py-3 text-xs text-blue-100/95">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold uppercase tracking-[0.14em] text-blue-100">Edit mode</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleShowSelectedGuidesOnly}
            className="inline-flex min-h-8 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100 transition hover:border-white/30 hover:bg-white/10"
          >
            {showSelectedGuidesOnly ? 'Guides: selected' : 'Guides: all'}
          </button>
          <button
            type="button"
            onClick={onCopyJson}
            className="inline-flex min-h-8 items-center rounded-lg border border-white/15 bg-white/5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100 transition hover:border-white/30 hover:bg-white/10"
          >
            Copy JSON
          </button>
          <button
            type="button"
            onClick={onCopyTuningJson}
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
  );
}

function KeypadPreviewToolbar({
  layoutLabel,
  onZoomOut,
  onZoomIn,
  onRotate,
  onResetSlots,
}: {
  layoutLabel: string;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onRotate?: () => void;
  onResetSlots?: () => void;
}) {
  return (
    <div className="mb-6 flex w-full max-w-[1024px] items-center justify-between">
      <div className="rounded-full border border-white/10 bg-[#06122a]/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100/50 backdrop-blur-sm">
        {layoutLabel}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={onZoomOut}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[14px] font-medium text-blue-100 hover:bg-white/10 transition-colors"
            aria-label="Zoom out"
          >
            −
          </button>
          <div className="h-4 w-[1px] bg-white/10" />
          <button
            type="button"
            onClick={onZoomIn}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[14px] font-medium text-blue-100 hover:bg-white/10 transition-colors"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={onRotate}
          className="flex h-9 items-center rounded-lg border border-white/10 bg-white/5 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100 transition hover:border-white/25 hover:bg-white/10"
        >
          Rotate
        </button>

        <div className="h-6 w-[1px] bg-white/10" />

        <button
          type="button"
          onClick={onResetSlots}
          className="flex h-9 items-center gap-2 rounded-lg px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-300/80 transition hover:text-rose-300 hover:bg-rose-500/10"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function KeypadPreviewCanvas({
  showCalibrationGuides,
  debugMode,
  shellNaturalSize,
  hasNaturalSizeMismatch,
  shellSrc,
  vbW,
  vbH,
  renderLayout,
  zoomLevel,
  groupTransform,
  slotIds,
  baseW,
  baseH,
  safeSvgIdPrefix,
  slots,
  activeSlotId,
  editMode,
  selectedSlotId,
  nextSlotId,
  showSelectedGuidesOnly,
  showInitialTooltip,
  onSlotClick,
  onSlotHover,
  onSlotBlur,
  onSelectSlot,
  modelCode,
  displayRotationDeg,
  showGlows,
  iconScaleValue,
  iconVisibleCompValue,
}: {
  showCalibrationGuides: boolean;
  debugMode: boolean;
  shellNaturalSize: IntrinsicSize | null;
  hasNaturalSizeMismatch: boolean;
  shellSrc: string;
  vbW: number;
  vbH: number;
  renderLayout: ModelLayout;
  zoomLevel: number;
  groupTransform: string;
  slotIds: string[];
  baseW: number;
  baseH: number;
  safeSvgIdPrefix: string;
  slots: Record<string, SlotVisualState>;
  activeSlotId: SlotId | null;
  editMode: boolean;
  selectedSlotId: string | null;
  nextSlotId: string | undefined;
  showSelectedGuidesOnly: boolean;
  showInitialTooltip: boolean;
  onSlotClick: (slotId: SlotId) => void;
  onSlotHover: (slotId: SlotId) => void;
  onSlotBlur: (slotId: SlotId) => void;
  onSelectSlot: (slotId: string | null) => void;
  modelCode: string | undefined;
  displayRotationDeg: number;
  showGlows: boolean;
  iconScaleValue: number;
  iconVisibleCompValue: number;
}) {
  return (
    <div
      className="relative h-auto w-full max-w-[1024px] rounded-[28px] border border-white/20 bg-[#010714] overflow-hidden"
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
          style={zoomLevel !== 1 ? { transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 200ms ease-out' } : undefined}
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
              const isActive = slotId === activeSlotId;
              const isSelected = editMode && slotId === selectedSlotId;
              const isNextSlot = slotId === nextSlotId;

              const showSlotGuides = showCalibrationGuides
                && (!showSelectedGuidesOnly || !editMode || slotId === selectedSlotId);

              const shouldShowTooltip = showInitialTooltip || (isNextSlot && !slots[slotId]?.iconId);

              return (
                <MemoizedKeypadSlot
                  key={slotId}
                  slotId={slotId}
                  slotIndex={slotIndex}
                  slotEntry={slotEntry}
                  slotVisual={slotVisual}
                  isActive={isActive}
                  isSelected={isSelected}
                  isNextSlot={isNextSlot}
                  showSlotGuides={showSlotGuides}
                  iconScaleValue={iconScaleValue}
                  iconVisibleCompValue={iconVisibleCompValue}
                  onSlotClick={onSlotClick}
                  onMouseEnter={onSlotHover}
                  onMouseLeave={onSlotBlur}
                  onFocus={onSlotHover}
                  onBlur={onSlotBlur}
                  editMode={editMode}
                  setSelectedSlotId={onSelectSlot}
                  safeSvgIdPrefix={safeSvgIdPrefix}
                  modelCode={modelCode}
                  shouldShowTooltip={Boolean(shouldShowTooltip)}
                  visualRotationDeg={displayRotationDeg}
                  showGlows={showGlows}
                />
              );
            })}
          </g>
        </svg >
      ) : (
        <div className="grid h-full w-full place-items-center text-sm font-semibold text-blue-100/80">
          Shell render pending
        </div>
      )
      }
    </div>
  );
}

function useCopyStatusAutoReset({
  status,
  onReset,
}: {
  status: CopyStatus;
  onReset: () => void;
}) {
  useEffect(() => {
    if (status === 'idle') return;
    if (typeof window === 'undefined') return;

    const timeoutId = window.setTimeout(() => {
      onReset();
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [status, onReset]);
}

function usePreviewKeyboardEditing({
  editMode,
  selectedSlotId,
  slotIdByKey,
  setEditableLayout,
  dispatchUi,
}: {
  editMode: boolean;
  selectedSlotId: string | null;
  slotIdByKey: Record<string, string>;
  setEditableLayout: Dispatch<SetStateAction<ModelLayout>>;
  dispatchUi: Dispatch<PreviewUiAction>;
}) {
  const onEditorKeyDown = useCallback((event: KeyboardEvent) => {
    if (!editMode) return;
    if (isEditableTarget(event.target)) return;

    const lowerKey = event.key.toLowerCase();
    const mappedSlotId = slotIdByKey[lowerKey];
    if (mappedSlotId) {
      event.preventDefault();
      dispatchUi({ type: 'setSelectedSlot', slotId: mappedSlotId });
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
      dispatchUi({ type: 'nudgeEditableIconScale', delta: dIconScale });
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
  }, [dispatchUi, editMode, selectedSlotId, setEditableLayout, slotIdByKey]);

  useEffect(() => {
    window.addEventListener('keydown', onEditorKeyDown);
    return () => {
      window.removeEventListener('keydown', onEditorKeyDown);
    };
  }, [onEditorKeyDown]);
}

function getInitialZoomForModel(model: string | undefined) {
  if (model === 'PKP-2200-SI') return 1.5;
  if (model === 'PKP-2300-SI') return 1.25;
  return 1;
}

function usePreviewCopyActions({
  editMode,
  editableLayout,
  renderLayout,
  editableIconScale,
  iconVisibleCompValue,
  dispatchUi,
}: {
  editMode: boolean;
  editableLayout: ModelLayout;
  renderLayout: ModelLayout;
  editableIconScale: number;
  iconVisibleCompValue: number;
  dispatchUi: Dispatch<PreviewUiAction>;
}) {
  const onCopyJson = useCallback(async () => {
    if (!editMode || typeof navigator === 'undefined' || !navigator.clipboard) {
      dispatchUi({ type: 'setLayoutCopyStatus', status: 'error' });
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
      dispatchUi({ type: 'setLayoutCopyStatus', status: 'copied' });
    } catch {
      dispatchUi({ type: 'setLayoutCopyStatus', status: 'error' });
    }
  }, [dispatchUi, editMode, editableLayout]);

  const onCopyTuningJson = useCallback(async () => {
    if (!editMode || typeof navigator === 'undefined' || !navigator.clipboard) {
      dispatchUi({ type: 'setTuningCopyStatus', status: 'error' });
      return;
    }

    try {
      const tuning = {
        model: renderLayout.model,
        iconScale: round2(editableIconScale),
        iconVisibleComp: round2(iconVisibleCompValue),
      };
      await navigator.clipboard.writeText(JSON.stringify(tuning, null, 2));
      dispatchUi({ type: 'setTuningCopyStatus', status: 'copied' });
    } catch {
      dispatchUi({ type: 'setTuningCopyStatus', status: 'error' });
    }
  }, [dispatchUi, editMode, editableIconScale, iconVisibleCompValue, renderLayout.model]);

  return { onCopyJson, onCopyTuningJson };
}

function useAnimatedRotation(rotationDeg: number) {
  const initialRotationRef = useRef(rotationDeg);
  const [displayRotationDeg, setDisplayRotationDeg] = useState(() => initialRotationRef.current);
  const displayRotationRef = useRef(initialRotationRef.current);
  const rotationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    displayRotationRef.current = displayRotationDeg;
  }, [displayRotationDeg]);

  useEffect(() => {
    if (Math.abs(displayRotationRef.current - rotationDeg) < 0.001) return;

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

  return displayRotationDeg;
}

function useShellNaturalSize({
  shellSrc,
  debugMode,
  model,
  baseW,
  baseH,
}: {
  shellSrc: string;
  debugMode: boolean;
  model: string;
  baseW: number;
  baseH: number;
}) {
  const [shellNaturalSize, setShellNaturalSize] = useState<IntrinsicSize | null>(null);

  const updateShellNaturalSize = useCallback((nextSize: IntrinsicSize | null) => {
    setShellNaturalSize((previous) => {
      if (!nextSize) return previous === null ? previous : null;
      if (previous?.width === nextSize.width && previous?.height === nextSize.height) return previous;
      return nextSize;
    });
  }, []);

  useEffect(() => {
    if (!shellSrc) {
      updateShellNaturalSize(null);
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
        updateShellNaturalSize(null);
        return;
      }
      updateShellNaturalSize({ width, height });
    };
    image.onerror = () => {
      if (cancelled) return;
      updateShellNaturalSize(null);
    };
    image.src = shellSrc;

    return () => {
      cancelled = true;
    };
  }, [shellSrc, updateShellNaturalSize]);

  const hasNaturalSizeMismatch = Boolean(
    shellNaturalSize
    && (shellNaturalSize.width !== baseW || shellNaturalSize.height !== baseH),
  );

  useEffect(() => {
    if (!debugMode || !hasNaturalSizeMismatch || !shellNaturalSize) return;
    console.warn(
      `[KeypadPreview] base size mismatch for ${model}: base=${baseW}x${baseH}, natural=${shellNaturalSize.width}x${shellNaturalSize.height}`,
    );
  }, [baseH, baseW, debugMode, hasNaturalSizeMismatch, model, shellNaturalSize]);

  return { shellNaturalSize, hasNaturalSizeMismatch };
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
  onResetSlots,
  onZoom,
  description,
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
  onResetSlots?: () => void;
  onZoom?: (direction: 'in' | 'out') => void;
  description?: string;
}) {
  const baseLayout = useMemo(() => getLayoutForModel(modelCode), [modelCode]);

  const [editableLayout, setEditableLayout] = useState<ModelLayout>(() => cloneModelLayout(baseLayout));
  const [uiState, dispatchUi] = useReducer(previewUiReducer, {
    selectedSlotId: null,
    showSelectedGuidesOnly: false,
    hoveredSlotId: null,
    layoutCopyStatus: 'idle',
    tuningCopyStatus: 'idle',
    editableIconScale: normalizeIconScale(iconScale),
  } as PreviewUiState);
  const {
    selectedSlotId,
    showSelectedGuidesOnly,
    hoveredSlotId,
    layoutCopyStatus,
    tuningCopyStatus,
    editableIconScale,
  } = uiState;
  const displayRotationDeg = useAnimatedRotation(rotationDeg);
  const [zoomLevel, setZoomLevel] = useState(() => getInitialZoomForModel(modelCode));
  const showInitialTooltip = true;

  useEffect(() => {
    setEditableLayout(cloneModelLayout(baseLayout));
    setZoomLevel(getInitialZoomForModel(baseLayout.model));
  }, [baseLayout]);

  useEffect(() => {
    dispatchUi({ type: 'setEditableIconScale', value: normalizeIconScale(iconScale) });
  }, [baseLayout.model, iconScale]);

  const renderLayout = editMode ? editableLayout : baseLayout;
  const slotIds = useMemo(() => getSlotIdsForLayout(renderLayout), [renderLayout]);
  const nextSlotId = useMemo(() => slotIds.find((id) => !slots[id]?.iconId), [slotIds, slots]);
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
    dispatchUi({ type: 'syncEditMode', editMode, slotIds });
  }, [editMode, slotIds]);

  const selectedSlot = useMemo(
    () => (selectedSlotId
      ? (renderLayout.slots.find((slotEntry) => slotEntry.id === selectedSlotId) ?? null)
      : null),
    [renderLayout.slots, selectedSlotId],
  );

  const handleSlotHover = useCallback((id: SlotId) => {
    dispatchUi({ type: 'setHoveredSlot', slotId: id });
  }, []);

  const clearSlotHover = useCallback((id: SlotId) => {
    dispatchUi({ type: 'clearHoveredSlotIfMatch', slotId: id });
  }, []);

  const selectSlot = useCallback((slotId: string | null) => {
    dispatchUi({ type: 'setSelectedSlot', slotId });
  }, []);
  const isAnySlotHovered = hoveredSlotId !== null;

  usePreviewKeyboardEditing({
    editMode,
    selectedSlotId,
    slotIdByKey,
    setEditableLayout,
    dispatchUi,
  });

  useCopyStatusAutoReset({
    status: layoutCopyStatus,
    onReset: () => {
      dispatchUi({ type: 'setLayoutCopyStatus', status: 'idle' });
    },
  });

  useCopyStatusAutoReset({
    status: tuningCopyStatus,
    onReset: () => {
      dispatchUi({ type: 'setTuningCopyStatus', status: 'idle' });
    },
  });
  const { onCopyJson, onCopyTuningJson } = usePreviewCopyActions({
    editMode,
    editableLayout,
    renderLayout,
    editableIconScale,
    iconVisibleCompValue,
    dispatchUi,
  });

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
  const { shellNaturalSize, hasNaturalSizeMismatch } = useShellNaturalSize({
    shellSrc,
    debugMode,
    model: renderLayout.model,
    baseW,
    baseH,
  });
  const svgIdPrefix = useId();
  const safeSvgIdPrefix = useMemo(() => sanitizeSvgId(svgIdPrefix), [svgIdPrefix]);
  const visualRotationDeg = Math.abs(displayRotationDeg) < 0.001 ? 0 : displayRotationDeg;
  const groupTransform = [
    `translate(${padX} ${padY})`,
    visualRotationDeg ? `rotate(${visualRotationDeg} ${baseW / 2} ${baseH / 2})` : '',
  ].filter(Boolean).join(' ');
  const layoutLabel = MODEL_LAYOUT_LABELS[renderLayout.model] ?? `${renderLayout.slots.length} slots`;

  return (
    <div
      className="card glow-isolate relative flex h-full flex-col overflow-hidden border border-white/10 bg-deep-navy py-[50px] px-6 shadow-2xl"
      data-slot-hovered={isAnySlotHovered ? 'true' : 'false'}
    >
      {editMode ? (
        <KeypadPreviewEditPanel
          showSelectedGuidesOnly={showSelectedGuidesOnly}
          onToggleShowSelectedGuidesOnly={() => dispatchUi({ type: 'toggleShowSelectedGuidesOnly' })}
          onCopyJson={() => {
            void onCopyJson();
          }}
          onCopyTuningJson={() => {
            void onCopyTuningJson();
          }}
          selectedSlotId={selectedSlotId}
          selectedSlot={selectedSlot}
          iconScaleValue={iconScaleValue}
          iconVisibleCompValue={iconVisibleCompValue}
          effectiveIconMultiplier={effectiveIconMultiplier}
          slotBindingList={slotBindingList}
          layoutCopyStatus={layoutCopyStatus}
          tuningCopyStatus={tuningCopyStatus}
        />
      ) : null}

      <div className="flex flex-1 w-full flex-col items-center justify-center">
        <KeypadPreviewToolbar
          layoutLabel={layoutLabel}
          onZoomOut={() => {
            setZoomLevel((previous) => Math.max(0.5, previous - 0.25));
          }}
          onZoomIn={() => {
            setZoomLevel((previous) => Math.min(2.5, previous + 0.25));
          }}
          onRotate={onRotate}
          onResetSlots={onResetSlots}
        />
        <KeypadPreviewCanvas
          showCalibrationGuides={showCalibrationGuides}
          debugMode={debugMode}
          shellNaturalSize={shellNaturalSize}
          hasNaturalSizeMismatch={hasNaturalSizeMismatch}
          shellSrc={shellSrc}
          vbW={vbW}
          vbH={vbH}
          renderLayout={renderLayout}
          zoomLevel={zoomLevel}
          groupTransform={groupTransform}
          slotIds={slotIds}
          baseW={baseW}
          baseH={baseH}
          safeSvgIdPrefix={safeSvgIdPrefix}
          slots={slots}
          activeSlotId={activeSlotId}
          editMode={editMode}
          selectedSlotId={selectedSlotId}
          nextSlotId={nextSlotId}
          showSelectedGuidesOnly={showSelectedGuidesOnly}
          showInitialTooltip={showInitialTooltip}
          onSlotClick={onSlotClick}
          onSlotHover={handleSlotHover}
          onSlotBlur={clearSlotHover}
          onSelectSlot={selectSlot}
          modelCode={modelCode}
          displayRotationDeg={displayRotationDeg}
          showGlows={showGlows}
          iconScaleValue={iconScaleValue}
          iconVisibleCompValue={iconVisibleCompValue}
        />
      </div>

      <div className="mt-4 space-y-1 text-xs text-white/90">
        <h3 className="text-lg font-medium text-white mb-2 leading-relaxed">Select a button insert for each slot, then pick a ring glow color to preview your final keypad layout.</h3>
        {descriptionText ? <p className="text-[#d7e8ff]/90">{descriptionText}</p> : null}
      </div>
    </div>
  );
}
