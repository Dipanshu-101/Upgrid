"use client";

import * as React from "react";

export interface DataPoint {
  timestamp: string | Date;
  value: number; // response time in ms
  status?: "Up" | "Down" | "Unknown" | string;
  region?: string;
}

export interface ResponseTimeChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: DataPoint[];
  title?: string;
  height?: number;
  strokeColor?: string;
  showHistogram?: boolean;
  className?: string;
}

export function ResponseTimeChart({
  data = [],
  title = "RESPONSE TIME (MS)",
  height = 240,
  strokeColor = "#ccff00",
  showHistogram = false,
  className = "",
  ...props
}: ResponseTimeChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = React.useState<{
    point: DataPoint;
    x: number;
    y: number;
  } | null>(null);

  // Generate mock telemetry if data is empty
  const chartData: DataPoint[] = React.useMemo(() => {
    if (data.length > 0) return data;
    const now = Date.now();
    return Array.from({ length: 24 }).map((_, i) => {
      const time = new Date(now - (23 - i) * 60 * 1000 * 5);
      const isDown = i === 14;
      return {
        timestamp: time,
        value: isDown ? 0 : Math.floor(120 + Math.sin(i / 2) * 40 + (i % 3) * 15),
        status: isDown ? "Down" : "Up",
        region: "AP-SOUTH-1",
      };
    });
  }, [data]);

  // Compute summary stats
  const { min, max, avg, p95 } = React.useMemo(() => {
    const validValues = chartData.filter((d) => d.value > 0).map((d) => d.value);
    if (validValues.length === 0) return { min: 0, max: 0, avg: 0, p95: 0 };

    const sorted = [...validValues].sort((a, b) => a - b);
    const sum = validValues.reduce((acc, v) => acc + v, 0);
    const avgVal = Math.round(sum / validValues.length);
    const minVal = sorted[0] ?? 0;
    const maxVal = sorted[sorted.length - 1] ?? 0;
    const p95Idx = Math.floor(sorted.length * 0.95);
    const p95Val = sorted[p95Idx] ?? maxVal;

    return { min: minVal, max: maxVal, avg: avgVal, p95: p95Val };
  }, [chartData]);

  // Chart coordinate mapping
  const maxY = Math.max(max * 1.25, 200);
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const width = 800; // SVG viewBox width
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const points = chartData.map((d, i) => {
    const x =
      paddingLeft + (i / Math.max(chartData.length - 1, 1)) * plotWidth;
    const y = paddingTop + plotHeight - (d.value / maxY) * plotHeight;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    let closest = points[0]!;
    let minDiff = Math.abs(mouseX - closest.x);

    for (const pt of points) {
      const diff = Math.abs(mouseX - pt.x);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }

    setHoveredPoint({
      point: closest.data,
      x: closest.x,
      y: closest.y,
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col border-2 border-border bg-surface brutal-shadow text-ink select-none ${className}`}
      {...props}
    >
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border bg-surface-container px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">ssid_chart</span>
          <span>{title}</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div>
            <span className="text-ink-muted mr-1">AVG:</span>
            <span className="text-brand-lime font-mono font-bold bg-black px-1">
              {avg}ms
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-ink-muted mr-1">P95:</span>
            <span>{p95}ms</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-ink-muted mr-1">MIN:</span>
            <span>{min}ms</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-ink-muted mr-1">MAX:</span>
            <span>{max}ms</span>
          </div>
        </div>
      </div>

      {/* Main SVG Plot Area */}
      <div className="relative p-2 sm:p-4 bg-surface">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Horizontal Grid Lines & Y-Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + plotHeight * (1 - ratio);
            const val = Math.round(maxY * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--color-grid-line)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-ink-muted font-mono text-[9px] font-bold"
                >
                  {val}ms
                </text>
              </g>
            );
          })}

          {/* Histogram Bars (optional) */}
          {showHistogram &&
            points.map((pt, idx) => {
              const barWidth = Math.max(plotWidth / points.length - 2, 2);
              const barHeight = paddingTop + plotHeight - pt.y;
              return (
                <rect
                  key={idx}
                  x={pt.x - barWidth / 2}
                  y={pt.y}
                  width={barWidth}
                  height={barHeight}
                  fill={pt.data.status === "Down" ? "#ba1a1a" : strokeColor}
                  opacity="0.25"
                />
              );
            })}

          {/* Pure 2px Sharp Line Chart */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="miter"
            strokeLinecap="square"
          />

          {/* Base Axis Border Line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + plotHeight}
            x2={width - paddingRight}
            y2={paddingTop + plotHeight}
            stroke="var(--color-border)"
            strokeWidth="2"
          />

          {/* Time Labels on X-Axis */}
          {points.length > 0 &&
            [0, Math.floor(points.length / 2), points.length - 1].map((idx) => {
              const pt = points[idx];
              if (!pt) return null;
              const dateObj = new Date(pt.data.timestamp);
              const timeLabel = dateObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <text
                  key={idx}
                  x={pt.x}
                  y={height - 6}
                  textAnchor={idx === 0 ? "start" : idx === points.length - 1 ? "end" : "middle"}
                  className="fill-ink-muted font-mono text-[10px] font-bold uppercase"
                >
                  {timeLabel}
                </text>
              );
            })}

          {/* Interactive Inspection Cursor */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={paddingTop + plotHeight}
                stroke="var(--color-border)"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <rect
                x={hoveredPoint.x - 4}
                y={hoveredPoint.y - 4}
                width="8"
                height="8"
                fill={hoveredPoint.point.status === "Down" ? "#ba1a1a" : strokeColor}
                stroke="var(--color-border)"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Readout */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none border-2 border-border bg-surface text-ink p-2 font-mono text-xs brutal-shadow-sm flex flex-col gap-1 -translate-y-full -mt-2 -translate-x-1/2"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border pb-1 font-bold">
              <span
                className={
                  hoveredPoint.point.status === "Down"
                    ? "text-alert-red"
                    : "text-brand-lime"
                }
              >
                {hoveredPoint.point.status === "Down" ? "● DOWN" : "● UP"}
              </span>
              <span>{hoveredPoint.point.value}ms</span>
            </div>
            <div className="text-[10px] text-ink-secondary flex justify-between gap-2">
              <span>{new Date(hoveredPoint.point.timestamp).toLocaleTimeString()}</span>
              {hoveredPoint.point.region && (
                <span className="font-bold">[{hoveredPoint.point.region}]</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
