import { NavLink, Route, Routes } from "react-router-dom";
import DashboardPage from "./features/dashboard/DashboardPage";
import HangmanGame from "./features/hangman/HangmanGame";
import ImposterGame from "./features/imposter/ImposterGame";
import PacmanGame from "./features/pacman/PacmanGame";

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Arcade Dashboard</h1>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/hangman">Hangman</NavLink>
          <NavLink to="/pacman">Pacman</NavLink>
          <NavLink to="/imposter">Imposter</NavLink>
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/hangman" element={<HangmanGame />} />
          <Route path="/pacman" element={<PacmanGame />} />
          <Route path="/imposter" element={<ImposterGame />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
