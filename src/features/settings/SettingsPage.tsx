import { GAMES } from "../../gameRegistry";
import type { AppSettings } from "../../hooks/useSettings";

interface Props {
  settings: AppSettings;
  togglePin: (id: string) => void;
  toggleHide: (id: string) => void;
  reset: () => void;
}

export default function SettingsPage({ settings, togglePin, toggleHide, reset }: Props) {
  const pinnedCount = settings.pinnedGames.length;

  return (
    <section className="settings-page">
      <div className="settings-page-header">
        <h2>Settings</h2>
        <p>Changes save automatically.</p>
      </div>

      {/* ── Games ──────────────────────────────────── */}
      <div className="settings-card">
        <div className="settings-card-head">
          <span className="settings-card-title">🎮 Games</span>
          <span className="settings-card-sub">
            Toggle dashboard visibility and pin games to the mobile nav.
          </span>
        </div>

        {/* Column headers */}
        <div className="sg-col-labels">
          <span className="sg-col-game">Game</span>
          <span className="sg-col-visible">Visible</span>
          <span className="sg-col-pin">Mobile pin</span>
        </div>

        <div className="settings-game-list">
          {GAMES.map((game) => {
            const isPinned = settings.pinnedGames.includes(game.id);
            const canPin = isPinned || pinnedCount < 3;
            const isVisible = !settings.hiddenGames.includes(game.id);
            return (
              <div key={game.id} className="settings-game-row">
                <span className="sg-icon">{game.icon}</span>
                <div className="sg-info">
                  <span className="sg-label">{game.label}</span>
                  <span className="sg-diff" style={{ color: game.color }}>{game.difficulty}</span>
                </div>
                <div className="sg-controls">
                  {/* Visibility toggle */}
                  <label className="sg-switch" title={isVisible ? "Hide from dashboard" : "Show on dashboard"}>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => toggleHide(game.id)}
                    />
                    <span className="sg-switch-track" />
                  </label>

                  {/* Pin button */}
                  <button
                    className={`sg-pin-btn${isPinned ? " pinned" : ""}`}
                    onClick={() => togglePin(game.id)}
                    disabled={!canPin}
                    title={!canPin ? "Max 3 pinned" : isPinned ? "Unpin" : "Pin to nav"}
                  >
                    {isPinned ? "📌" : "Pin"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {pinnedCount === 0 && (
          <p className="settings-warn">⚠ No games pinned — only Home &amp; Settings show in the mobile nav.</p>
        )}
        <p className="sg-pin-counter">
          Mobile nav slots: <strong>{pinnedCount} / 3</strong> used
        </p>
      </div>

      {/* ── General (coming soon) ─────────────────── */}
      <div className="settings-card settings-card-muted">
        <div className="settings-card-head">
          <span className="settings-card-title">🔧 General</span>
          <span className="settings-card-sub">More options coming soon.</span>
        </div>
        <div className="settings-coming-soon">
          <span>Sound effects</span>
          <span>Animations</span>
          <span>Color theme</span>
        </div>
      </div>

      {/* ── Reset ─────────────────────────────────── */}
      <button className="settings-reset-btn" onClick={reset}>
        Reset to Defaults
      </button>
    </section>
  );
}
