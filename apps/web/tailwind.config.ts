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
                    contribution: {
                        0: "#161B22",
                        1: "#0e4429",
                        2: "#006d32",
                        3: "#26a641",
                        4: "#39d353"
                    }
                }
            },
        },
    },
    plugins: [],
};
                    }
                }
            },
        },
    },
    plugins: [],
};
export default config;
