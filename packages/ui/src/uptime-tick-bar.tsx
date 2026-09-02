"use client";

import * as React from "react";

export interface TickData {
  id?: string;
  status: "Up" | "Down" | "Unknown" | string;
  responseTimeMs?: number;
  region?: string;
  timestamp?: string | Date;
}

export interface UptimeTickBarProps extends React.HTMLAttributes<HTMLDivElement> {
  ticks?: TickData[];
  totalSlots?: number;
  uptimePercentage?: number | string;
  startLabel?: string;
  endLabel?: string;
  barHeight?: "sm" | "md" | "lg";
  compact?: boolean;
  className?: string;
}

const heightStyles = {
  sm: "h-4",
  md: "h-7 sm:h-8",
  lg: "h-10 sm:h-12",
};

export function UptimeTickBar({
  ticks = [],
  totalSlots = 40,
  uptimePercentage = "99.98%",
  startLabel = "90 DAYS AGO",
  endLabel = "TODAY",
  barHeight = "md",
  compact = false,
  className = "",
  ...props
}: UptimeTickBarProps) {
  const [activeTick, setActiveTick] = React.useState<{
    tick: TickData;
    index: number;
    x: number;
    y: number;
  } | null>(null);

  // Fill array to totalSlots if fewer ticks provided
  const displayTicks: TickData[] = React.useMemo(() => {
    if (ticks.length >= totalSlots) {
      return ticks.slice(-totalSlots);
    }
    const emptyCount = totalSlots - ticks.length;
    const padding: TickData[] = Array.from({ length: emptyCount }).map(() => ({
      status: "Unknown",
    }));
    return [...padding, ...ticks];
  }, [ticks, totalSlots]);

  const heightClass = heightStyles[barHeight];

  return (
    <div className={`relative flex flex-col w-full select-none ${className}`} {...props}>
      {/* Interactive Tooltip Overlay */}
      {activeTick && activeTick.tick.status !== "Unknown" && (
        <div
          className="absolute -top-12 z-30 pointer-events-none flex flex-col items-center -translate-x-1/2"
          style={{ left: `${(activeTick.index / (displayTicks.length - 1)) * 100}%` }}
        >
          <div className="border-2 border-border bg-surface text-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase brutal-shadow-sm flex items-center gap-2 whitespace-nowrap">
            <span
              className={`h-2 w-2 inline-block ${
                activeTick.tick.status.toUpperCase() === "UP"
                  ? "bg-brand-lime"
                  : "bg-alert-red"
              }`}
            />
            <span>{activeTick.tick.status.toUpperCase()}</span>
            {activeTick.tick.responseTimeMs !== undefined && (
              <span className="text-ink-secondary">{activeTick.tick.responseTimeMs}ms</span>
            )}
            {activeTick.tick.timestamp && (
              <span className="text-ink-muted">
                {new Date(activeTick.tick.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          <div className="w-2 h-2 bg-border rotate-45 -mt-1" />
        </div>
      )}

      {/* Discrete 4px Segment Bar Sequence */}
      <div className={`flex items-stretch gap-[2px] w-full ${heightClass}`}>
        {displayTicks.map((tick, index) => {
          const statusUpper = (tick.status || "UNKNOWN").toUpperCase();
          const isUp = statusUpper === "UP";
          const isDown = statusUpper === "DOWN";

          const bgClass = isUp
            ? "bg-brand-lime hover:brightness-110"
            : isDown
            ? "bg-alert-red hover:brightness-125"
            : "bg-surface-container hover:bg-surface-highest";

          return (
            <div
              key={tick.id || index}
              onMouseEnter={(e) => {
                if (tick.status !== "Unknown") {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setActiveTick({ tick, index, x: rect.left, y: rect.top });
                }
              }}
              onMouseLeave={() => setActiveTick(null)}
              className={`flex-1 min-w-[3px] transition-all duration-75 cursor-pointer hover:scale-y-110 ${bgClass}`}
              aria-label={`Tick ${index + 1}: ${tick.status}`}
            />
          );
        })}
      </div>

      {/* Subtext and Metrics Bar */}
      {!compact && (
        <div className="flex items-center justify-between font-mono text-[10px] font-bold text-ink-secondary uppercase tracking-widest mt-2">
          <span>{startLabel}</span>
          <span className="text-brand-lime font-black bg-black px-1.5 py-0.5 border border-border">
            {uptimePercentage} UPTIME
          </span>
          <span>{endLabel}</span>
        </div>
      )}
    </div>
  );
}
