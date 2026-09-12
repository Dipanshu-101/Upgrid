import type { Metadata } from "next";
import { LandingNavbar } from "@repo/ui/landing-navbar";
import { LandingFooter } from "@repo/ui/landing-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — UPGRID",
  description: "Privacy policy and data protection practices for Upgrid distributed uptime and telemetry monitoring.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink bg-grid">
      <LandingNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header Badge */}
        <div className="flex items-center gap-2 border-2 border-border bg-brand-lime px-3 py-1 font-mono text-xs font-bold text-black uppercase tracking-wider w-fit mb-6 brutal-shadow-sm">
          <span className="material-symbols-outlined text-sm">shield</span>
          LEGAL & DATA PROTECTION
        </div>

        {/* Title */}
        <div className="border-b-2 border-border pb-6 mb-8">
          <h1 className="font-hanken text-4xl sm:text-5xl font-black tracking-tight text-ink uppercase">
            PRIVACY POLICY
          </h1>
          <p className="font-mono text-xs font-bold text-ink-muted uppercase tracking-widest mt-2">
            LAST UPDATED: SEPTEMBER 2026 — UPGRID ENGINE COMPLIANCE
          </p>
        </div>

        {/* Content Card */}
        <div className="border-2 border-border bg-surface p-6 sm:p-10 brutal-shadow flex flex-col gap-8 font-sans text-sm text-ink-secondary leading-relaxed">
          {/* Section 1 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-base font-bold text-ink uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-2">
              <span className="text-brand-lime">01.</span> INFORMATION WE COLLECT
            </h2>
            <p>
              When you use Upgrid for uptime and latency observability, we collect the following categories of information:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 font-mono text-xs text-ink">
              <li>
                <strong>Account Information:</strong> When signing in with OAuth (Google or GitHub) or creating an account, we store your username, email address, profile name, and OAuth provider identifiers.
              </li>
              <li>
                <strong>Monitoring Targets:</strong> Public URLs and endpoints you configure for synthetic uptime probing.
              </li>
              <li>
                <strong>Synthetic Probe Telemetry:</strong> HTTP response codes, latency measurements (in milliseconds), regional timestamps, and status flags recorded by our distributed worker nodes.
              </li>
              <li>
                <strong>Usage & Session Data:</strong> Authentication session tokens, browser client headers, and access logs.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-base font-bold text-ink uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-2">
              <span className="text-brand-lime">02.</span> HOW WE USE YOUR INFORMATION
            </h2>
            <p>
              We process your data strictly to provide and secure the Upgrid monitoring infrastructure:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 font-mono text-xs text-ink">
              <li>Executing periodic synthetic HTTP probes from selected global regions (e.g. AP-SOUTH-1, US-EAST-1).</li>
              <li>Calculating real-time uptime percentages, latency distributions, and SLA metrics on your dashboard.</li>
              <li>Authenticating your session and verifying access to your registered endpoints.</li>
              <li>Maintaining system health, detecting abusive activity, and preventing automated denial-of-service attempts.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-base font-bold text-ink uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-2">
              <span className="text-brand-lime">03.</span> THIRD-PARTY OAUTH AUTHENTICATION
            </h2>
            <p>
              Upgrid supports single sign-on through Google and GitHub OAuth:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 font-mono text-xs text-ink">
              <li>We request only standard read-only profile scopes (email, name, avatar).</li>
              <li>We never store or have access to your Google or GitHub passwords.</li>
              <li>You may revoke Upgrid's access at any time directly through your Google Account Permissions or GitHub Authorized OAuth Apps settings.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-base font-bold text-ink uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-2">
              <span className="text-brand-lime">04.</span> DATA RETENTION & SECURITY
            </h2>
            <p>
              Probe telemetry ticks are stored in secure, encrypted cloud databases (PostgreSQL/Neon over TLS). Probe logs are retained for rolling historical windows (up to 90 days) before automated aggregation and cleanup. We implement industry-standard access control, encryption in transit (HTTPS/TLS), and restricted database credentials.
            </p>
          </section>

          {/* Section 5 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-base font-bold text-ink uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-2">
              <span className="text-brand-lime">05.</span> USER RIGHTS & DATA DELETION
            </h2>
            <p>
              You have the right to request deletion of your account, registered monitors, and associated probe history at any time. To request data export or complete deletion, contact the system administrators or manage your monitor catalog directly through the dashboard.
            </p>
          </section>

          {/* Contact Box */}
          <div className="border-2 border-border bg-surface-container p-4 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-ink uppercase">QUESTIONS REGARDING PRIVACY?</span>
              <p className="text-ink-muted text-[11px] mt-0.5">Reach out to the Upgrid security and infrastructure team.</p>
            </div>
            <a
              href="mailto:support@upgrid.io"
              className="border-2 border-border bg-surface px-3 py-1.5 font-bold text-ink hover:bg-brand-lime hover:text-black transition-colors shrink-0"
            >
              CONTACT TEAM
            </a>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
