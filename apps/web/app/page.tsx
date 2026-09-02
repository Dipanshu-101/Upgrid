"use client";

import * as React from "react";
import { Button } from "@repo/ui/button";
import { StatusBadge } from "@repo/ui/status-badge";
import { LandingNavbar } from "@repo/ui/landing-navbar";
import { StatCard } from "@repo/ui/stat-card";
import { useRouter } from "next/navigation";

const TICKER_LINES = [
  "PROBE [AP-SOUTH-1] → api.example.com → 142ms [UP]",
  "PROBE [US-EAST-1]  → shop.acme.co    →  89ms [UP]",
  "PROBE [EU-WEST-1]  → cdn.fastio.net  → 203ms [UP]",
  "ALERT [AP-SOUTH-1] → db.legacy.io    →    0ms [DOWN]",
  "PROBE [US-WEST-2]  → auth.myapp.com  → 118ms [UP]",
  "PROBE [EU-WEST-1]  → api.example.com → 157ms [UP]",
  "RECOVERY           → db.legacy.io    → 340ms [UP]",
  "PROBE [AP-SOUTH-1] → cdn.fastio.net  →  95ms [UP]",
];

function TerminalTicker() {
  const [lines, setLines] = React.useState<string[]>(TICKER_LINES.slice(0, 5));
  const [cursor, setCursor] = React.useState(true);

  React.useEffect(() => {
    let lineIdx = 5;
    const interval = setInterval(() => {
      const next = TICKER_LINES[lineIdx % TICKER_LINES.length]!;
      setLines((prev) => [...prev.slice(-6), next]);
      lineIdx++;
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const blink = setInterval(() => setCursor((c) => !c), 500);
    return () => clearInterval(blink);
  }, []);

  return (
    <div className="border-2 border-border bg-surface text-ink brutal-shadow font-mono text-xs w-full max-w-2xl">
      {/* Terminal chrome bar */}
      <div className="flex items-center justify-between border-b-2 border-border bg-surface-container px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 border border-border bg-alert-red" />
          <div className="h-2.5 w-2.5 border border-border bg-[#ffd600]" />
          <div className="h-2.5 w-2.5 border border-border bg-brand-lime" />
        </div>
        <span className="font-bold uppercase tracking-widest text-[10px] text-ink-muted">
          UPGRID PROBE STREAM — LIVE
        </span>
        <span className="text-[10px] text-brand-lime font-bold animate-pulse">● REC</span>
      </div>

      {/* Stream output */}
      <div className="p-4 flex flex-col gap-1.5 min-h-[200px]">
        {lines.map((line, idx) => {
          const isDown = line.includes("[DOWN]");
          const isRecovery = line.startsWith("RECOVERY");
          const isLast = idx === lines.length - 1;
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-ink-muted select-none shrink-0">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span
                className={`flex-1 ${
                  isDown
                    ? "text-alert-red font-bold"
                    : isRecovery
                    ? "text-brand-lime font-bold"
                    : "text-ink"
                }`}
              >
                {line}
              </span>
              {isLast && (
                <span
                  className={`text-brand-lime font-bold transition-opacity ${
                    cursor ? "opacity-100" : "opacity-0"
                  }`}
                >
                  █
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-surface text-ink bg-grid">
      <LandingNavbar
        onSignInClick={() => router.push("/signin")}
        onSignUpClick={() => router.push("/signup")}
      />

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center overflow-hidden">
        {/* Decorative corner tick marks */}
        <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-brand-lime opacity-60" />
        <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-brand-lime opacity-60" />
        <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-brand-lime opacity-60" />
        <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-brand-lime opacity-60" />

        <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto">
          {/* System Status Badge */}
          <div className="flex items-center gap-3 border-2 border-border bg-surface-container px-4 py-2 brutal-shadow-sm">
            <StatusBadge status="UP" size="sm" pulse={true} />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
              ALL NODES OPERATIONAL — 99.98% UPTIME (30D)
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="font-hanken text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-ink leading-[0.9] text-balance">
            MONITOR{" "}
            <span className="text-brand-lime bg-ink px-2 inline-block -rotate-1 skew-x-1">
              EVERYTHING.
            </span>
            <br />
            <span className="text-4xl sm:text-5xl lg:text-6xl text-ink-secondary">
              MISS NOTHING.
            </span>
          </h1>

          {/* Sub-description */}
          <p className="max-w-2xl font-sans text-base sm:text-lg text-ink-secondary leading-relaxed">
            Distributed uptime & latency monitoring across global probe nodes.
            Real-time SLA tracking, sub-second alerting, and engineering-grade
            observability — built for technical teams that demand precision.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/signup">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<span className="material-symbols-outlined text-base">arrow_forward</span>}
              >
                Launch Console
              </Button>
            </a>
            <a href="/signin">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </a>
          </div>

          {/* Trust Strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] font-bold uppercase tracking-widest text-ink-muted border-t-2 border-dashed border-border pt-6 mt-2 w-full max-w-2xl">
            {[
              "3 GLOBAL REGIONS",
              "30-DAY HISTORY",
              "< 5 MIN SETUP",
              "99.98% AVG UPTIME",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-brand-lime font-black">▸</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            LIVE TERMINAL PREVIEW
        ═══════════════════════════════════════════════════════ */}
        <div className="mt-16 flex flex-col items-center gap-4 w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-border max-w-24" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">
              LIVE PROBE STREAM
            </span>
            <div className="h-px flex-1 bg-border max-w-24" />
          </div>
          <TerminalTicker />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LIVE REGIONAL NODE STATUS GRID
      ═══════════════════════════════════════════════════════ */}
      <section id="metrics" className="w-full border-t-2 border-border bg-surface-container-low px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-hanken text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink">
                DISTRIBUTED PROBE NODES
              </h2>
              <p className="font-mono text-xs text-ink-muted mt-1 uppercase tracking-wider">
                REAL-TIME LATENCY ACROSS GLOBAL REGIONS
              </p>
            </div>
            <div className="flex items-center gap-2 border-2 border-border px-3 py-2 bg-surface brutal-shadow-sm font-mono text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full bg-brand-lime opacity-75" />
                <span className="relative inline-flex h-2 w-2 bg-brand-lime" />
              </span>
              PROBES RUNNING
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { region: "AP-SOUTH-1", location: "Mumbai, IN", latency: "142ms", status: "Up" as const, uptime: "99.98%" },
              { region: "US-EAST-1",  location: "Virginia, US", latency: "89ms",  status: "Up" as const, uptime: "99.99%" },
              { region: "EU-WEST-1",  location: "Dublin, IE", latency: "203ms", status: "Up" as const, uptime: "99.97%" },
            ].map((node) => (
              <StatCard
                key={node.region}
                title={node.region}
                metric={node.latency}
                sublabel={node.location}
                delta={{ value: `${node.uptime} UPTIME`, type: "positive" }}
              />
            ))}
          </div>

          {/* Aggregate Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t-2 border-dashed border-border pt-8">
            {[
              { label: "TOTAL MONITORS", value: "—", icon: "language" },
              { label: "AVG LATENCY",    value: "145ms", icon: "ssid_chart" },
              { label: "INCIDENTS (30D)",value: "3",    icon: "warning" },
              { label: "GLOBAL UPTIME",  value: "99.98%",icon: "check_circle" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1.5 border-2 border-border bg-surface p-4 brutal-shadow-sm"
              >
                <div className="flex items-center gap-2 text-ink-muted">
                  <span className="material-symbols-outlined text-sm">{stat.icon}</span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                </div>
                <span className="font-mono text-2xl font-black text-ink">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURE BREAKDOWN
      ═══════════════════════════════════════════════════════ */}
      <section id="features" className="w-full border-t-2 border-border bg-surface px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-6xl flex flex-col gap-10">
          <div className="flex flex-col items-center text-center gap-2">
            <h2 className="font-hanken text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink">
              ENGINEERING-GRADE OBSERVABILITY
            </h2>
            <p className="font-sans text-sm text-ink-secondary max-w-xl">
              Everything your team needs to maintain reliability SLAs — built for speed, precision, and scale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: "radar",
                title: "MULTI-REGION PROBING",
                description: "Distributed probe nodes across 3 global regions. Detect region-specific outages, routing failures, and CDN degradation.",
                highlight: "lime",
              },
              {
                icon: "ssid_chart",
                title: "LATENCY TELEMETRY",
                description: "Sub-millisecond response time tracking with P50/P95/P99 percentile breakdown and 90-day trend history.",
                highlight: "default",
              },
              {
                icon: "notifications_active",
                title: "INSTANT ALERTING",
                description: "Get alerted within seconds of a failure. Configurable severity thresholds, webhook delivery, and silence windows.",
                highlight: "default",
              },
              {
                icon: "history",
                title: "90-DAY HISTORY",
                description: "Full tick-by-tick uptime history with visual segments. Drill down by region, time window, or status type.",
                highlight: "default",
              },
              {
                icon: "lock",
                title: "SECURE BY DEFAULT",
                description: "JWT-based authentication with bcrypt password hashing. Your monitoring data is private and operator-controlled.",
                highlight: "default",
              },
              {
                icon: "terminal",
                title: "OPEN API",
                description: "Full REST API with Bearer auth. Integrate monitoring data into your own dashboards, CI pipelines, or incident tools.",
                highlight: "cyan",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`flex flex-col gap-3 border-2 border-border p-5 brutal-shadow hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-100 ${
                  feature.highlight === "lime"
                    ? "bg-brand-lime text-black"
                    : feature.highlight === "cyan"
                    ? "bg-accent-cyan text-black"
                    : "bg-surface text-ink"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl">{feature.icon}</span>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-widest">{feature.title}</h3>
                </div>
                <p className="font-sans text-sm leading-relaxed opacity-80">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
