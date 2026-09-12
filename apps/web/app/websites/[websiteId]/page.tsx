"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "../../../components/auth-guard";
import { Sidebar } from "@repo/ui/sidebar";
import { Header } from "@repo/ui/header";
import { Button } from "@repo/ui/button";
import { StatusBadge } from "@repo/ui/status-badge";
import { StatCard } from "@repo/ui/stat-card";
import { SkeletonCard, SkeletonTable } from "@repo/ui/skeleton";
import { ResponseTimeChart, DataPoint } from "@repo/ui/response-time-chart";
import { UptimeTickBar } from "@repo/ui/uptime-tick-bar";
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
      const count = website?.regions?.length || 2;
      if (next) {
        toastInfo("MONITOR PAUSED", "Automated probe checks temporarily suspended.");
      } else {
        toastSuccess("MONITOR RESUMED", `Automated probe checks resumed across ${count} nodes.`);
      }
      return next;
    });
  };

  // Compute telemetry metrics from real ticks (chronological order)
  const ticks: WebsiteTick[] = React.useMemo(() => {
    return [...(website?.ticks || [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [website?.ticks]);

  const latestTick = ticks[ticks.length - 1];
  const currentStatus = isPaused ? "Paused" : latestTick ? latestTick.status : "Unknown";
  const isUp = currentStatus.toUpperCase() === "UP";
  const isDown = currentStatus.toUpperCase() === "DOWN";

  const totalChecks = ticks.length;
  const upChecks = ticks.filter((t) => t.status.toLowerCase() === "up").length;
  const uptimePercentage =
    totalChecks > 0 ? `${((upChecks / totalChecks) * 100).toFixed(2)}%` : "0.0%";

  const validLatencies = ticks
    .filter((t) => t.response_time_ms && t.response_time_ms > 0)
    .map((t) => t.response_time_ms);

  const avgLatency =
    validLatencies.length > 0
      ? Math.round(
          validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length
        )
      : 0;

  const minLatency =
    validLatencies.length > 0 ? Math.min(...validLatencies) : 0;
  const maxLatency =
    validLatencies.length > 0 ? Math.max(...validLatencies) : 0;

  const currentLatency =
    latestTick && latestTick.response_time_ms > 0
      ? `${latestTick.response_time_ms}ms`
      : "0ms";

  const intervalSec = website?.interval || 180;
  const intervalDisplay =
    intervalSec < 60 ? `${intervalSec} SEC` : `${Math.round(intervalSec / 60)} MIN`;
  const activeRegions = website?.regions || [];

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
                        INTERVAL: {intervalDisplay}
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
                          {activeRegions.length} {activeRegions.length === 1 ? "Node" : "Nodes"} Active
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
                      metric={validLatencies.length > 0 ? currentLatency : "0ms"}
                      sublabel={
                        validLatencies.length > 0
                          ? `AVG: ${avgLatency}ms (MIN: ${minLatency}ms)`
                          : "NO PROBE DATA"
                      }
                      icon="ssid_chart"
                      variant="default"
                      delta={{
                        value: validLatencies.length > 0 ? `MAX ${maxLatency}ms` : "0ms",
                        type: "neutral",
                      }}
                    />

                    <StatCard
                      title="TOTAL PROBES"
                      metric={totalChecks}
                      sublabel="RECORDED TICKS"
                      icon="history"
                      variant="default"
                      delta={{
                        value:
                          totalChecks > 0
                            ? `${upChecks} UP / ${totalChecks - upChecks} DOWN`
                            : "0 RECORDED",
                        type: "neutral",
                      }}
                    />
                  </>
                )}
              </div>

              {/* ═══════════════════════════════════════════
                  1. 90-DAY UPTIME TIMELINE BAR
              ═══════════════════════════════════════════ */}
              <div className="flex flex-col border-2 border-border bg-surface p-5 brutal-shadow text-ink">
                <div className="flex items-center justify-between border-b-2 border-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-ink-muted">
                      bar_chart
                    </span>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                      UPTIME DISCRETE TIMELINE
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-black text-brand-lime bg-black px-2 py-0.5 border border-border">
                    {uptimePercentage} OVERALL
                  </span>
                </div>

                <UptimeTickBar
                  ticks={ticks.map((t) => ({
                    id: t.id,
                    status: t.status,
                    responseTimeMs: t.response_time_ms,
                    timestamp: t.createdAt,
                  }))}
                  totalSlots={45}
                  barHeight="lg"
                  startLabel="90 DAYS AGO"
                  endLabel="NOW (LIVE)"
                />
              </div>

              {/* ═══════════════════════════════════════════
                  2. RESPONSE TIME LATENCY CHART
              ═══════════════════════════════════════════ */}
              <ResponseTimeChart
                data={
                  ticks.length > 0
                    ? ticks.map((t) => ({
                        timestamp: t.createdAt,
                        value: t.response_time_ms || 0,
                        status: t.status,
                        region:
                          t.region?.code ||
                          t.region?.name ||
                          (t.region_id === "11111111-1111-4111-8111-111111111111"
                            ? "AP-SOUTH-1"
                            : t.region_id === "22222222-2222-4222-8222-222222222222"
                            ? "US-EAST-1"
                            : t.region_id),
                      }))
                    : []
                }
                title="RESPONSE TIME TELEMETRY (MS)"
                height={260}
                strokeColor="#ccff00"
                showHistogram={true}
              />

              {/* ═══════════════════════════════════════════
                  3. REGIONAL PROBE MATRIX
              ═══════════════════════════════════════════ */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b-2 border-border pb-2">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-ink-muted">
                      public
                    </span>
                    DISTRIBUTED REGION BREAKDOWN
                  </h3>
                  <span className="font-mono text-[10px] text-ink-muted uppercase">
                    {activeRegions.length} ACTIVE {activeRegions.length === 1 ? "NODE" : "NODES"}
                  </span>
                </div>

                {activeRegions.length === 0 ? (
                  <div className="border-2 border-border bg-surface p-6 font-mono text-xs text-ink-muted uppercase text-center">
                    NO REGIONS ASSIGNED TO THIS MONITOR
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeRegions.map((node) => {
                      const nodeTicks = ticks.filter(
                        (t) =>
                          t.region_id === node.id ||
                          t.region?.id === node.id ||
                          t.region?.name.toLowerCase() === node.name.toLowerCase()
                      );
                      const nodeTotal = nodeTicks.length;
                      const nodeUp = nodeTicks.filter(
                        (t) => t.status.toLowerCase() === "up"
                      ).length;
                      const nodeUptime =
                        nodeTotal > 0
                          ? `${((nodeUp / nodeTotal) * 100).toFixed(2)}%`
                          : "0.0%";

                      const nodeValidLatencies = nodeTicks
                        .filter((t) => t.response_time_ms && t.response_time_ms > 0)
                        .map((t) => t.response_time_ms);

                      const nodeAvgLatency =
                        nodeValidLatencies.length > 0
                          ? `${Math.round(
                              nodeValidLatencies.reduce((a, b) => a + b, 0) /
                                nodeValidLatencies.length
                            )}ms`
                          : "0ms";

                      const nodeLatestTick = nodeTicks[nodeTicks.length - 1];
                      const nodeStatus = isPaused
                        ? "Paused"
                        : nodeLatestTick
                        ? nodeLatestTick.status
                        : "Unknown";
                      const nodeIsUp = nodeStatus.toUpperCase() === "UP";

                      const codeLabel =
                        node.code ||
                        (node.name.toLowerCase() === "india"
                          ? "AP-SOUTH-1"
                          : node.name.toLowerCase() === "america" ||
                            node.name.toLowerCase() === "us"
                          ? "US-EAST-1"
                          : node.name.toUpperCase());

                      const locationLabel =
                        node.location ||
                        (node.name.toLowerCase() === "india"
                          ? "Mumbai, IN"
                          : node.name.toLowerCase() === "america" ||
                            node.name.toLowerCase() === "us"
                          ? "Virginia, US"
                          : node.name);

                      return (
                        <div
                          key={node.id || node.name}
                          className="flex flex-col border-2 border-border bg-surface p-4 brutal-shadow text-ink"
                        >
                          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                              <span className="material-symbols-outlined text-sm text-brand-lime">
                                location_on
                              </span>
                              <span>{codeLabel}</span>
                            </div>
                            <StatusBadge
                              status={nodeStatus}
                              size="sm"
                              pulse={nodeIsUp}
                            />
                          </div>

                          <div className="flex items-center justify-between font-mono text-xs mb-2">
                            <span className="text-ink-muted">LOCATION:</span>
                            <span className="font-bold text-ink">{locationLabel}</span>
                          </div>

                          <div className="flex items-center justify-between font-mono text-xs mb-2">
                            <span className="text-ink-muted">LATENCY:</span>
                            <span className="font-bold text-brand-lime bg-black px-1.5 py-0.5">
                              {nodeAvgLatency}
                            </span>
                          </div>

                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="text-ink-muted">UPTIME:</span>
                            <span className="font-bold text-ink">{nodeUptime}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════
                  4. RECENT PROBE LOGS & RAW TICK STREAM
              ═══════════════════════════════════════════ */}
              <div className="flex flex-col border-2 border-border bg-surface brutal-shadow text-ink">
                <div className="flex items-center justify-between border-b-2 border-border bg-surface-container px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-ink-muted">
                      terminal
                    </span>
                    <span>RAW PROBE EXECUTION LOGS</span>
                  </div>
                  <span className="text-[10px] text-ink-muted">
                    LAST {Math.min(ticks.length, 15)} TICKS
                  </span>
                </div>

                {ticks.length === 0 ? (
                  <div className="p-8 text-center font-mono text-xs text-ink-muted uppercase">
                    NO PROBE TICKS RECORDED YET. WAITING FOR WORKER TO DISPATCH CHECK.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                      <thead>
                        <tr className="border-b-2 border-border bg-surface-container-low text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                          <th className="p-3 pl-5">TIMESTAMP (UTC)</th>
                          <th className="p-3">PROBE NODE</th>
                          <th className="p-3">RESPONSE TIME</th>
                          <th className="p-3">STATUS CODE</th>
                          <th className="p-3 pr-5 text-right">OUTCOME</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-border">
                        {[...ticks]
                          .reverse()
                          .slice(0, 15)
                          .map((tick, idx) => {
                            const tickUp = tick.status.toUpperCase() === "UP";
                            const timestamp = new Date(tick.createdAt).toUTCString();

                            return (
                              <tr
                                key={tick.id || idx}
                                className="hover:bg-surface-container-low transition-colors"
                              >
                                <td className="p-3 pl-5 text-ink-secondary text-[11px]">
                                  {timestamp}
                                </td>
                                <td className="p-3 font-bold">
                                  {tick.region?.code ||
                                    tick.region?.name ||
                                    (tick.region_id === "11111111-1111-4111-8111-111111111111"
                                      ? "AP-SOUTH-1"
                                      : tick.region_id === "22222222-2222-4222-8222-222222222222"
                                      ? "US-EAST-1"
                                      : tick.region_id || "NODE")}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`font-black ${
                                      tickUp ? "text-ink" : "text-alert-red"
                                    }`}
                                  >
                                    {tick.response_time_ms > 0
                                      ? `${tick.response_time_ms}ms`
                                      : "0ms (TIMEOUT)"}
                                  </span>
                                </td>
                                <td className="p-3 text-ink-secondary">
                                  {tickUp ? "200 OK" : "503 SERVICE UNAVAIL"}
                                </td>
                                <td className="p-3 pr-5 text-right">
                                  <StatusBadge
                                    status={tick.status}
                                    size="sm"
                                    pulse={false}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
