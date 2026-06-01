export interface GameDef {
  id: string;
  label: string;
  icon: string;
  path: string;
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
];
