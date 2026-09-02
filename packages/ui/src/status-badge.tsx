import * as React from "react";

export type StatusType = "UP" | "DOWN" | "PAUSED" | "UNKNOWN" | "DEGRADED";
export type StatusBadgeSize = "sm" | "md" | "lg";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType | string;
  size?: StatusBadgeSize;
  withDot?: boolean;
  withBorder?: boolean;
  pulse?: boolean;
  className?: string;
}

interface StatusConfigItem {
  bg: string;
  text: string;
  dotColor: string;
  label: string;
}

const defaultConfig: StatusConfigItem = {
  bg: "bg-surface-container",
  text: "text-ink-muted",
  dotColor: "bg-ink-muted",
  label: "UNKNOWN",
};

const statusConfig: Record<string, StatusConfigItem> = {
  UP: {
    bg: "bg-brand-lime",
    text: "text-black",
    dotColor: "bg-black",
    label: "UP",
  },
  DOWN: {
    bg: "bg-alert-red",
    text: "text-white",
    dotColor: "bg-white",
    label: "DOWN",
  },
  PAUSED: {
    bg: "bg-surface-container-highest",
    text: "text-ink-secondary",
    dotColor: "bg-ink-muted",
    label: "PAUSED",
  },
  DEGRADED: {
    bg: "bg-[#ffd600]",
    text: "text-black",
    dotColor: "bg-black",
    label: "DEGRADED",
  },
  UNKNOWN: defaultConfig,
};

const sizeStyles: Record<StatusBadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
  lg: "px-3.5 py-1.5 text-sm gap-2",
};

export function StatusBadge({
  status,
  size = "md",
  withDot = true,
  withBorder = true,
  pulse = false,
  className = "",
  ...props
}: StatusBadgeProps) {
  const normalizedStatus = (status || "UNKNOWN").toUpperCase();
  const config = statusConfig[normalizedStatus] ?? defaultConfig;
  const sizeStyle = sizeStyles[size];
  const borderStyle = withBorder ? "border-2 border-border brutal-shadow-sm" : "";

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider select-none ${config.bg} ${config.text} ${sizeStyle} ${borderStyle} ${className}`}
      {...props}
    >
      {withDot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && normalizedStatus === "UP" && (
            <span className="absolute inline-flex h-full w-full animate-ping opacity-75 bg-black" />
          )}
          {pulse && normalizedStatus === "DOWN" && (
            <span className="absolute inline-flex h-full w-full animate-ping opacity-75 bg-white" />
          )}
          <span className={`relative inline-flex h-2 w-2 ${config.dotColor}`} />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
}
