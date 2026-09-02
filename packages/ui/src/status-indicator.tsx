import * as React from "react";
import { StatusType } from "./status-badge";

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType | string;
  size?: "sm" | "md" | "lg";
  ping?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3.5 w-3.5",
};

export function StatusIndicator({
  status,
  size = "md",
  ping = true,
  className = "",
  ...props
}: StatusIndicatorProps) {
  const normalized = status.toUpperCase();
  const isUp = normalized === "UP";
  const isDown = normalized === "DOWN";

  const colorClass = isUp
    ? "bg-brand-lime border-black"
    : isDown
    ? "bg-alert-red border-white"
    : "bg-ink-muted border-transparent";

  const pingColorClass = isUp ? "bg-brand-lime" : isDown ? "bg-alert-red" : "bg-ink-muted";
  const dimension = sizeConfig[size];

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 ${dimension} ${className}`}
      {...props}
    >
      {ping && (isUp || isDown) && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping opacity-75 ${pingColorClass}`}
        />
      )}
      <span className={`relative inline-flex h-full w-full border ${colorClass}`} />
    </span>
  );
}
