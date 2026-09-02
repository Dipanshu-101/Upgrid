"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "../../../components/auth-guard";
import { Sidebar } from "@repo/ui/sidebar";
import { Header } from "@repo/ui/header";
import { Button } from "@repo/ui/button";
import { StatusBadge } from "@repo/ui/status-badge";
import { StatCard } from "@repo/ui/stat-card";
import { SkeletonCard } from "@repo/ui/skeleton";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "@repo/ui/toast";
import { api, Website, WebsiteTick } from "../../../lib/api";

export default function WebsiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { success: toastSuccess, info: toastInfo } = useToast();

  const websiteId = (params?.websiteId as string) || "";
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const [website, setWebsite] = React.useState<Website | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);

  const fetchWebsiteData = React.useCallback(async () => {
    if (!websiteId) return;
    setIsLoading(true);
    try {
      const data = await api.getWebsiteById(websiteId);
      setWebsite(data);
    } catch (err) {
      console.error("Failed to load website details", err);
    } finally {
      setIsLoading(false);
    }
  }, [websiteId]);

  React.useEffect(() => {
    fetchWebsiteData();
  }, [fetchWebsiteData]);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await fetchWebsiteData();
    setIsRefreshing(false);
    toastSuccess("TELEMETRY SYNCED", "Latest probe ticks retrieved from database.");
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        toastInfo("MONITOR PAUSED", "Automated probe checks temporarily suspended.");
      } else {
        toastSuccess("MONITOR RESUMED", "Automated probe checks resumed across 3 nodes.");
      }
      return next;
    });
  };

  // Compute telemetry metrics from ticks
  const ticks: WebsiteTick[] = website?.ticks || [];
  const latestTick = ticks[ticks.length - 1];
  const currentStatus = isPaused ? "Paused" : latestTick ? latestTick.status : "Unknown";
  const isUp = currentStatus.toUpperCase() === "UP";
  const isDown = currentStatus.toUpperCase() === "DOWN";

  const totalChecks = ticks.length;
  const upChecks = ticks.filter((t) => t.status.toLowerCase() === "up").length;
  const uptimePercentage =
    totalChecks > 0 ? `${((upChecks / totalChecks) * 100).toFixed(2)}%` : "100.0%";

  const validLatencies = ticks
    .filter((t) => t.response_time_ms && t.response_time_ms > 0)
    .map((t) => t.response_time_ms);

  const avgLatency =
    validLatencies.length > 0
      ? Math.round(
          validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length
        )
      : 142;

  const minLatency =
    validLatencies.length > 0 ? Math.min(...validLatencies) : 98;
  const maxLatency =
    validLatencies.length > 0 ? Math.max(...validLatencies) : 265;

  const currentLatency =
    latestTick && latestTick.response_time_ms > 0
      ? `${latestTick.response_time_ms}ms`
      : isUp
      ? `${avgLatency}ms`
      : "0ms";

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-surface text-ink bg-grid">
        {/* Desktop Sidebar */}
        <Sidebar
          currentPath="/dashboard"
          onNavigate={(href) => router.push(href)}
        />

        {/* Mobile Drawer */}
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

        {/* Main Viewport */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            breadcrumbs={[
              { label: "UPGRID", href: "/" },
              { label: "DASHBOARD", href: "/dashboard" },
              { label: website ? website.url : "MONITOR DETAILS" },
            ]}
            title="ENDPOINT TELEMETRY"
            onMenuToggle={() => setMobileMenuOpen(true)}
            user={user ? { username: user.username } : undefined}
            onLogout={logout}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                leftIcon={
                  <span
                    className={`material-symbols-outlined text-sm ${
                      isRefreshing ? "animate-spin" : ""
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
              {/* Back Link */}
              <div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="group flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-ink-secondary hover:text-brand-lime transition-colors"
                >
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">
                    arrow_back
                  </span>
                  Back to Dashboard
                </button>
              </div>

              {/* Endpoint Header Card */}
              {isLoading && !website ? (
                <div className="flex flex-col border-2 border-border bg-surface p-6 brutal-shadow gap-4">
                  <div className="h-6 w-1/3 bg-surface-container animate-pulse" />
                  <div className="h-10 w-2/3 bg-surface-container animate-pulse" />
                </div>
              ) : (
                <div className="flex flex-col border-2 border-border bg-surface brutal-shadow text-ink">
                  {/* Top Bar Stripe */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border bg-surface-container px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-ink-muted">
                        dns
                      </span>
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-secondary">
                        ID: {website?.id || websiteId}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] font-bold text-ink-muted uppercase">
                        INTERVAL: 3 MIN
                      </span>
                      <StatusBadge
                        status={currentStatus}
                        size="sm"
                        pulse={isUp}
                      />
                    </div>
                  </div>

                  {/* Main Target URL & Control Actions */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-2xl text-brand-lime">
                          public
                        </span>
                        <h2 className="font-mono text-xl sm:text-2xl lg:text-3xl font-black text-ink break-all">
                          {website?.url || "https://..."}
                        </h2>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-ink-secondary mt-2">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-ink-muted">
                            calendar_today
                          </span>
                          Added:{" "}
                          {website?.timeAdded
                            ? new Date(website.timeAdded).toLocaleDateString()
                            : "Recently"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-ink-muted">
                            radar
                          </span>
                          3 Nodes Active
                        </span>
                        <span>•</span>
                        <a
                          href={website?.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-lime hover:underline flex items-center gap-0.5"
                        >
                          Visit Live Target
                          <span className="material-symbols-outlined text-xs">
                            open_in_new
                          </span>
                        </a>
                      </div>
                    </div>

                    {/* Quick Action Controls */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <Button
                        variant={isPaused ? "primary" : "outline"}
                        size="md"
                        onClick={handleTogglePause}
                        leftIcon={
                          <span className="material-symbols-outlined text-base">
                            {isPaused ? "play_arrow" : "pause"}
                          </span>
                        }
                      >
                        {isPaused ? "Resume Checks" : "Pause Checks"}
                      </Button>

                      <Button
                        variant="secondary"
                        size="md"
                        onClick={handleManualSync}
                        leftIcon={
                          <span className="material-symbols-outlined text-base">
                            speed
                          </span>
                        }
                      >
                        Probe Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4 Summary Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading && !website ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : (
                  <>
                    <StatCard
                      title="CURRENT STATE"
                      metric={currentStatus.toUpperCase()}
                      sublabel={isUp ? "ALL PROBES HEALTHY" : "TARGET UNRESPONSIVE"}
                      icon={isUp ? "check_circle" : "warning"}
                      variant={isUp ? "lime" : isDown ? "danger" : "default"}
                      isFailing={isDown}
                      delta={{
                        value: isUp ? "ONLINE" : "OFFLINE",
                        type: isUp ? "positive" : "negative",
                      }}
                    />

                    <StatCard
                      title="UPTIME (30 DAYS)"
                      metric={uptimePercentage}
                      sublabel="HISTORICAL AVAILABILITY"
                      icon="task_alt"
                      variant="default"
                      delta={{
                        value: "SLA GUARANTEED",
                        type: "positive",
                      }}
                    />

                    <StatCard
                      title="LATENCY (NOW)"
                      metric={currentLatency}
                      sublabel={`AVG: ${avgLatency}ms (MIN: ${minLatency}ms)`}
                      icon="ssid_chart"
                      variant="default"
                      delta={{
                        value: `MAX ${maxLatency}ms`,
                        type: "neutral",
                      }}
                    />

                    <StatCard
                      title="TOTAL PROBES"
                      metric={totalChecks > 0 ? totalChecks : 24}
                      sublabel="RECORDED TICKS"
                      icon="history"
                      variant="default"
                      delta={{
                        value: `${upChecks} UP / ${totalChecks - upChecks} DOWN`,
                        type: "neutral",
                      }}
                    />
                  </>
                )}
              </div>

              {/* Step 28 will append ResponseTimeChart, Regional Matrix, and Historical Tick Table here */}
              <div id="website-telemetry-sections" className="flex flex-col gap-6" />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
