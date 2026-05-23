import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Theme } from "../types";

interface ThemeStoreState {
  theme: Theme;
  systemTheme: Theme;
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSystemTheme: (theme: Theme) => void;
}

type ThemeStore = ThemeStoreState & ThemeActions;

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";

  const stored = localStorage.getItem("theme-preference");
  if (stored) return stored as Theme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      systemTheme: getInitialTheme(),

      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== "undefined") {
          const html = document.documentElement;
          if (theme === "dark") {
            html.classList.add("dark");
          } else {
            html.classList.remove("dark");
          }
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "light" ? "dark" : "light";
        get().setTheme(newTheme);
      },

      setSystemTheme: (theme) => {
        set({ systemTheme: theme });
      },
    }),
    {
      name: "theme-store",
      partialize: (state) => ({
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const html = document.documentElement;
          if (state.theme === "dark") {
            html.classList.add("dark");
          } else {
            html.classList.remove("dark");
          }
        }
      },
    }
  )
);

// Listen to system theme changes
if (typeof window !== "undefined") {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleThemeChange = (e: MediaQueryListEvent) => {
    const newTheme = e.matches ? "dark" : "light";
    useThemeStore.setState({ systemTheme: newTheme });
  };

  mediaQuery.addEventListener("change", handleThemeChange);
}

/**
 * Helper hook for backward compatibility with old ThemeContext
 */
export const useTheme = () => {
  const { theme, toggleTheme } = useThemeStore();
  return {
    theme,
    toggleTheme,
  };
};
