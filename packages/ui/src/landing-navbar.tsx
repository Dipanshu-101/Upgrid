"use client";

import * as React from "react";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";
import { StatusBadge } from "./status-badge";

export interface LandingNavbarProps extends React.HTMLAttributes<HTMLElement> {
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
  className?: string;
}

export function LandingNavbar({
  onSignInClick,
  onSignUpClick,
  className = "",
  ...props
}: LandingNavbarProps) {
  return (
    <header
      className={`sticky top-0 z-50 w-full border-b-2 border-border bg-surface/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8 brutal-shadow-sm ${className}`}
      {...props}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between">
        {/* Left Branding */}
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 group">
            <span className="font-hanken text-2xl font-black tracking-tighter text-ink transition-colors group-hover:text-brand-lime">
              UPGRID
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted border border-border px-1.5 py-0.5 bg-surface-container">
              ENGINE v2.4
            </span>
          </a>

          <div className="hidden md:flex">
            <StatusBadge status="UP" size="sm" pulse={true} />
          </div>
        </div>

        {/* Center / Navigation items */}
        <nav className="hidden lg:flex items-center gap-6 font-mono text-xs font-bold uppercase tracking-wider text-ink-secondary">
          <a href="#features" className="hover:text-ink transition-colors">
            [ARCHITECTURE]
          </a>
          <a href="#metrics" className="hover:text-ink transition-colors">
            [TELEMETRY]
          </a>
          <a href="#nodes" className="hover:text-ink transition-colors">
            [REGIONAL NODES]
          </a>
          <a href="/api-docs" className="hover:text-ink transition-colors">
            [API SPEC]
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle variant="icon" />

          <a href="/signin">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </a>

          <a href="/signup">
            <Button variant="primary" size="sm">
              Launch Console
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}
