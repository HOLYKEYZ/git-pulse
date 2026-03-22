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
                background: "var(--bg)",
                foreground: "var(--text)",
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
                    contribution: {
                        0: "#161B22",
                        1: "#0e4429",
                        2: "#006d32",
                        3: "#26a641",
                        4: "#39d353",
                    },
                },
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
