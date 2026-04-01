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
        'gh-dark': '#0D1117',
        'gh-canvas': '#161B22',
        'gh-border': '#30363D',
        'gh-green': '#238636',
        'gh-green-light': '#2EA043',
        'gh-blue': '#1F6FEB',
        'gh-text': '#E6EDF3',
        'gh-muted': '#8B949E',
        'gh-green-glow': 'rgba(35, 134, 54, 0.15)',
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
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Noto Sans",
          "Helvetica",
          "Arial",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
        ],
        mono: [
          '"SFMono-Regular"',
          "Consolas",
          '"Liberation Mono"',
          "Menlo",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
