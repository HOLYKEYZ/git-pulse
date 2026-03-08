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
                    bg: "#0D1117",
                    card: "#161B22",
                    border: "#30363D",
                    green: "#238636",
                    blue: "#1F6FEB",
                    text: "#E6EDF3",
                    muted: "#8B949E",
                    notification: "#D29922",
                }
            },
        },
    },
    plugins: [],
};
export default config;
