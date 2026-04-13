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

  const applyThemeToDOM = (selectedTheme: Theme) => {
    localStorage.setItem("gitpulse-theme", selectedTheme);
    document.documentElement.setAttribute("data-theme", selectedTheme);
  };

const getSystemTheme = () => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return "midnight";
  } else {
    return "github";
  }
};

useEffect(() => {
  // read saved theme from localstorage on mount
  const saved = localStorage.getItem("gitpulse-theme") as Theme | null;
  if (saved === "github" || saved === "midnight") {
    setThemeState(saved);
    applyThemeToDOM(saved);
  } else {
    const systemTheme = getSystemTheme();
    setThemeState(systemTheme);
    applyThemeToDOM(systemTheme);
  }
  setMounted(true);
}, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
  };

  // prevent flash of wrong theme
  if (!mounted) {
    return (
      <div data-theme={theme} style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>);

}