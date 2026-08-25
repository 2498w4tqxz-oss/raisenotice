import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#152238",
          mid: "#1e3354",
          faint: "#e8eef6",
        },
        gold: {
          DEFAULT: "#b8860b",
          deep: "#8f6808",
          faint: "#f7efd6",
        },
        cream: "#f6f1e7",
        sheet: "#fffcf7",
        paper: "#fffcf7",
        ink: "#14181f",
        mute: "#5c6570",
        slate: {
          DEFAULT: "#5c6570",
          faint: "#e7e2d6",
        },
        rule: "#e2d9c8",
        ok: {
          DEFAULT: "#1f6b4a",
          faint: "#e4f3ec",
        },
        warn: {
          DEFAULT: "#9b2c2c",
          faint: "#f8e8e8",
        },
        burgundy: {
          DEFAULT: "#7a1f2b",
          faint: "#f6e8ea",
        },
        amber: {
          DEFAULT: "#92400e",
          faint: "#f6edd8",
        },
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-libre)", "Georgia", "serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        sheet: "0 18px 50px -22px rgba(21, 34, 56, 0.35), 0 0 0 1px rgba(21,34,56,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
