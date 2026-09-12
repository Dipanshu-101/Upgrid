"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { useAuth } from "../../lib/auth-context";
import { useToast } from "@repo/ui/toast";
import { signIn as oauthSignIn } from "next-auth/react";
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
        const data = err.response?.data;
        message = typeof data === "string" ? data : data?.message || message;
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

              {/* OAuth Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={() => oauthSignIn("google", { callbackUrl: "/dashboard" })}
                >
                  <svg className="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">REGISTER WITH GOOGLE</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={() => oauthSignIn("github", { callbackUrl: "/dashboard" })}
                >
                  <svg className="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">REGISTER WITH GITHUB</span>
                </Button>
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
