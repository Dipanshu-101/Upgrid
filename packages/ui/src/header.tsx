"use client";

import * as React from "react";
import { ThemeToggle } from "./theme-toggle";
import { StatusBadge } from "./status-badge";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  showClock?: boolean;
  systemStatus?: string;
  user?: {
    username?: string;
    avatarUrl?: string;
  } | null;
  actions?: React.ReactNode;
  onMenuToggle?: () => void;
  onLogout?: () => void;
  className?: string;
}

export function Header({
  breadcrumbs = [],
  title,
  showClock = true,
  systemStatus = "ALL SYSTEMS NOMINAL",
  user,
  actions,
  onMenuToggle,
  onLogout,
  className = "",
  ...props
}: HeaderProps) {
  const [timeString, setTimeString] = React.useState<string>("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toUTCString().replace("GMT", "UTC").slice(17, 25) + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b-2 border-border bg-surface px-4 sm:px-6 text-ink brutal-shadow-sm ${className}`}
      {...props}
    >
      {/* Left side: Mobile Toggle & Breadcrumbs / Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="md:hidden flex items-center justify-center p-2 border-2 border-border bg-surface-container text-ink brutal-shadow-sm hover:bg-surface-highest"
            aria-label="Open mobile menu"
          >
            <span className="material-symbols-outlined text-lg">menu</span>
          </button>
        )}

        <div className="flex flex-col min-w-0">
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-secondary truncate">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.label + idx}>
                  {idx > 0 && <span className="text-ink-muted">/</span>}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="hover:text-brand-lime hover:underline transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-ink truncate">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {title && (
            <h2 className="font-hanken text-lg sm:text-xl font-black uppercase tracking-tight text-ink truncate">
              {title}
            </h2>
          )}
        </div>
      </div>

      {/* Center/Right Status & Telemetry Bar */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {systemStatus && (
          <div className="hidden xl:flex items-center gap-2 border border-border bg-surface-container-low px-2.5 py-1 font-mono text-[11px] font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full bg-brand-lime opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-brand-lime" />
            </span>
            <span className="text-ink">{systemStatus}</span>
          </div>
        )}

        {showClock && timeString && (
          <div className="hidden lg:flex items-center gap-1.5 border border-border bg-surface px-2.5 py-1 font-mono text-xs font-bold text-ink">
            <span className="material-symbols-outlined text-sm text-ink-muted">
              schedule
            </span>
            <span>{timeString}</span>
          </div>
        )}

        {actions && <div className="flex items-center gap-2">{actions}</div>}

        <ThemeToggle variant="icon" />

        {user ? (
          <div className="flex items-center gap-2 border-2 border-border bg-surface-container px-2.5 py-1 brutal-shadow-sm font-mono text-xs font-bold">
            <span className="material-symbols-outlined text-base">person</span>
            <span className="hidden sm:inline-block truncate max-w-[120px]">
              {user.username || "OPERATOR"}
            </span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Logout"
                className="ml-1 text-alert-red hover:text-alert-redBright transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
