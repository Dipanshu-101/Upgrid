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
        surface: {
          DEFAULT: "var(--color-surface)",
          dim: "var(--color-surface-dim)",
          bright: "var(--color-surface-bright)",
          lowest: "var(--color-surface-lowest)",
          low: "var(--color-surface-low)",
          container: "var(--color-surface-container)",
          high: "var(--color-surface-high)",
          highest: "var(--color-surface-highest)",
          variant: "var(--color-surface-variant)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          secondary: "var(--color-ink-secondary)",
          muted: "var(--color-ink-muted)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          subtle: "var(--color-border-subtle)",
        },
        electric: {
          lime: "#ccff00",
          limeDark: "#abd600",
        },
        alert: {
          red: "#ba1a1a",
          redBright: "#ff0000",
        },
        accent: {
          cyan: "#00f0ff",
        },
        // Direct theme tokens for quick utility access
        "brand-lime": "#ccff00",
        "brand-red": "#ba1a1a",
        "brand-cyan": "#00f0ff",
      },
      fontFamily: {
        sans: ["var(--font-hanken-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
        hanken: ["var(--font-hanken-grotesk)", "system-ui", "sans-serif"],
        "space-mono": ["var(--font-space-mono)", "monospace"],
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
      borderWidth: {
        brutal: "2px",
        "brutal-thick": "3px",
        "brutal-heavy": "4px",
      },
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
      },
      boxShadow: {
        hard: "var(--shadow-hard)",
        "hard-sm": "var(--shadow-hard-sm)",
        "hard-lg": "var(--shadow-hard-lg)",
        "hard-hover": "var(--shadow-hard-hover)",
        "hard-lime": "4px 4px 0px 0px #ccff00",
        "hard-red": "4px 4px 0px 0px #ba1a1a",
      },
      keyframes: {
        "radar-ping": {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.8)", opacity: "0.2" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "caret-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        "glitch-shift": {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
      },
      animation: {
        "radar-ping": "radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "caret-blink": "caret-blink 1s step-start infinite",
        "scan-line": "scan-line 6s linear infinite",
        "glitch-shift": "glitch-shift 0.2s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
