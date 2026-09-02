"use client";

import * as React from "react";
import { Button } from "@repo/ui/button";
import { StatusBadge } from "@repo/ui/status-badge";
import { LandingNavbar } from "@repo/ui/landing-navbar";
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
    </div>
  );
}
