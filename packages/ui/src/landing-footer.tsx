import * as React from "react";

export interface LandingFooterProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

const REGIONS = [
  { code: "AP-SOUTH-1", name: "Mumbai", status: "UP" },
  { code: "US-EAST-1",  name: "Virginia", status: "UP" },
  { code: "EU-WEST-1",  name: "Dublin", status: "UP" },
];

const NAV_LINKS = [
  {
    heading: "PLATFORM",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "My Websites", href: "/my-website" },
      { label: "Add Monitor", href: "/my-website" },
    ],
  },
  {
    heading: "DEVELOPERS",
    links: [
      { label: "API Reference", href: "/api-docs" },
      { label: "Architecture", href: "#features" },
      { label: "Probe Regions", href: "#metrics" },
    ],
  },
  {
    heading: "ACCOUNT",
    links: [
      { label: "Sign In",  href: "/signin" },
      { label: "Register", href: "/signup" },
    ],
  },
];

export function LandingFooter({ className = "", ...props }: LandingFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`w-full border-t-2 border-border bg-surface-container-low text-ink ${className}`}
      {...props}
    >
      {/* Regional Status Banner */}
      <div className="border-b-2 border-border bg-surface px-4 sm:px-6 lg:px-8 py-3">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            PROBE NODE STATUS
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {REGIONS.map((r) => (
              <div
                key={r.code}
                className="flex items-center gap-1.5 border border-border bg-surface-container px-2 py-1 font-mono text-[10px] font-bold"
              >
                <span
                  className={`h-1.5 w-1.5 ${
                    r.status === "UP" ? "bg-brand-lime" : "bg-alert-red"
                  }`}
                />
                <span className="text-ink-muted">{r.code}</span>
                <span className="text-ink">{r.name}</span>
                <span
                  className={`font-black ${
                    r.status === "UP" ? "text-brand-lime" : "text-alert-red"
                  }`}
                >
                  [{r.status}]
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <div>
              <a href="/" className="group inline-block">
                <h2 className="font-hanken text-3xl font-black tracking-tighter text-ink group-hover:text-brand-lime transition-colors">
                  UPGRID
                </h2>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                  MONITORING SYSTEM
                </p>
              </a>
            </div>
            <p className="font-sans text-xs text-ink-secondary leading-relaxed max-w-xs">
              Distributed uptime & latency monitoring for engineering teams.
              Global probe coverage, real-time alerting, 90-day telemetry.
            </p>
            <div className="flex items-center gap-2 border border-border bg-surface px-3 py-2 font-mono text-[10px] font-bold w-fit">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full bg-brand-lime opacity-75" />
                <span className="relative inline-flex h-2 w-2 bg-brand-lime" />
              </span>
              <span className="text-ink">ALL SYSTEMS NOMINAL</span>
            </div>
          </div>

          {/* Nav Link Columns */}
          {NAV_LINKS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted border-b border-border pb-2">
                {col.heading}
              </span>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="font-mono text-xs font-bold text-ink-secondary hover:text-brand-lime transition-colors flex items-center gap-1.5 group"
                    >
                      <span className="opacity-0 group-hover:opacity-100 text-brand-lime transition-opacity">
                        ▸
                      </span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t-2 border-border bg-surface px-4 sm:px-6 lg:px-8 py-4">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">
          <span>© {year} UPGRID ENGINE — ALL RIGHTS RESERVED</span>
          <div className="flex items-center gap-4">
            <span>ENGINE v2.4-PROBE</span>
            <span className="text-brand-lime">OPEN SOURCE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
