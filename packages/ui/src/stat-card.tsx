import * as React from "react";
import { Metric, MetricProps } from "./metric";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  metric: string | number;
  unit?: string;
  sublabel?: string;
  delta?: MetricProps["delta"];
  icon?: string;
  badge?: React.ReactNode;
  variant?: "default" | "lime" | "danger" | "cyan" | "outline";
  isFailing?: boolean;
  className?: string;
}

export function StatCard({
  title,
  metric,
  unit,
  sublabel,
  delta,
  icon,
  badge,
  variant = "default",
  isFailing = false,
  className = "",
  children,
  ...props
}: StatCardProps) {
  const isAlert = isFailing || variant === "danger";

  const cardBorder = isAlert
    ? "border-2 border-alert-red"
    : variant === "lime"
    ? "border-2 border-border"
    : "border-2 border-border";

  const cardBg = isAlert
    ? "bg-surface text-ink"
    : variant === "lime"
    ? "bg-surface text-ink"
    : "bg-surface text-ink";

  const headerBg = isAlert
    ? "bg-alert-red text-white"
    : variant === "lime"
    ? "bg-brand-lime text-black"
    : variant === "cyan"
    ? "bg-accent-cyan text-black"
    : "bg-surface-container text-ink";

  return (
    <div
      className={`relative flex flex-col brutal-shadow ${cardBorder} ${cardBg} ${className}`}
      {...props}
    >
      {/* Brutalist Header Stripe */}
      <div
        className={`flex items-center justify-between border-b-2 border-border px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest ${headerBg}`}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="material-symbols-outlined text-sm shrink-0">
              {icon}
            </span>
          )}
          <span>{title}</span>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <Metric
          value={metric}
          unit={unit}
          sublabel={sublabel}
          delta={delta}
          variant={isAlert ? "danger" : variant === "lime" ? "default" : "default"}
          size="xl"
        />

        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
