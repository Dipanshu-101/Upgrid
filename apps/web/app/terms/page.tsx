import type { Metadata } from "next";
import { LandingNavbar } from "@repo/ui/landing-navbar";
import { LandingFooter } from "@repo/ui/landing-footer";

export const metadata: Metadata = {
  title: "Terms of Service — UPGRID",
  description: "Terms of service and acceptable use policy for Upgrid distributed uptime and telemetry monitoring.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink bg-grid">
      <LandingNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header Badge */}
        <div className="flex items-center gap-2 border-2 border-border bg-brand-lime px-3 py-1 font-mono text-xs font-bold text-black uppercase tracking-wider w-fit mb-6 brutal-shadow-sm">
          <span className="material-symbols-outlined text-sm">gavel</span>
          TERMS & CONDITIONS
        </div>

        {/* Title */}
        <div className="border-b-2 border-border pb-6 mb-8">
          <h1 className="font-hanken text-4xl sm:text-5xl font-black tracking-tight text-ink uppercase">
            TERMS OF SERVICE
          </h1>
          <p className="font-mono text-xs font-bold text-ink-muted uppercase tracking-widest mt-2">
            LAST UPDATED: SEPTEMBER 2026 — UPGRID ENGINE TERMS
          </p>
        </div>

        {/* Content Card */}
        <div className="border-2 border-border bg-surface p-6 sm:p-10 brutal-shadow flex flex-col gap-8 font-sans text-sm text-ink-secondary leading-relaxed">
          {/* Section 1 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-base font-bold text-ink uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-2">
              <span className="text-brand-lime">01.</span> ACCEPTANCE OF TERMS
            </h2>
            <p>
              By accessing or using the Upgrid platform (including the web dashboard, APIs, synthetic probe engine, and related services), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-base font-bold text-ink uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-2">
              <span className="text-brand-lime">02.</span> SERVICE DESCRIPTION & PROBE NETWORK
            </h2>
            <p>
              Upgrid provides distributed uptime, response latency, and health monitoring services by sending automated HTTP/HTTPS requests from distributed regional worker nodes to user-designated target endpoints at configured intervals.
            </p>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-base font-bold text-ink uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-2">
              <span className="text-brand-lime">03.</span> ACCEPTABLE USE & AUTHORIZATION
            </h2>
            <p>
              You represent and warrant that you own or possess valid operational authorization to monitor all target URLs registered in your Upgrid account. You strictly agree NOT to:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5 font-mono text-xs text-ink">
              <li>Use Upgrid probe infrastructure to initiate Denial of Service (DoS) or Distributed Denial of Service (DDoS) attacks against third-party systems.</li>
              <li>Probe endpoints designed to exploit vulnerabilities or bypass rate-limiting security mechanisms.</li>
              <li>Reverse engineer, disrupt, or tamper with the distributed worker queue, pusher scheduler, or backend telemetry systems.</li>
              <li>Create automated accounts or abuse API endpoints to degrade platform quality for other operators.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-base font-bold text-ink uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-2">
              <span className="text-brand-lime">04.</span> SERVICE AVAILABILITY & DISCLAIMER
            </h2>
            <p>
              Upgrid is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis. While we strive for 99.9% probe dispatcher availability and sub-second regional reporting accuracy, Upgrid makes no express or implied warranties regarding continuous, uninterrupted, or error-free monitoring. We are not liable for business loss, missed alerts, or third-party outages.
            </p>
          </section>

          {/* Section 5 */}
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-base font-bold text-ink uppercase tracking-wider border-b border-border pb-1.5 flex items-center gap-2">
              <span className="text-brand-lime">05.</span> TERMINATION
            </h2>
            <p>
              We reserve the right to suspend or terminate operator accounts and halt probe execution for any targets found in violation of our acceptable use guidelines or engaging in malicious network behavior.
            </p>
          </section>

          {/* Contact Box */}
          <div className="border-2 border-border bg-surface-container p-4 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-ink uppercase">TERMS QUESTIONS OR INQUIRIES?</span>
              <p className="text-ink-muted text-[11px] mt-0.5">Contact the Upgrid operations and legal team.</p>
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
