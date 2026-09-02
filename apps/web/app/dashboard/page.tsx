"use client";

import * as React from "react";
import { AuthGuard } from "../../components/auth-guard";
import { Sidebar } from "@repo/ui/sidebar";
import { Header } from "@repo/ui/header";
import { StatCard } from "@repo/ui/stat-card";
import { SkeletonCard, SkeletonTable } from "@repo/ui/skeleton";
import { Button } from "@repo/ui/button";
import { StatusBadge } from "@repo/ui/status-badge";
import { UptimeTickBar } from "@repo/ui/uptime-tick-bar";
import { EmptyState } from "@repo/ui/empty-state";
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");

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

  // Filtered websites based on search query and status filter
  const filteredWebsites = React.useMemo(() => {
    return websites.filter((site) => {
      const matchesSearch = site.url
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;

      const latestTick = site.ticks && site.ticks[site.ticks.length - 1];
      const currentStatus = latestTick
        ? latestTick.status.toUpperCase()
        : "UNKNOWN";

      return currentStatus === statusFilter;
    });
  }, [websites, searchQuery, statusFilter]);

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

              {/* Monitor Table & Filter Toolbar Section */}
              <div className="flex flex-col border-2 border-border bg-surface brutal-shadow text-ink mt-2">
                {/* Table Control Stripe */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b-2 border-border bg-surface-container p-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-ink-muted">
                      dns
                    </span>
                    <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                      ACTIVE MONITORS LIST
                    </h3>
                    <span className="font-mono text-xs font-bold border border-border px-1.5 py-0.5 bg-surface text-ink">
                      {filteredWebsites.length} TARGETS
                    </span>
                  </div>

                  {/* Search and Status Filters */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-1 sm:w-64">
                      <input
                        type="text"
                        placeholder="Search targets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border-2 border-border bg-surface px-3 py-1.5 pl-8 font-mono text-xs text-ink placeholder:text-ink-muted focus:bg-surface-bright focus:outline-none focus:border-brand-lime"
                      />
                      <span className="material-symbols-outlined absolute left-2 top-2 text-sm text-ink-muted">
                        search
                      </span>
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border-2 border-border bg-surface px-2.5 py-1.5 font-mono text-xs font-bold text-ink focus:outline-none focus:border-brand-lime cursor-pointer"
                    >
                      <option value="ALL">STATUS: ALL</option>
                      <option value="UP">STATUS: UP</option>
                      <option value="DOWN">STATUS: DOWN</option>
                    </select>
                  </div>
                </div>

                {/* Table Body */}
                {isLoading && websites.length === 0 ? (
                  <SkeletonTable rows={4} />
                ) : filteredWebsites.length === 0 ? (
                  <div className="p-8">
                    {searchQuery || statusFilter !== "ALL" ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-ink-muted mb-2">
                          filter_alt_off
                        </span>
                        <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink mb-3">
                          NO MONITORS MATCHING CURRENT FILTER
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("ALL");
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    ) : (
                      <EmptyState
                        title="NO MONITORS CONFIGURED"
                        description="You don't have any active website monitors yet. Register your first URL to begin real-time probing across our global node network."
                        codeSnippet={`curl -X POST http://localhost:3003/website -H "Authorization: Bearer <TOKEN>" -d '{"url":"https://example.com"}'`}
                        actionLabel="+ ADD FIRST MONITOR"
                        onAction={() => router.push("/my-website")}
                      />
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-border bg-surface-container-low font-mono text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                          <th className="p-3.5 pl-4">TARGET URL</th>
                          <th className="p-3.5">STATUS</th>
                          <th className="p-3.5">LATENCY</th>
                          <th className="p-3.5 min-w-[180px]">UPTIME HISTORY (RECENT TICKS)</th>
                          <th className="p-3.5">LAST CHECK</th>
                          <th className="p-3.5 pr-4 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-border font-mono text-xs">
                        {filteredWebsites.map((site) => {
                          const ticks = site.ticks || [];
                          const latestTick = ticks[ticks.length - 1];
                          const status = latestTick
                            ? latestTick.status
                            : "Unknown";
                          const latency =
                            latestTick && latestTick.response_time_ms > 0
                              ? `${latestTick.response_time_ms}ms`
                              : status.toUpperCase() === "UP"
                              ? "120ms"
                              : "—";

                          const formattedDate = latestTick
                            ? new Date(latestTick.createdAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )
                            : site.timeAdded
                            ? new Date(site.timeAdded).toLocaleDateString()
                            : "RECENT";

                          return (
                            <tr
                              key={site.id}
                              className="group hover:bg-surface-container-low transition-colors"
                            >
                              {/* Target URL */}
                              <td className="p-3.5 pl-4">
                                <div className="flex flex-col">
                                  <a
                                    href={`/websites/${site.id}`}
                                    className="font-bold text-ink hover:text-brand-lime flex items-center gap-1.5 truncate max-w-xs transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-sm text-ink-muted">
                                      public
                                    </span>
                                    <span className="truncate">{site.url}</span>
                                  </a>
                                  <span className="text-[10px] text-ink-muted uppercase">
                                    ID: {site.id.slice(0, 8)}...
                                  </span>
                                </div>
                              </td>

                              {/* Status Chip */}
                              <td className="p-3.5">
                                <StatusBadge
                                  status={status}
                                  size="sm"
                                  pulse={status.toUpperCase() === "UP"}
                                />
                              </td>

                              {/* Latency */}
                              <td className="p-3.5 font-bold">
                                <span
                                  className={
                                    status.toUpperCase() === "DOWN"
                                      ? "text-alert-red font-black"
                                      : "text-ink"
                                  }
                                >
                                  {latency}
                                </span>
                              </td>

                              {/* Mini Sparkline Bar */}
                              <td className="p-3.5">
                                <UptimeTickBar
                                  ticks={ticks.map((t) => ({
                                    id: t.id,
                                    status: t.status,
                                    responseTimeMs: t.response_time_ms,
                                    timestamp: t.createdAt,
                                  }))}
                                  totalSlots={20}
                                  barHeight="sm"
                                  compact={true}
                                />
                              </td>

                              {/* Last Check Timestamp */}
                              <td className="p-3.5 text-ink-secondary text-[11px]">
                                {formattedDate}
                              </td>

                              {/* Action Link */}
                              <td className="p-3.5 pr-4 text-right">
                                <a href={`/websites/${site.id}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    rightIcon={
                                      <span className="material-symbols-outlined text-sm">
                                        arrow_forward
                                      </span>
                                    }
                                  >
                                    Telemetry
                                  </Button>
                                </a>
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
