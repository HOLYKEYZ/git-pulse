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
        'git-green-hover': '#2ea043',
        git: {
          bg: "var(--bg)",
          card: "var(--card)",
          border: "var(--border)",
          green: "var(--green)",
          accent: "var(--accent)",
          text: "var(--text)",
          muted: "var(--muted)",
          notification: "var(--notification)",
          hover: "var(--hover)",
          'tab-active-border': '#f78166',
          'tab-count-bg': '#30363d',
          contribution: {
            0: "#161B22",
            1: "#0e4429",
            2: "#006d32",
            3: "#26a641",
            4: "#39d353",
          },
        },
        githubBlue: '#2f81f7',
        githubDarkBg: '#161b22',
        'star-active': '#e3b341',
        'timeline-border-dark': '#0d1117',
        'timeline-bg-dark': '#161b22',
        'timeline-icon-default': '#8b949e',
        'timeline-divider': '#30363d',
        'timeline-progress-blue': '#1f6feb',
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Noto Sans",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "SFMono-Regular",
          "Consolas",
          "Liberation Mono",
          "Menlo",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
