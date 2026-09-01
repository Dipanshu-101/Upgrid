"use client";

import * as React from "react";
import { useTheme } from "./theme-provider";

export interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "icon" | "full" | "minimal";
  className?: string;
}

export function ThemeToggle({
  variant = "full",
  className = "",
  ...props
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center gap-2 border-2 border-border bg-surface px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-ink brutal-shadow-sm opacity-60 ${className}`}
        aria-label="Loading theme toggle"
        {...props}
      >
        <span className="material-symbols-outlined text-base">contrast</span>
        {variant === "full" && <span>THEME</span>}
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative inline-flex items-center gap-2 border-2 border-border bg-surface px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-surface-container brutal-shadow-sm active:translate-x-0.5 active:translate-y-0.5 ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      {...props}
    >
      <span
        className={`material-symbols-outlined text-base transition-transform group-hover:rotate-12 ${
          isDark ? "text-brand-lime" : "text-ink"
        }`}
      >
        {isDark ? "dark_mode" : "light_mode"}
      </span>
      {variant === "full" && (
        <span className="font-mono font-bold tracking-widest">
          {isDark ? "DARK" : "LIGHT"}
        </span>
      )}
      {variant === "minimal" && (
        <span className="font-mono text-[10px] text-ink-muted">
          [{isDark ? "01" : "00"}]
        </span>
      )}
    </button>
  );
}
