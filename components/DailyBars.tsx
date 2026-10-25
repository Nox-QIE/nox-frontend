"use client";

import { useState } from "react";
import type { DayPoint } from "@/lib/metrics";

const W = 640;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 26, left: 32 };
const BAR = "#3fa98a"; // validated: lightness band + 3:1 contrast on #161b33

/** Daily active signers: one series, so the title names it and no legend box is needed. */
export function DailyBars({ data, label, format }: { data: DayPoint[]; label: (d: DayPoint) => string; format: (day: string) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.signers));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.max(2, slot - 2); // 2px gap between bars
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, Math.ceil(max / 2), max].filter((v, i, a) => a.indexOf(v) === i);
  const h = hover !== null ? data[hover] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={data.map(label).join("; ")} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#2e3762" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#aeb6d6">
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + i * slot + 1;
          const top = y(d.signers);
          const hgt = PAD.top + plotH - top;
          const r = Math.min(4, hgt / 2, barW / 2);
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={d.signers ? 0 : -1}>
              {/* hit target taller than the bar */}
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              {d.signers > 0 && (
                <path
                  d={`M${x},${PAD.top + plotH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${PAD.top + plotH} Z`}
                  fill={BAR}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
            </g>
          );
        })}
        {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
          <text key={i} x={PAD.left + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="#aeb6d6">
            {format(data[i]!.day)}
          </text>
        ))}
      </svg>
      {h && (
        <div
          role="status"
          style={{
            position: "absolute",
            top: 0,
            left: `${Math.min(80, ((PAD.left + (hover! + 0.5) * slot) / W) * 100)}%`,
            transform: "translateX(-50%)",
            background: "#1e2546",
            border: "1px solid #2e3762",
            borderRadius: 8,
            padding: "0.35rem 0.6rem",
            fontSize: "0.85rem",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {label(h)}
        </div>
      )}
    </div>
  );
}
