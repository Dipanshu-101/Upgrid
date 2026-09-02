"use client";

import * as React from "react";
import { StatusBadge } from "./status-badge";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string | number;
  active?: boolean;
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  currentPath?: string;
  navItems?: NavItem[];
  brandTitle?: string;
  brandSubtitle?: string;
  systemStatus?: string;
  footerNode?: React.ReactNode;
  onNavigate?: (href: string) => void;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Websites", href: "/dashboard", icon: "language" },
  { label: "My Website", href: "/my-website", icon: "add_box" },
  { label: "Documentation", href: "/api-docs", icon: "terminal" },
];

export function Sidebar({
  currentPath = "/dashboard",
  navItems = defaultNavItems,
  brandTitle = "UPGRID",
  brandSubtitle = "MONITORING SYSTEM",
  systemStatus = "ONLINE",
  footerNode,
  onNavigate,
  className = "",
  ...props
}: SidebarProps) {
  return (
    <aside
      className={`hidden md:flex h-screen w-64 lg:w-72 flex-col justify-between border-r-2 border-border bg-surface text-ink brutal-shadow z-40 shrink-0 ${className}`}
      {...props}
    >
      {/* Top Branding Section */}
      <div className="flex flex-col p-5 border-b-2 border-border bg-surface-container-low">
        <div className="flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate("/");
              }
            }}
            className="flex flex-col group cursor-pointer"
          >
            <h1 className="font-hanken text-2xl lg:text-3xl font-black tracking-tighter text-ink transition-colors group-hover:text-brand-lime">
              {brandTitle}
            </h1>
            <span className="font-mono text-[10px] font-bold tracking-widest text-ink-secondary">
              {brandSubtitle}
            </span>
          </a>

          <StatusBadge
            status={systemStatus}
            size="sm"
            pulse={true}
            className="shrink-0"
          />
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex flex-1 flex-col gap-1.5 p-4 overflow-y-auto">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted px-3 py-1">
          NAVIGATION
        </span>

        {navItems.map((item) => {
          const isActive = item.active ?? currentPath === item.href;

          return (
            <a
              key={item.href + item.label}
              href={item.href}
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate(item.href);
                }
              }}
              className={`group flex items-center justify-between px-3.5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-100 select-none ${
                isActive
                  ? "bg-brand-lime text-black border-2 border-border brutal-shadow-sm translate-x-1 -translate-y-0.5"
                  : "text-ink border-2 border-transparent hover:border-border hover:bg-surface-container hover:translate-x-1 hover:-translate-y-0.5 hover:brutal-shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`material-symbols-outlined text-lg shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-black" : "text-ink"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] border font-mono font-bold shrink-0 ${
                    isActive
                      ? "bg-black text-brand-lime border-black"
                      : "bg-surface-container text-ink border-border"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Bottom Telemetry & System Specs Footer */}
      <div className="border-t-2 border-border bg-surface-container-low p-4 flex flex-col gap-3">
        {footerNode || (
          <div className="flex flex-col gap-1.5 border border-border bg-surface p-2.5 font-mono text-[10px] text-ink-secondary">
            <div className="flex justify-between items-center">
              <span className="text-ink-muted">ENGINE:</span>
              <span className="font-bold text-ink">v2.4-PROBE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-muted">REGION:</span>
              <span className="font-bold text-ink">AP-SOUTH (PRIMARY)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-muted">STREAM:</span>
              <span className="font-bold text-brand-lime">HEALTHY</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
