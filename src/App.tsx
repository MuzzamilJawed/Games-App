import { useRef, useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useSettings } from "./hooks/useSettings";
import { GAMES } from "./gameRegistry";
import DashboardPage from "./features/dashboard/DashboardPage";
import HangmanGame from "./features/hangman/HangmanGame";
import ImposterGame from "./features/imposter/ImposterGame";
import PacmanGame from "./features/pacman/PacmanGame";
import SettingsPage from "./features/settings/SettingsPage";

function GamesDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isOnGame = GAMES.some((g) => location.pathname === g.path);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div className="nav-games-wrap" ref={ref}>
      <button
        className={`nav-games-btn${open || isOnGame ? " active" : ""}`}
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        Games <span className={`nav-chevron${open ? " flipped" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="nav-games-menu" role="menu">
          {GAMES.map((g) => (
            <NavLink key={g.id} to={g.path} role="menuitem" onClick={() => setOpen(false)}>
              <span className="nav-game-icon">{g.icon}</span>
              {g.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const { settings, togglePin, toggleHide, reset } = useSettings();

  // const pinnedGames = GAMES
  //   .filter((g) => settings.pinnedGames.includes(g.id))
  //   .sort((a, b) => settings.pinnedGames.indexOf(a.id) - settings.pinnedGames.indexOf(b.id));

  const bottomLinks = [
    { to: "/", label: "Home", icon: "⊞", end: true },
    // ...pinnedGames.map((g) => ({ to: g.path, label: g.label, icon: g.icon, end: false })),
    { to: "/settings", label: "Settings", icon: "⚙️", end: false },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-dot" aria-hidden="true" />
          <h1>Arcade Dashboard</h1>
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <GamesDropdown />
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage hiddenGames={settings.hiddenGames} />} />
          <Route path="/hangman" element={<HangmanGame />} />
          <Route path="/pacman" element={<PacmanGame />} />
          <Route path="/imposter" element={<ImposterGame />} />
          <Route path="/settings" element={<SettingsPage settings={settings} togglePin={togglePin} toggleHide={toggleHide} reset={reset} />} />
        </Routes>
      </main>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {bottomLinks.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className="bottom-nav-item">
            <span className="bnav-icon">{link.icon}</span>
            <span className="bnav-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default App;
