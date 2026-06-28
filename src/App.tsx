import { useRef, useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useSettings } from "./hooks/useSettings";
import { GAMES } from "./gameRegistry";
import DashboardPage from "./features/dashboard/DashboardPage";
import HangmanGame from "./features/hangman/HangmanGame";
import ImposterGame from "./features/imposter/ImposterGame";
import PacmanGame from "./features/pacman/PacmanGame";
import TicTacToeGame from "./features/tictactoe/TicTacToeGame";
import MemoryGame from "./features/memory/MemoryGame";
import SnakeGame from "./features/snake/SnakeGame";
import Game2048 from "./features/game2048/Game2048";
import MinesweeperGame from "./features/minesweeper/MinesweeperGame";
import Connect4Game from "./features/connect4/Connect4Game";
import SudokuGame from "./features/sudoku/SudokuGame";
import WordSearchGame from "./features/wordsearch/WordSearchGame";
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

function ThemeToggle({ currentTheme, onThemeChange }: { currentTheme: string; onThemeChange: (theme: any) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const themeOptions = [
    { value: "system", icon: "💻", label: "System" },
    { value: "dark", icon: "🌙", label: "Dark" },
    { value: "light", icon: "☀️", label: "Light" },
  ];

  const currentOption = themeOptions.find((t) => t.value === currentTheme) || themeOptions[0];

  return (
    <div className="theme-toggle-wrap" ref={ref}>
      <button
        className="theme-toggle-btn"
        onClick={() => setOpen((p) => !p)}
        title={`Theme: ${currentOption.label}`}
        aria-label="Toggle theme"
      >
        <span className="theme-icon">{currentOption.icon}</span>
      </button>
      {open && (
        <div className="theme-dropdown" role="menu">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              className={`theme-dropdown-item${currentTheme === opt.value ? " active" : ""}`}
              onClick={() => {
                onThemeChange(opt.value);
                setOpen(false);
              }}
              role="menuitem"
            >
              <span className="theme-icon">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const { settings, togglePin, toggleHide, setTheme, setDifficulty, reset } = useSettings();

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
          <ThemeToggle currentTheme={settings.theme} onThemeChange={setTheme} />
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage hiddenGames={settings.hiddenGames} />} />
          <Route path="/hangman" element={<HangmanGame />} />
          <Route path="/pacman" element={<PacmanGame />} />
          <Route path="/imposter" element={<ImposterGame />} />
          <Route path="/tictactoe" element={<TicTacToeGame />} />
          <Route path="/memory" element={<MemoryGame />} />
          <Route path="/snake" element={<SnakeGame />} />
          <Route path="/2048" element={<Game2048 />} />
          <Route path="/minesweeper" element={<MinesweeperGame />} />
          <Route path="/connect4" element={<Connect4Game />} />
          <Route path="/sudoku" element={<SudokuGame />} />
          <Route path="/wordsearch" element={<WordSearchGame />} />
          <Route path="/settings" element={<SettingsPage settings={settings} togglePin={togglePin} toggleHide={toggleHide} setTheme={setTheme} setDifficulty={setDifficulty} reset={reset} />} />
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
