import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Space_Mono } from "next/font/google";
import { ThemeProvider } from "@repo/ui/theme-provider";
import { ToastProvider } from "@repo/ui/toast";
import { AuthProvider } from "../lib/auth-context";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UPGRID — Brutalist Distributed Uptime Monitoring",
  description:
    "High-performance distributed uptime and latency monitoring. Track response times, SLA compliance, and global node health in real-time.",
  keywords: ["uptime monitoring", "latency tracking", "SLA", "distributed systems", "observability"],
  authors: [{ name: "UPGRID ENGINE" }],
  openGraph: {
    title: "UPGRID — Brutalist Distributed Uptime Monitoring",
    description: "Real-time distributed uptime and latency monitoring platform.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/* Anti-flash: runs before React hydration to apply saved theme */
const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('upgrid-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${hankenGrotesk.variable} ${spaceMono.variable}`}
    >
      <head>
        {/* Anti-flash theme script must run synchronously before render */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Material Symbols Outlined icon font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="bg-surface text-ink antialiased min-h-screen">
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
