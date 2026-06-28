export interface GameDef {
  id: string;
  label: string;
  icon: string;
  path: string;
  color: string;
  description: string;
  difficulty: string;
}

export interface ComingSoonGame {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  difficulty: string;
}

/**
 * Central game registry — add new games here.
 * Everything (nav, dashboard, settings) derives from this list.
 */
export const GAMES: GameDef[] = [
  {
    id: "hangman",
    label: "Hangman",
    icon: "🪓",
    path: "/hangman",
    color: "#3b82f6",
    description: "Rescue the hero by guessing the secret word. 8 categories, 80+ words each.",
    difficulty: "Medium",
  },
  {
    id: "pacman",
    label: "Pacman",
    icon: "◉",
    path: "/pacman",
    color: "#facc15",
    description: "Classic arcade action! Dodge the ghosts and clear the maze of pellets.",
    difficulty: "Hard",
  },
  {
    id: "imposter",
    label: "Imposter",
    icon: "🕵️",
    path: "/imposter",
    color: "#a78bfa",
    description: "Find the odd one out! 8 categories, perfect for parties up to 16 players.",
    difficulty: "Party",
  },
  {
    id: "tictactoe",
    label: "Tic-Tac-Toe",
    icon: "⭕",
    path: "/tictactoe",
    color: "#38bdf8",
    description: "The timeless duel of X's and O's. Play a friend or challenge the AI.",
    difficulty: "Easy",
  },
  {
    id: "memory",
    label: "Memory Match",
    icon: "🧠",
    path: "/memory",
    color: "#34d399",
    description: "Flip the cards and test your memory. Find every matching pair to win.",
    difficulty: "Easy",
  },
  {
    id: "snake",
    label: "Snake",
    icon: "🐍",
    path: "/snake",
    color: "#4ade80",
    description: "Grow your snake by gobbling food — just don't bite your own tail!",
    difficulty: "Medium",
  },
  {
    id: "2048",
    label: "2048",
    icon: "🔢",
    path: "/2048",
    color: "#fbbf24",
    description: "Slide and merge the tiles to reach the legendary 2048 number.",
    difficulty: "Medium",
  },
  {
    id: "minesweeper",
    label: "Minesweeper",
    icon: "💣",
    path: "/minesweeper",
    color: "#f87171",
    description: "Clear the minefield using logic and nerve. One wrong tap and boom.",
    difficulty: "Hard",
  },
  {
    id: "connect4",
    label: "Connect Four",
    icon: "🔴",
    path: "/connect4",
    color: "#fb7185",
    description: "Drop your discs and line up four in a row before your rival does.",
    difficulty: "Medium",
  },
  {
    id: "sudoku",
    label: "Sudoku",
    icon: "🧩",
    path: "/sudoku",
    color: "#a78bfa",
    description: "Fill the grid so every row, column and box holds 1 to 9.",
    difficulty: "Hard",
  },
  {
    id: "wordsearch",
    label: "Word Search",
    icon: "🔍",
    path: "/wordsearch",
    color: "#22d3ee",
    description: "Hunt down hidden words tucked across the letter grid against the clock.",
    difficulty: "Easy",
  },
];

/**
 * Upcoming games — shown as locked "Coming Soon" cards on the dashboard
 * so the grid stays full and players know what's on the way.
 */
export const COMING_SOON: ComingSoonGame[] = [];
