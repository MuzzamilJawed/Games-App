import { useState, useCallback, useEffect } from "react";
import { GAMES } from "../gameRegistry";

export type ThemeMode = "system" | "dark" | "light";

/** Ordered difficulty levels the per-game slider can select. */
export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard", "Expert"] as const;

/** Map a game's default difficulty label to a slider index. */
export function defaultDifficultyIndex(label: string): number {
  const map: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2, Expert: 3, Party: 1 };
  return map[label] ?? 1;
}

export interface AppSettings {
  /** Game IDs pinned to the mobile bottom nav (max 3). */
  pinnedGames: string[];
  /** Game IDs hidden from the dashboard. */
  hiddenGames: string[];
  /** Theme mode: system, dark, or light. */
  theme: ThemeMode;
  /** Per-game difficulty level (index into DIFFICULTY_LEVELS). */
  difficulties: Record<string, number>;
}

const DEFAULT_SETTINGS: AppSettings = {
  pinnedGames: GAMES.slice(0, 3).map((g) => g.id),
  hiddenGames: [],
  theme: "system",
  difficulties: Object.fromEntries(GAMES.map((g) => [g.id, defaultDifficultyIndex(g.difficulty)])),
};

function load(): AppSettings {
  try {
    const raw = localStorage.getItem("arcade_settings");
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persist(s: AppSettings) {
  localStorage.setItem("arcade_settings", JSON.stringify(s));
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(load);

  // Apply theme based on settings
  useEffect(() => {
    const applyTheme = (mode: ThemeMode) => {
      let effectiveTheme: "dark" | "light" = "dark";
      
      if (mode === "system") {
        // Detect system preference
        effectiveTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      } else {
        effectiveTheme = mode;
      }
      
      document.documentElement.setAttribute("data-theme", effectiveTheme);
    };

    applyTheme(settings.theme);

    // Listen for system theme changes when in system mode
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute("data-theme", e.matches ? "light" : "dark");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [settings.theme]);

  /** Toggle a game pinned to the bottom nav (cap: 3 slots). */
  const togglePin = useCallback((id: string) => {
    setSettings((prev) => {
      if (prev.pinnedGames.includes(id)) {
        const next = { ...prev, pinnedGames: prev.pinnedGames.filter((g) => g !== id) };
        persist(next);
        return next;
      }
      if (prev.pinnedGames.length >= 3) return prev; // already at max
      const next = { ...prev, pinnedGames: [...prev.pinnedGames, id] };
      persist(next);
      return next;
    });
  }, []);

  /** Toggle a game's visibility on the dashboard. */
  const toggleHide = useCallback((id: string) => {
    setSettings((prev) => {
      const isHidden = prev.hiddenGames.includes(id);
      const next = isHidden
        ? { ...prev, hiddenGames: prev.hiddenGames.filter((g) => g !== id) }
        : { ...prev, hiddenGames: [...prev.hiddenGames, id] };
      persist(next);
      return next;
    });
  }, []);

  /** Set theme mode: system, dark, or light. */
  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((prev) => {
      const next = { ...prev, theme };
      persist(next);
      return next;
    });
  }, []);

  /** Set a game's difficulty level (index into DIFFICULTY_LEVELS). */
  const setDifficulty = useCallback((id: string, level: number) => {
    setSettings((prev) => {
      const next = { ...prev, difficulties: { ...prev.difficulties, [id]: level } };
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    persist(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, togglePin, toggleHide, setTheme, setDifficulty, reset };
}
