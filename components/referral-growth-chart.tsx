"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type GrowthPoint = { date: string; referrals: number };

type ReferralGrowthChartProps = {
  data: GrowthPoint[];
  granularity?: "daily" | "weekly" | "monthly";
  formatDate: (dateStr: string, granularity?: string) => string;
  className?: string;
};

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 240;
const PADDING = { top: 20, right: 8, bottom: 36, left: 36 };

function niceMax(value: number) {
  if (value <= 4) return Math.max(value, 1);
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

export function ReferralGrowthChart({
  data,
  granularity = "daily",
  formatDate,
  className = "",
}: ReferralGrowthChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const maxReferrals = niceMax(Math.max(...data.map((d) => d.referrals), 0));
    const yTicks = maxReferrals <= 4
      ? Array.from({ length: maxReferrals + 1 }, (_, i) => i)
      : [0, Math.round(maxReferrals / 2), maxReferrals];

    const points = data.map((day, index) => {
      const x =
        data.length === 1
          ? PADDING.left + innerWidth / 2
          : PADDING.left + (index / (data.length - 1)) * innerWidth;
      const y =
        PADDING.top + innerHeight - (day.referrals / maxReferrals) * innerHeight;
      return { ...day, x, y, index };
    });

    const linePath = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${
      PADDING.top + innerHeight
    } L ${points[0].x} ${PADDING.top + innerHeight} Z`;

    return { points, linePath, areaPath, maxReferrals, yTicks, innerHeight };
  }, [data]);

  if (!chart) return null;

  const hovered = hoveredIndex != null ? chart.points[hoveredIndex] : null;
  const showDots = data.length <= 62;

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="block h-auto w-full select-none"
        role="img"
        aria-label="Referral growth line chart"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="referralGrowthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {chart.yTicks.map((tick) => {
          const y =
            PADDING.top +
            chart.innerHeight -
            (tick / chart.maxReferrals) * chart.innerHeight;
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={CHART_WIDTH - PADDING.right}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="1"
                strokeDasharray={tick === 0 ? undefined : "4 4"}
              />
              <text
                x={PADDING.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[11px] font-semibold"
              >
                {tick}
              </text>
            </g>
          );
        })}

        <path d={chart.areaPath} fill="url(#referralGrowthFill)" />
        <path
          d={chart.linePath}
          fill="none"
          className="stroke-indigo-500"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {chart.points.map((point) => (
          <g key={point.date}>
            <rect
              x={point.x - (CHART_WIDTH / data.length) / 2}
              y={PADDING.top}
              width={CHART_WIDTH / data.length}
              height={chart.innerHeight}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(point.index)}
            />
            {showDots && point.referrals > 0 && (
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === point.index ? 5 : 3.5}
                className="fill-indigo-500 stroke-white dark:stroke-slate-900"
                strokeWidth="2"
              />
            )}
            {hoveredIndex === point.index && (
              <line
                x1={point.x}
                y1={PADDING.top}
                x2={point.x}
                y2={PADDING.top + chart.innerHeight}
                className="stroke-indigo-300 dark:stroke-indigo-700"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            )}
          </g>
        ))}

        <text
          x={PADDING.left}
          y={CHART_HEIGHT - 10}
          className="fill-slate-400 text-[11px] font-bold uppercase tracking-wider"
        >
          {formatDate(data[0].date, granularity)}
        </text>
        <text
          x={CHART_WIDTH - PADDING.right}
          y={CHART_HEIGHT - 10}
          textAnchor="end"
          className="fill-slate-400 text-[11px] font-bold uppercase tracking-wider"
        >
          {formatDate(data[data.length - 1].date, granularity)}
        </text>
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900"
          style={{
            left: `${(hovered.x / CHART_WIDTH) * 100}%`,
            top: "8px",
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-bold text-slate-900 dark:text-white">
            {formatDate(hovered.date, granularity)}
          </p>
          <p className="text-indigo-600 font-black mt-0.5">
            {hovered.referrals} referral{hovered.referrals === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}
