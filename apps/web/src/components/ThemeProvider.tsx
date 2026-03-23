"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "github" | "midnight";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "github",
  setTheme: () => {}
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: {children: React.ReactNode;}) {
  const [theme, setThemeState] = useState<Theme>("github");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // read saved theme from localstorage on mount
    const saved = localStorage.getItem("gitpulse-theme") as Theme | null;
    if (saved === "github" || saved === "midnight") {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("gitpulse-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // prevent flash of wrong theme
  if (!mounted) {
    return (
      <div data-theme="github" style={{ visibility: "hidden" }}>
                {children}
            </div>);

  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>);

}