import React, { useEffect, useRef, useState } from "react";

/**
 * Minimal single-series charts in SVG. One hue (brand green), thin marks with
 * rounded data ends anchored to the baseline, recessive grid, and a hover
 * tooltip on every mark with a hit area larger than the mark itself.
 */

const INK = "#1d1d1f";
const MUTED = "#6e6e73";
const GRID = "#eeeeef";
const MARK = "#0a7a4b";
const MARK_HOVER = "#075f3c";

export interface BarDatum {
  key: string;
  label: string; // axis label
  value: number;
  tooltip: React.ReactNode;
}

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** Vertical bars with a rounded top (4px) and square base. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h);
  if (h <= 0) return "";
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

export const BarChart: React.FC<{
  data: BarDatum[];
  height?: number;
  ariaLabel: string;
  /** Show every nth axis label to avoid collisions. */
  labelEvery?: number;
}> = ({ data, height = 160, ariaLabel, labelEvery }) => {
  const [hover, setHover] = useState<number | null>(null);
  // Draw at the container's real pixel width so text never scales down.
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, Math.round(entry.contentRect.width))),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pad = { top: 8, right: 4, bottom: 22, left: 28 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const slot = innerW / Math.max(1, data.length);
  const gap = 2;
  const barW = Math.max(2, Math.min(28, slot - gap * 2));
  // Roughly one label per 56px so axis labels never collide.
  const every = Math.max(
    labelEvery ?? 1,
    Math.ceil((data.length * 56) / innerW),
  );
  const ticks = [0, max / 2, max];

  return (
    <div className="relative" ref={box}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block"
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => {
          const y = pad.top + innerH - (t / max) * innerH;
          return (
            <g key={t}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke={GRID}
                strokeWidth={1}
              />
              <text
                x={pad.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={10}
                fill={MUTED}
              >
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = pad.left + i * slot + (slot - barW) / 2;
          const y = pad.top + innerH - h;
          return (
            <g key={d.key}>
              <path
                d={barPath(x, y, barW, h)}
                fill={hover === i ? MARK_HOVER : MARK}
              />
              {i % every === 0 && (
                <text
                  x={x + barW / 2}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize={10}
                  fill={MUTED}
                >
                  {d.label}
                </text>
              )}
              {/* Hit target: the whole column, not just the bar. */}
              <rect
                x={pad.left + i * slot}
                y={pad.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${d.label}: ${d.value}`}
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-[#e5e5ea] bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${((pad.left + hover * slot + slot / 2) / width) * 100}%`,
            color: INK,
          }}
        >
          {data[hover].tooltip}
        </div>
      )}
    </div>
  );
};

/** Horizontal funnel: each step's bar is its share of the first step. */
export const FunnelChart: React.FC<{
  steps: { label: string; value: number; hint: string }[];
}> = ({ steps }) => {
  const top = Math.max(1, steps[0]?.value ?? 1);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <ol className="space-y-2.5" aria-label="Conversion funnel">
      {steps.map((s, i) => {
        const pct = (s.value / top) * 100;
        const prev = i > 0 ? steps[i - 1].value : null;
        const stepRate = prev ? (s.value / prev) * 100 : null;
        const lost = prev !== null ? prev - s.value : 0;
        return (
          <li
            key={s.label}
            className="relative"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="font-semibold text-stone-800">{s.label}</span>
              <span className="tabular-nums text-stone-600">
                <strong className="text-stone-950">
                  {s.value.toLocaleString()}
                </strong>
                {i > 0 && (
                  <span className="ml-1.5">
                    ({pct.toFixed(pct < 10 ? 1 : 0)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-[#f2f2f4]">
              <div
                className="h-3 rounded-full transition-[width]"
                style={{
                  width: `${Math.max(pct, s.value > 0 ? 1.5 : 0)}%`,
                  background: hover === i ? MARK_HOVER : MARK,
                }}
              />
            </div>
            {stepRate !== null && (
              <div className="mt-0.5 text-[11px] text-stone-500">
                {stepRate.toFixed(0)}% of the previous step
                {lost > 0 && ` · ${lost.toLocaleString()} dropped off here`}
              </div>
            )}
            {hover === i && (
              <div className="pointer-events-none absolute right-0 -top-9 z-10 max-w-xs rounded-lg border border-[#e5e5ea] bg-white px-3 py-2 text-[11px] text-stone-700 shadow-lg">
                {s.hint}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

/** Compact ranked table with an inline magnitude bar. */
export const RankTable: React.FC<{
  rows: { label: string; value: number; extra?: React.ReactNode }[];
  valueLabel: string;
  extraLabel?: string;
  empty?: string;
  mono?: boolean;
}> = ({ rows, valueLabel, extraLabel, empty = "No data yet", mono }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) {
    return <p className="py-4 text-center text-xs text-stone-400">{empty}</p>;
  }
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-[10px] uppercase tracking-[0.06em] text-stone-500">
          <th className="pb-1.5 text-left font-semibold" />
          <th className="pb-1.5 text-right font-semibold">{valueLabel}</th>
          {extraLabel && (
            <th className="pb-1.5 pl-3 text-right font-semibold">
              {extraLabel}
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-t border-[#f2f2f4]">
            <td className="py-1.5 pr-3">
              <div
                className={`truncate text-stone-800 ${mono ? "font-mono text-[11px]" : ""}`}
                title={r.label}
              >
                {r.label}
              </div>
              <div className="mt-1 h-1 rounded-full bg-[#f2f2f4]">
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${(r.value / max) * 100}%`,
                    background: MARK,
                  }}
                />
              </div>
            </td>
            <td className="py-1.5 text-right font-semibold tabular-nums text-stone-950">
              {r.value.toLocaleString()}
            </td>
            {extraLabel && (
              <td className="py-1.5 pl-3 text-right tabular-nums text-stone-600">
                {r.extra}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
