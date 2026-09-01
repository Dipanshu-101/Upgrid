import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#f9f9f9",
        "surface-dim": "#dadada",
        "surface-bright": "#f9f9f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f3",
        "surface-container": "#eeeeee",
        "surface-container-high": "#e8e8e8",
        "surface-container-highest": "#e2e2e2",
        "surface-variant": "#e2e2e2",
        "surface-tint": "#506600",

        "on-surface": "#1a1c1c",
        "on-surface-variant": "#444933",
        "on-background": "#1a1c1c",
        "background": "#f9f9f9",

        "inverse-surface": "#2f3131",
        "inverse-on-surface": "#f1f1f1",
        "inverse-primary": "#abd600",

        "primary": "#506600",
        "on-primary": "#ffffff",
        "primary-container": "#ccff00",
        "on-primary-container": "#5b7300",
        "primary-fixed": "#c3f400",
        "primary-fixed-dim": "#abd600",
        "on-primary-fixed": "#161e00",
        "on-primary-fixed-variant": "#3c4d00",

        "secondary": "#5e5e5e",
        "on-secondary": "#ffffff",
        "secondary-container": "#e2e2e2",
        "on-secondary-container": "#646464",
        "secondary-fixed": "#e2e2e2",
        "secondary-fixed-dim": "#c6c6c6",
        "on-secondary-fixed": "#1b1b1b",
        "on-secondary-fixed-variant": "#474747",

        "tertiary": "#c00100",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#ffe8e4",
        "on-tertiary-container": "#d80100",
        "tertiary-fixed": "#ffdad4",
        "tertiary-fixed-dim": "#ffb4a8",
        "on-tertiary-fixed": "#410000",
        "on-tertiary-fixed-variant": "#930100",

        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        "outline": "#747a60",
        "outline-variant": "#c4c9ac",

        "brand-up": "#ccff00",
        "brand-down": "#ba1a1a",
        "brand-cyan": "#00f0ff",
      },
      fontFamily: {
        sans: ["var(--font-hanken-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
        "hanken": ["var(--font-hanken-grotesk)", "system-ui", "sans-serif"],
        "space-mono": ["var(--font-space-mono)", "monospace"],
        "display-xl": ["var(--font-hanken-grotesk)", "sans-serif"],
        "headline-lg": ["var(--font-hanken-grotesk)", "sans-serif"],
        "headline-md": ["var(--font-hanken-grotesk)", "sans-serif"],
        "body-lg": ["var(--font-hanken-grotesk)", "sans-serif"],
        "body-md": ["var(--font-hanken-grotesk)", "sans-serif"],
        "metric-xl": ["var(--font-space-mono)", "monospace"],
        "label-caps": ["var(--font-space-mono)", "monospace"],
      },
      fontSize: {
        "display-xl": ["84px", { lineHeight: "80px", letterSpacing: "-0.04em", fontWeight: "900" }],
        "headline-lg": ["48px", { lineHeight: "52px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-lg-mobile": ["32px", { lineHeight: "36px", fontWeight: "800" }],
        "headline-md": ["32px", { lineHeight: "36px", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "metric-xl": ["64px", { lineHeight: "64px", fontWeight: "700" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.1em", fontWeight: "700" }],
      },
      spacing: {
        unit: "8px",
        "grid-size": "24px",
        "border-width": "2px",
        gutter: "24px",
        "margin-page": "48px",
      },
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
      },
      boxShadow: {
        hard: "4px 4px 0px 0px rgba(0, 0, 0, 1)",
        "hard-sm": "2px 2px 0px 0px rgba(0, 0, 0, 1)",
        "hard-lg": "8px 8px 0px 0px rgba(0, 0, 0, 1)",
        "hard-dark": "4px 4px 0px 0px rgba(255, 255, 255, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
