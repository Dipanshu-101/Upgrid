"use client";

import * as React from "react";
import { AuthGuard } from "../../components/auth-guard";
import { Sidebar } from "@repo/ui/sidebar";
import { Header } from "@repo/ui/header";
import { StatCard } from "@repo/ui/stat-card";
import { SkeletonCard, SkeletonTable } from "@repo/ui/skeleton";
import { Button } from "@repo/ui/button";
import { useAuth } from "../../lib/auth-context";
import { api, Website } from "../../lib/api";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const [websites, setWebsites] = React.useState<Website[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastRefreshed, setLastRefreshed] = React.useState<Date>(new Date());

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getWebsites();
      setWebsites(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to fetch websites for dashboard", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Compute summary metrics
  const totalMonitors = websites.length;

  let totalTicks = 0;
  let upTicks = 0;
  let latencySum = 0;
  let latencyCount = 0;
  let downMonitorsCount = 0;

  websites.forEach((site) => {
    const ticks = site.ticks || [];
    const latestTick = ticks[ticks.length - 1];
    if (latestTick && latestTick.status.toLowerCase() === "down") {
      downMonitorsCount++;
    }

    ticks.forEach((tick) => {
      totalTicks++;
      if (tick.status.toLowerCase() === "up") {
        upTicks++;
      }
      if (tick.response_time_ms && tick.response_time_ms > 0) {
        latencySum += tick.response_time_ms;
        latencyCount++;
      }
    });
  });

  const uptimePercentage =
    totalTicks > 0
      ? `${((upTicks / totalTicks) * 100).toFixed(2)}%`
      : "100.0%";

  const avgLatency =
    latencyCount > 0 ? `${Math.round(latencySum / latencyCount)}ms` : "—";

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-surface text-ink bg-grid">
        {/* Sidebar for Desktop */}
        <Sidebar
          currentPath="/dashboard"
          onNavigate={(href) => router.push(href)}
        />

        {/* Mobile Sidebar Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 flex h-full w-72 flex-col bg-surface brutal-shadow-lg animate-in slide-in-from-left duration-150">
              <div className="flex items-center justify-between border-b-2 border-border p-4 bg-surface-container">
                <span className="font-hanken text-xl font-black">UPGRID</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-ink-muted hover:text-ink"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <Sidebar
                className="flex !w-full border-r-0 shadow-none h-[calc(100%-60px)]"
                currentPath="/dashboard"
                onNavigate={(href) => {
                  setMobileMenuOpen(false);
                  router.push(href);
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            breadcrumbs={[
              { label: "UPGRID", href: "/" },
              { label: "DASHBOARD", href: "/dashboard" },
            ]}
            title="SYSTEM OVERVIEW"
            onMenuToggle={() => setMobileMenuOpen(true)}
            user={user ? { username: user.username } : undefined}
            onLogout={logout}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboardData}
                leftIcon={
                  <span
                    className={`material-symbols-outlined text-sm ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  >
                    refresh
                  </span>
                }
              >
                Sync
              </Button>
            }
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
              {/* Dashboard Action Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-border pb-4">
                <div>
                  <h2 className="font-hanken text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink">
                    MONITORING TELEMETRY
                  </h2>
                  <p className="font-mono text-xs text-ink-secondary mt-0.5 uppercase tracking-wider">
                    DISTRIBUTED HEALTH MATRIX — LAST SYNCED:{" "}
                    {lastRefreshed.toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a href="/my-website">
                    <Button
                      variant="primary"
                      size="md"
                      leftIcon={
                        <span className="material-symbols-outlined text-base">
                          add_circle
                        </span>
                      }
                    >
                      Add Monitor
                    </Button>
                  </a>
                </div>
              </div>

              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading && websites.length === 0 ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : (
                  <>
                    <StatCard
                      title="ACTIVE MONITORS"
                      metric={totalMonitors}
                      sublabel="DISTRIBUTED TARGETS"
                      icon="language"
                      variant="default"
                      delta={{
                        value: `${websites.length} TOTAL`,
                        type: "neutral",
                      }}
                    />

                    <StatCard
                      title="GLOBAL UPTIME"
                      metric={uptimePercentage}
                      sublabel="LAST 30 DAYS"
                      icon="check_circle"
                      variant={uptimePercentage.startsWith("100") || Number.parseFloat(uptimePercentage) >= 99 ? "lime" : "default"}
                      delta={{
                        value: "SLA MET",
                        type: "positive",
                      }}
                    />

                    <StatCard
                      title="AVG LATENCY"
                      metric={avgLatency}
                      sublabel="CROSS-REGION MEAN"
                      icon="ssid_chart"
                      variant="default"
                      delta={{
                        value: "P95 OPTIMAL",
                        type: "positive",
                      }}
                    />

                    <StatCard
                      title="ACTIVE INCIDENTS"
                      metric={downMonitorsCount}
                      sublabel={downMonitorsCount === 0 ? "ALL SYSTEMS UP" : "ATTENTION REQUIRED"}
                      icon="warning"
                      variant={downMonitorsCount > 0 ? "danger" : "default"}
                      isFailing={downMonitorsCount > 0}
                      delta={{
                        value: downMonitorsCount === 0 ? "0 FAILING" : `${downMonitorsCount} CRITICAL`,
                        type: downMonitorsCount === 0 ? "positive" : "negative",
                      }}
                    />
                  </>
                )}
              </div>

              {/* Step 25 target container will render the complete table here */}
              <div id="dashboard-monitor-section" className="flex flex-col gap-4 mt-2">
                {isLoading && websites.length === 0 ? (
                  <SkeletonTable rows={4} />
                ) : null}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
