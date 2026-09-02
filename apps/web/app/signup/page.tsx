"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { useAuth } from "../../lib/auth-context";
import { useToast } from "@repo/ui/toast";
import axios from "axios";

export default function SignUpPage() {
  const router = useRouter();
  const { signup, isAuthenticated } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  }>({});

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required.";
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      newErrors.username = "Only letters, numbers, and underscores allowed.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await signup(username.trim(), password);
      toastSuccess("OPERATOR REGISTERED", `Welcome aboard, ${username.toUpperCase()}.`);
      router.push("/dashboard");
    } catch (err: unknown) {
      let message = "Registration failed. Please try again.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      }
      setErrors({ form: message });
      toastError("REGISTRATION FAILED", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface text-ink bg-grid">
      {/* ═══════════════════════════════════════════
          LEFT PANEL — Brand & Onboarding Info
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

        <div className="flex flex-col gap-5">
          {/* Onboarding Steps */}
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            GET STARTED IN 3 STEPS
          </p>
          {[
            { step: "01", icon: "person_add", label: "CREATE ACCOUNT", desc: "Register your operator profile with a username and password." },
            { step: "02", icon: "language",   label: "ADD MONITORS",   desc: "Enter any URL. We start probing from 3 global regions immediately." },
            { step: "03", icon: "ssid_chart", label: "TRACK UPTIME",   desc: "View real-time latency, uptime %, and 90-day tick history." },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-border bg-surface brutal-shadow-sm font-mono text-sm font-black text-ink">
                {item.step}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="material-symbols-outlined text-sm text-brand-lime">{item.icon}</span>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">{item.label}</span>
                </div>
                <p className="font-sans text-xs text-ink-secondary">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
          ENGINE v2.4-PROBE — FREE TO USE
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Registration Form
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
            <div className="border-b-2 border-border bg-brand-lime px-6 py-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-sm font-bold uppercase tracking-wider text-black">
                  REGISTER OPERATOR
                </span>
                <span className="font-mono text-[10px] text-black/70 uppercase tracking-widest mt-0.5">
                  CREATE YOUR MONITORING ACCOUNT
                </span>
              </div>
              <span className="material-symbols-outlined text-xl text-black">person_add</span>
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
                id="signup-username"
                label="USERNAME"
                type="text"
                placeholder="operator_handle"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={errors.username}
                helperText="Letters, numbers, and underscores only."
                disabled={isLoading}
                leftAddon={
                  <span className="material-symbols-outlined text-base text-ink-muted">person</span>
                }
              />

              <Input
                id="signup-password"
                label="PASSWORD"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                helperText="Minimum 6 characters."
                disabled={isLoading}
                leftAddon={
                  <span className="material-symbols-outlined text-base text-ink-muted">key</span>
                }
              />

              <Input
                id="signup-confirm-password"
                label="CONFIRM PASSWORD"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                disabled={isLoading}
                leftAddon={
                  <span className="material-symbols-outlined text-base text-ink-muted">lock</span>
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
                {isLoading ? "REGISTERING..." : "CREATE ACCOUNT"}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Sign in link */}
              <p className="text-center font-mono text-xs text-ink-secondary">
                Already have an account?{" "}
                <a
                  href="/signin"
                  className="font-bold text-ink underline underline-offset-2 hover:text-brand-lime transition-colors"
                >
                  SIGN IN
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
