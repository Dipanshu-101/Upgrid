"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { useAuth } from "../../lib/auth-context";
import { useToast } from "@repo/ui/toast";
import axios from "axios";

export default function SignInPage() {
  const router = useRouter();
  const { signin, isAuthenticated } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ username?: string; password?: string; form?: string }>({});

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = "Username is required.";
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await signin(username.trim(), password);
      toastSuccess("ACCESS GRANTED", `Welcome back, ${username.toUpperCase()}.`);
      router.push("/dashboard");
    } catch (err: unknown) {
      let message = "Authentication failed. Check your credentials.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      }
      setErrors({ form: message });
      toastError("ACCESS DENIED", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface text-ink bg-grid">
      {/* ═══════════════════════════════════════════
          LEFT PANEL — Brand & Context
      ═══════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] xl:w-[480px] shrink-0 border-r-2 border-border bg-surface-container-low p-10 xl:p-14">
        <div>
          <a href="/" className="group inline-block">
            <h1 className="font-hanken text-4xl font-black tracking-tighter text-ink group-hover:text-brand-lime transition-colors">
              UPGRID
            </h1>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-0.5">
              MONITORING SYSTEM
            </p>
          </a>
        </div>

        <div className="flex flex-col gap-6">
          <div className="border-2 border-border bg-surface p-5 brutal-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full bg-brand-lime opacity-75" />
                <span className="relative inline-flex h-2 w-2 bg-brand-lime" />
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                LIVE SYSTEM STATUS
              </span>
            </div>
            <div className="flex flex-col gap-2 font-mono text-xs">
              {[
                { region: "AP-SOUTH-1", latency: "142ms", status: "UP" },
                { region: "US-EAST-1",  latency: "89ms",  status: "UP" },
                { region: "EU-WEST-1",  latency: "203ms", status: "UP" },
              ].map((n) => (
                <div key={n.region} className="flex items-center justify-between border-b border-border pb-1 last:border-0 last:pb-0">
                  <span className="text-ink-muted">{n.region}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-ink">{n.latency}</span>
                    <span className="font-black text-brand-lime text-[10px]">[{n.status}]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <blockquote className="font-mono text-xs text-ink-secondary italic border-l-2 border-brand-lime pl-4">
            "A system is only as reliable as the team watching it."
          </blockquote>
        </div>

        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
          ENGINE v2.4-PROBE — SECURE SESSION
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Sign In Form
      ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <a href="/" className="group inline-block">
            <h1 className="font-hanken text-3xl font-black tracking-tighter text-ink group-hover:text-brand-lime transition-colors">
              UPGRID
            </h1>
          </a>
        </div>

        <div className="w-full max-w-md">
          {/* Form Card */}
          <div className="border-2 border-border bg-surface brutal-shadow">
            {/* Header stripe */}
            <div className="border-b-2 border-border bg-surface-container px-6 py-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold uppercase tracking-wider text-ink">
                  OPERATOR AUTHENTICATION
                </span>
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mt-0.5">
                  SECURE SESSION INIT
                </span>
              </div>
              <span className="material-symbols-outlined text-xl text-ink-muted">lock</span>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6" noValidate>
              {/* Global form error */}
              {errors.form && (
                <div className="flex items-center gap-2 border-2 border-alert-red bg-surface p-3 text-alert-red font-mono text-xs font-bold">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{errors.form}</span>
                </div>
              )}

              <Input
                id="signin-username"
                label="USERNAME"
                type="text"
                placeholder="operator_handle"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={errors.username}
                disabled={isLoading}
                leftAddon={
                  <span className="material-symbols-outlined text-base text-ink-muted">person</span>
                }
              />

              <Input
                id="signin-password"
                label="PASSWORD"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={isLoading}
                leftAddon={
                  <span className="material-symbols-outlined text-base text-ink-muted">key</span>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="mt-1"
              >
                {isLoading ? "AUTHENTICATING..." : "INITIATE SESSION"}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Register link */}
              <p className="text-center font-mono text-xs text-ink-secondary">
                No account?{" "}
                <a
                  href="/signup"
                  className="font-bold text-ink underline underline-offset-2 hover:text-brand-lime transition-colors"
                >
                  REGISTER OPERATOR
                </a>
              </p>
            </form>
          </div>

          {/* Back link */}
          <div className="mt-4 text-center">
            <a
              href="/"
              className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted hover:text-ink transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              BACK TO LANDING
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
