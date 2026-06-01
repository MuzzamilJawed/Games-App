import { useState, useCallback } from "react";
import { GAMES } from "../gameRegistry";

export interface AppSettings {
  /** Game IDs pinned to the mobile bottom nav (max 3). */
  pinnedGames: string[];
  /** Game IDs hidden from the dashboard. */
  hiddenGames: string[];
}

const DEFAULT_SETTINGS: AppSettings = {
  pinnedGames: GAMES.slice(0, 3).map((g) => g.id),
  hiddenGames: [],
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

  const reset = useCallback(() => {
    persist(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, togglePin, toggleHide, reset };
}
