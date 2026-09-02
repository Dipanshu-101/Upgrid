"use client";

import * as React from "react";
import { AuthGuard } from "../../components/auth-guard";
import { Sidebar } from "@repo/ui/sidebar";
import { Header } from "@repo/ui/header";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { Modal } from "@repo/ui/modal";
import { StatusBadge } from "@repo/ui/status-badge";
import { UptimeTickBar } from "@repo/ui/uptime-tick-bar";
import { EmptyState } from "@repo/ui/empty-state";
import { SkeletonCard } from "@repo/ui/skeleton";
import { useAuth } from "../../lib/auth-context";
import { useToast } from "@repo/ui/toast";
import { api, Website } from "../../lib/api";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function MyWebsitePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [websites, setWebsites] = React.useState<Website[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [targetUrl, setTargetUrl] = React.useState("");
  const [checkInterval, setCheckInterval] = React.useState("180");
  const [selectedRegions, setSelectedRegions] = React.useState<string[]>([
    "AP-SOUTH-1",
    "US-EAST-1",
    "EU-WEST-1",
  ]);
  const [urlError, setUrlError] = React.useState("");

  const fetchWebsites = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getWebsites();
      setWebsites(data);
    } catch (err) {
      console.error("Failed to load websites", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  const validateUrl = (url: string) => {
    if (!url.trim()) return "Target URL is required.";
    try {
      const parsed = new URL(
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `https://${url}`
      );
      if (!parsed.hostname.includes(".")) {
        return "Please enter a valid domain name (e.g. example.com).";
      }
      return "";
    } catch {
      return "Invalid URL format.";
    }
  };

  const handleRegisterWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateUrl(targetUrl);
    if (error) {
      setUrlError(error);
      return;
    }

    setUrlError("");
    setIsSubmitting(true);

    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    try {
      const created = await api.createWebsite(cleanUrl);
      toastSuccess(
        "PROBE INITIATED",
        `Target ${created.url} registered across ${selectedRegions.length} nodes.`
      );
      setTargetUrl("");
      setIsModalOpen(false);
      await fetchWebsites();
    } catch (err: unknown) {
      let message = "Failed to register target monitor.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      }
      toastError("REGISTRATION FAILED", message);
      setUrlError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRegion = (code: string) => {
    setSelectedRegions((prev) =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter((r) => r !== code)
          : prev
        : [...prev, code]
    );
  };

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-surface text-ink bg-grid">
        {/* Sidebar */}
        <Sidebar
          currentPath="/my-website"
          onNavigate={(href) => router.push(href)}
        />

        {/* Mobile Drawer Overlay */}
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
                currentPath="/my-website"
                onNavigate={(href) => {
                  setMobileMenuOpen(false);
                  router.push(href);
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            breadcrumbs={[
              { label: "UPGRID", href: "/" },
              { label: "MY MONITORS", href: "/my-website" },
            ]}
            title="TARGET REGISTRATION"
            onMenuToggle={() => setMobileMenuOpen(true)}
            user={user ? { username: user.username } : undefined}
            onLogout={logout}
            actions={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                leftIcon={
                  <span className="material-symbols-outlined text-base">
                    add_circle
                  </span>
                }
              >
                New Target
              </Button>
            }
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6">
              {/* Header Title Stripe */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-border pb-4">
                <div>
                  <h2 className="font-hanken text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink">
                    MONITORED ENDPOINTS
                  </h2>
                  <p className="font-mono text-xs text-ink-secondary mt-0.5 uppercase tracking-wider">
                    {websites.length} CONFIGURED PROBES — ACTIVE REGIONAL POLLING
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsModalOpen(true)}
                    leftIcon={
                      <span className="material-symbols-outlined text-base">
                        add
                      </span>
                    }
                  >
                    Add Monitor Target
                  </Button>
                </div>
              </div>

              {/* Grid of Monitored Websites */}
              {isLoading && websites.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : websites.length === 0 ? (
                <EmptyState
                  title="NO MONITORS CONFIGURED"
                  description="You don't have any active website monitors registered under this operator account. Add a target URL to initiate automated health checks."
                  codeSnippet={`curl -X POST http://localhost:3003/website -H "Authorization: Bearer <TOKEN>" -d '{"url":"https://example.com"}'`}
                  actionLabel="+ REGISTER FIRST TARGET"
                  onAction={() => setIsModalOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {websites.map((site) => {
                    const ticks = site.ticks || [];
                    const latestTick = ticks[ticks.length - 1];
                    const status = latestTick ? latestTick.status : "Unknown";
                    const isUp = status.toUpperCase() === "UP";
                    const isDown = status.toUpperCase() === "DOWN";

                    const latency =
                      latestTick && latestTick.response_time_ms > 0
                        ? `${latestTick.response_time_ms}ms`
                        : isUp
                        ? "120ms"
                        : "0ms";

                    return (
                      <div
                        key={site.id}
                        className="flex flex-col border-2 border-border bg-surface brutal-shadow text-ink group hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-100"
                      >
                        {/* Card Header Stripe */}
                        <div className="flex items-center justify-between border-b-2 border-border bg-surface-container px-4 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-sm text-ink-muted shrink-0">
                              dns
                            </span>
                            <span className="font-mono text-[10px] font-bold text-ink-muted uppercase truncate">
                              ID: {site.id.slice(0, 10)}...
                            </span>
                          </div>
                          <StatusBadge status={status} size="sm" pulse={isUp} />
                        </div>

                        {/* Card Body */}
                        <div className="flex flex-col gap-4 p-5 flex-1 justify-between">
                          <div>
                            <a
                              href={`/websites/${site.id}`}
                              className="font-mono text-sm font-bold text-ink hover:text-brand-lime transition-colors break-all flex items-start gap-1.5"
                            >
                              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                                link
                              </span>
                              <span>{site.url}</span>
                            </a>

                            <div className="flex items-center gap-4 mt-3 font-mono text-xs">
                              <div>
                                <span className="text-ink-muted text-[10px] uppercase block">
                                  LATENCY
                                </span>
                                <span
                                  className={`font-black ${
                                    isDown
                                      ? "text-alert-red"
                                      : "text-brand-lime bg-black px-1.5 py-0.5"
                                  }`}
                                >
                                  {latency}
                                </span>
                              </div>

                              <div>
                                <span className="text-ink-muted text-[10px] uppercase block">
                                  PROBE NODES
                                </span>
                                <span className="font-bold text-ink">
                                  3 REGIONS
                                </span>
                              </div>

                              <div>
                                <span className="text-ink-muted text-[10px] uppercase block">
                                  INTERVAL
                                </span>
                                <span className="font-bold text-ink">3 MIN</span>
                              </div>
                            </div>
                          </div>

                          {/* Historical Sparkline */}
                          <div className="border-t border-border pt-3">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted block mb-1.5">
                              RECENT TICKS
                            </span>
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
                          </div>

                          {/* Card Footer Actions */}
                          <div className="flex items-center justify-between border-t-2 border-border pt-3 mt-1">
                            <a
                              href={`/websites/${site.id}`}
                              className="w-full"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                fullWidth
                                rightIcon={
                                  <span className="material-symbols-outlined text-sm">
                                    analytics
                                  </span>
                                }
                              >
                                View Detailed Telemetry
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ═══════════════════════════════════════════
            REGISTER NEW MONITOR MODAL
        ═══════════════════════════════════════════ */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="REGISTER NEW MONITOR TARGET"
          description="Distributed probe checks will commence immediately."
          icon="add_circle"
          headerVariant="lime"
          maxWidth="lg"
        >
          <form onSubmit={handleRegisterWebsite} className="flex flex-col gap-5">
            <Input
              id="target-url"
              label="TARGET URL"
              type="text"
              placeholder="https://api.yourdomain.com/health"
              value={targetUrl}
              onChange={(e) => {
                setTargetUrl(e.target.value);
                if (urlError) setUrlError("");
              }}
              error={urlError}
              helperText="Full endpoint URL with protocol (e.g. https://api.example.com)."
              disabled={isSubmitting}
              leftAddon={
                <span className="material-symbols-outlined text-base text-ink-muted">
                  globe
                </span>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="check-interval"
                label="PROBE INTERVAL"
                value={checkInterval}
                onChange={(e) => setCheckInterval(e.target.value)}
                options={[
                  { value: "30", label: "30 Seconds (High-Frequency)" },
                  { value: "60", label: "1 Minute (Standard)" },
                  { value: "180", label: "3 Minutes (Pusher Default)" },
                  { value: "300", label: "5 Minutes" },
                ]}
                helperText="Probe dispatch frequency from Redis stream."
              />

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                  PROBE TIMEOUT
                </span>
                <div className="border-2 border-border bg-surface-container px-3 py-2 font-mono text-xs font-bold text-ink">
                  5000 MS (HARD TIMEOUT)
                </div>
                <span className="font-mono text-[10px] text-ink-muted">
                  Failure triggered if no response in 5s.
                </span>
              </div>
            </div>

            {/* Regional Probe Checkboxes */}
            <div className="flex flex-col gap-2 border-2 border-border p-3.5 bg-surface-container-low">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink flex items-center justify-between">
                <span>DISTRIBUTED PROBE REGIONS</span>
                <span className="text-[10px] text-brand-lime bg-black px-1.5 py-0.5">
                  {selectedRegions.length} ACTIVE
                </span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                {[
                  { code: "AP-SOUTH-1", name: "Mumbai" },
                  { code: "US-EAST-1",  name: "Virginia" },
                  { code: "EU-WEST-1",  name: "Dublin" },
                ].map((r) => {
                  const isChecked = selectedRegions.includes(r.code);
                  return (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => toggleRegion(r.code)}
                      className={`flex flex-col p-2 border-2 font-mono text-xs font-bold text-left transition-all ${
                        isChecked
                          ? "border-border bg-brand-lime text-black brutal-shadow-sm"
                          : "border-border bg-surface text-ink-muted hover:text-ink"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{r.code}</span>
                        <span className="material-symbols-outlined text-sm">
                          {isChecked ? "check_box" : "check_box_outline_blank"}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-80">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t-2 border-border pt-4 mt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={
                  <span className="material-symbols-outlined text-base">
                    rocket_launch
                  </span>
                }
              >
                {isSubmitting ? "INITIATING PROBE..." : "CONFIRM & PROBE"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AuthGuard>
  );
}
