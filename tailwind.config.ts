import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        umbra: {
          black:   "#080808",
          dark:    "#0f0f0f",
          surface: "#151515",
          border:  "#1e1e1e",
          gold:    "#c5a46c",
          "gold-deep": "#8a6f42",
          text:    "#ece8e0",
          muted:   "#5a5a5a",
          subtle:  "#2a2a2a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body:    ["var(--font-body)", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      letterSpacing: {
        umbra:   "0.45em",
        wide:    "0.18em",
        caption: "0.35em",
      },
      animation: {
        "fade-in":    "fadeIn 1.4s ease forwards",
        "fade-up":    "fadeUp 1s ease forwards",
        "glow-pulse": "glowPulse 5s ease-in-out infinite",
        "orb-drift":  "orbDrift 22s ease-in-out infinite",
        "orb-drift2": "orbDrift2 28s ease-in-out infinite",
        "line-grow":  "lineGrow 1.2s ease forwards",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.25" },
          "50%":      { opacity: "0.55" },
        },
        orbDrift: {
          "0%, 100%": { transform: "translate(0px, 0px)" },
          "33%":      { transform: "translate(-40px, -60px)" },
          "66%":      { transform: "translate(30px, 40px)" },
        },
        orbDrift2: {
          "0%, 100%": { transform: "translate(0px, 0px)" },
          "40%":      { transform: "translate(50px, -30px)" },
          "70%":      { transform: "translate(-20px, 50px)" },
        },
        lineGrow: {
          "0%":   { scaleX: "0" },
          "100%": { scaleX: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
