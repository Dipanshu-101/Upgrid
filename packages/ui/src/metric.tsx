import * as React from "react";

export interface MetricProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  unit?: string;
  label?: string;
  sublabel?: string;
  delta?: {
    value: string | number;
    type?: "positive" | "negative" | "neutral";
    label?: string;
  };
  variant?: "default" | "lime" | "danger" | "cyan";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeValueStyles = {
  sm: "text-2xl",
  md: "text-3xl sm:text-4xl",
  lg: "text-4xl sm:text-5xl",
  xl: "text-5xl sm:text-6xl md:text-7xl",
};

export function Metric({
  value,
  unit,
  label,
  sublabel,
  delta,
  variant = "default",
  size = "lg",
  className = "",
  ...props
}: MetricProps) {
  const valueSize = sizeValueStyles[size];

  const variantAccent =
    variant === "lime"
      ? "text-black bg-brand-lime px-2"
      : variant === "danger"
      ? "text-white bg-alert-red px-2"
      : variant === "cyan"
      ? "text-black bg-accent-cyan px-2"
      : "text-ink";

  return (
    <div className={`flex flex-col gap-1 ${className}`} {...props}>
      {label && (
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-ink-secondary">
          {label}
        </span>
      )}

      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span
          className={`font-mono font-bold tracking-tight leading-none ${valueSize} ${variantAccent}`}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-sm sm:text-base font-bold text-ink-muted uppercase">
            {unit}
          </span>
        )}

        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase border border-border ml-1.5 ${
              delta.type === "positive"
                ? "bg-brand-lime text-black"
                : delta.type === "negative"
                ? "bg-alert-red text-white"
                : "bg-surface-container text-ink-secondary"
            }`}
          >
            {delta.type === "positive" && "▲"}
            {delta.type === "negative" && "▼"}
            <span>{delta.value}</span>
            {delta.label && <span className="opacity-75">({delta.label})</span>}
          </span>
        )}
      </div>

      {sublabel && (
        <span className="font-mono text-[11px] text-ink-muted tracking-wide mt-0.5">
          {sublabel}
        </span>
      )}
    </div>
  );
}
