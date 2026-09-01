import * as React from "react";

export interface GridBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  gridSize?: "16" | "24" | "32";
  showCrosshairs?: boolean;
}

export function GridBackground({
  children,
  className = "",
  gridSize = "24",
  showCrosshairs = false,
  ...props
}: GridBackgroundProps) {
  return (
    <div
      className={`relative min-h-screen w-full bg-surface text-ink bg-grid ${className}`}
      data-grid-size={gridSize}
      {...props}
    >
      {showCrosshairs && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(var(--color-ink) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}
