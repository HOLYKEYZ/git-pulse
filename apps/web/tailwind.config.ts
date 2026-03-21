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
                background: "var(--background)",
                foreground: "var(--foreground)",
                git: {
                    bg: "#000000", /* Pure black X background */
                    card: "#0d1117", /* GitHub dark gray for cards */
                    border: "#2f3336", /* Sleek X hairline border */
                    green: "#238636",
                    blue: "#1d9bf0", /* X vibrant blue */
                    text: "#e7e9ea", /* X crisp white */
                    muted: "#71767b", /* X perfect gray */
                    notification: "#D29922",
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
