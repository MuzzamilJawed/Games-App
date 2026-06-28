import { useState } from "react";
import { GAMES } from "../../gameRegistry";
import type { AppSettings, ThemeMode } from "../../hooks/useSettings";
import { DIFFICULTY_LEVELS, defaultDifficultyIndex } from "../../hooks/useSettings";

interface Props {
  settings: AppSettings;
  togglePin: (id: string) => void;
  toggleHide: (id: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setDifficulty: (id: string, level: number) => void;
  reset: () => void;
}

const THEMES: { value: ThemeMode; icon: string; name: string; desc: string }[] = [
  { value: "system", icon: "💻", name: "System", desc: "Match your device" },
  { value: "dark", icon: "🌙", name: "Dark", desc: "Easy on the eyes" },
  { value: "light", icon: "☀️", name: "Light", desc: "Bright and clean" },
];

export default function SettingsPage({ settings, togglePin, toggleHide, setTheme, setDifficulty, reset }: Props) {
  const pinnedCount = settings.pinnedGames.length;
  // Appearance & Games start collapsed
  const [open, setOpen] = useState<{ appearance: boolean; games: boolean }>({
    appearance: false,
    games: false,
  });
  const toggle = (key: "appearance" | "games") =>
    setOpen((p) => ({ ...p, [key]: !p[key] }));

  return (
    <section className="set-page">
      <header className="set-head">
        <h2>Settings &amp; Preferences</h2>
        <p>Customize your gaming experience. All changes are saved automatically.</p>
      </header>

      {/* Appearance (collapsible) */}
      <section className={`set-card${open.appearance ? " is-open" : ""}`}>
        <button
          className="set-card-head set-card-toggle"
          onClick={() => toggle("appearance")}
          aria-expanded={open.appearance}
        >
          <span className="set-card-emoji">🎨</span>
          <div className="set-card-titles">
            <span className="set-card-title">Appearance</span>
            <span className="set-card-sub">Choose your preferred theme</span>
          </div>
          <span className="set-chevron" aria-hidden="true">▾</span>
        </button>

        {open.appearance && (
          <div className="set-card-body">
            <div className="set-themes">
              {THEMES.map((t) => {
                const active = settings.theme === t.value;
                return (
                  <button
                    key={t.value}
                    className={`set-theme${active ? " is-active" : ""}`}
                    onClick={() => setTheme(t.value)}
                    aria-pressed={active}
                  >
                    <span className="set-theme-emoji">{t.icon}</span>
                    <span className="set-theme-text">
                      <span className="set-theme-name">{t.name}</span>
                      <span className="set-theme-desc">{t.desc}</span>
                    </span>
                    <span className="set-theme-check" aria-hidden="true">
                      {active ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Games (collapsible, inner-scrolling list) */}
      <section className={`set-card${open.games ? " is-open" : ""}`}>
        <button
          className="set-card-head set-card-toggle"
          onClick={() => toggle("games")}
          aria-expanded={open.games}
        >
          <span className="set-card-emoji">🎮</span>
          <div className="set-card-titles">
            <span className="set-card-title">Games</span>
            <span className="set-card-sub">Manage visibility, difficulty &amp; pinned games</span>
          </div>
          <span className="set-chevron" aria-hidden="true">▾</span>
        </button>

        {open.games && (
          <>
            <div className="set-games">
              {GAMES.map((game) => {
                const isPinned = settings.pinnedGames.includes(game.id);
                const canPin = isPinned || pinnedCount < 3;
                const isVisible = !settings.hiddenGames.includes(game.id);
                const level =
                  settings.difficulties?.[game.id] ?? defaultDifficultyIndex(game.difficulty);
                return (
                  <div key={game.id} className="set-game">
                    <div className="set-game-top">
                      <span className="set-game-emoji">{game.icon}</span>
                      <div className="set-game-meta">
                        <span className="set-game-name">{game.label}</span>
                        <span className="set-game-diff" style={{ color: game.color }}>
                          {DIFFICULTY_LEVELS[level]}
                        </span>
                      </div>

                      <div className="set-game-controls">
                        <label
                          className="set-ctrl"
                          title={isVisible ? "Hide from dashboard" : "Show on dashboard"}
                        >
                          <span className="set-ctrl-label">Show</span>
                          <span className="set-switch">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => toggleHide(game.id)}
                            />
                            <span className="set-switch-track" />
                          </span>
                        </label>

                        <div className="set-ctrl">
                          <span className="set-ctrl-label">Pin</span>
                          <button
                            className={`set-pin${isPinned ? " is-pinned" : ""}`}
                            onClick={() => togglePin(game.id)}
                            disabled={!canPin}
                            title={
                              !canPin
                                ? "Max 3 pinned"
                                : isPinned
                                ? "Remove from quick access"
                                : "Add to quick access"
                            }
                          >
                            {isPinned ? "⭐" : "☆"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Per-game difficulty slider */}
                    <div className="set-game-slider">
                      <span className="set-slider-label">Difficulty</span>
                      <input
                        className="set-range"
                        type="range"
                        min={0}
                        max={DIFFICULTY_LEVELS.length - 1}
                        step={1}
                        value={level}
                        onChange={(e) => setDifficulty(game.id, Number(e.target.value))}
                        style={{ accentColor: game.color }}
                        aria-label={`${game.label} difficulty`}
                      />
                      <span className="set-slider-value" style={{ color: game.color }}>
                        {DIFFICULTY_LEVELS[level]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="set-games-foot">
              {pinnedCount === 0 ? (
                <span>⭐ Pin your favorite games for quick access</span>
              ) : (
                <span>
                  Quick access: <strong>{pinnedCount} / 3</strong> pinned
                </span>
              )}
            </div>
          </>
        )}
      </section>

      {/* Advanced (always open) */}
      <section className="set-card is-open">
        <div className="set-card-head">
          <span className="set-card-emoji">⚙️</span>
          <div className="set-card-titles">
            <span className="set-card-title">Advanced</span>
            <span className="set-card-sub">Reset to default settings</span>
          </div>
        </div>

        <div className="set-card-body">
          <button className="set-reset" onClick={reset}>
            ↻ Reset to Defaults
          </button>
          <p className="set-reset-note">This will restore all default settings and preferences.</p>
        </div>
      </section>
    </section>
  );
}
