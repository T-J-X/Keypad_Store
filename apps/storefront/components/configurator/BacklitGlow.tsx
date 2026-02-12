'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type BacklitGlowProps = {
  idBase: string;
  cx: number;
  cy: number;
  rOuter: number;
  rInner: number;
  buttonDiameterPx: number;
  color: string;
  opacity?: number;
  transitionMs?: number;
};

type GlowFrame = {
  r: number;
  g: number;
  b: number;
  alpha: number;
  blurNear: number;
  blurFar: number;
  intensity: number;
};

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

function mix(a: number, b: number, progress: number) {
  return a + ((b - a) * progress);
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

function luminance(r: number, g: number, b: number) {
  return ((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) / 255;
}

function buildGlowTarget(
  color: string,
  buttonDiameterPx: number,
  opacity: number,
): GlowFrame {
  const [r, g, b] = parseHexColor(color) ?? [30, 167, 255];
  const lum = luminance(r, g, b);
  const blurNear = Math.max(1.1, buttonDiameterPx * 0.022);
  const blurFar = Math.max(2.1, buttonDiameterPx * 0.062);
  const intensity = 1.1 + ((1 - lum) * 0.55);

  return {
    r,
    g,
    b,
    alpha: clamp01(opacity),
    blurNear,
    blurFar,
    intensity,
  };
}

export default function BacklitGlow({
  idBase,
  cx,
  cy,
  rOuter,
  rInner,
  buttonDiameterPx,
  color,
  opacity = 0.46,
  transitionMs = 190,
}: BacklitGlowProps) {
  const glowPath = useMemo(() => donutPath(cx, cy, rOuter, rInner), [cx, cy, rOuter, rInner]);
  const target = useMemo(
    () => buildGlowTarget(color, buttonDiameterPx, opacity),
    [buttonDiameterPx, color, opacity],
  );

  const [frame, setFrame] = useState<GlowFrame>(target);
  const frameRef = useRef<GlowFrame>(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  useEffect(() => {
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (typeof window === 'undefined') {
      setFrame(target);
      return;
    }

    const start = frameRef.current;
    const startTs = window.performance.now();

    const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

    const tick = (timestamp: number) => {
      const progress = clamp01((timestamp - startTs) / transitionMs);
      const eased = easeOutCubic(progress);
      setFrame({
        r: mix(start.r, target.r, eased),
        g: mix(start.g, target.g, eased),
        b: mix(start.b, target.b, eased),
        alpha: mix(start.alpha, target.alpha, eased),
        blurNear: mix(start.blurNear, target.blurNear, eased),
        blurFar: mix(start.blurFar, target.blurFar, eased),
        intensity: mix(start.intensity, target.intensity, eased),
      });

      if (progress < 1) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, transitionMs]);

  const colorMatrixValues = useMemo(() => {
    const colorGain = frame.intensity / 255;
    const alphaGain = Math.max(0.85, frame.alpha * 2.25);
    return [
      `0 0 0 ${frame.r * colorGain} 0`,
      `0 0 0 ${frame.g * colorGain} 0`,
      `0 0 0 ${frame.b * colorGain} 0`,
      `0 0 0 ${alphaGain} 0`,
    ].join(' ');
  }, [frame.alpha, frame.b, frame.g, frame.intensity, frame.r]);

  const cssColor = `rgb(${Math.round(frame.r)} ${Math.round(frame.g)} ${Math.round(frame.b)})`;

  return (
    <g className="backlit-glow-pulse" style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
      <defs>
        <filter
          id={`${idBase}-backlit`}
          filterUnits="userSpaceOnUse"
          x={cx - (buttonDiameterPx * 1.35)}
          y={cy - (buttonDiameterPx * 1.35)}
          width={buttonDiameterPx * 2.7}
          height={buttonDiameterPx * 2.7}
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation={frame.blurNear} result="haloNear" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={frame.blurFar} result="haloFar" />
          <feMerge result="haloBlend">
            <feMergeNode in="haloNear" />
            <feMergeNode in="haloFar" />
          </feMerge>
          <feColorMatrix in="haloBlend" type="matrix" values={colorMatrixValues} result="tintedGlow" />
        </filter>
      </defs>

      <path
        d={glowPath}
        fill="#ffffff"
        fillRule="evenodd"
        opacity={Math.max(0.28, frame.alpha * 0.86)}
        filter={`url(#${idBase}-backlit)`}
      />
      <path
        d={glowPath}
        fill={cssColor}
        fillRule="evenodd"
        opacity={Math.min(0.92, frame.alpha * 0.74)}
      />
    </g>
  );
}
