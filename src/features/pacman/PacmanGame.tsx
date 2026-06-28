import { useEffect, useMemo, useState } from "react";
import GameLayout from "../../components/GameLayout";
import DifficultySlider from "../../components/DifficultySlider";

type Position = { row: number; col: number };
type Direction = "up" | "down" | "left" | "right";

const BOARD_TEMPLATE = [
  "###############",
  "#.............#",
  "#.###.###.###.#",
  "#.............#",
  "#.###.#.#.###.#",
  "#.....#.#.....#",
  "###.#.#.#.#.###",
  "#...#.....#...#",
  "###.#.###.#.###",
  "#.....#.#.....#",
  "#.###.#.#.###.#",
  "#.............#",
  "#.###.###.###.#",
  "#.............#",
  "###############",
];

const START_PLAYER: Position = { row: 1, col: 1 };
const START_GHOSTS: Position[] = [
  { row: 7, col: 7 },
  { row: 7, col: 8 },
];
const MOVES: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};
const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];
const ghostPalette = ["#fb7185", "#22d3ee", "#c084fc", "#f97316"];

type PacmanSettings = {
  playerSpeed: number;
  ghostSpeed: number;
  ghostCount: number;
};

const defaultSettings: PacmanSettings = {
  playerSpeed: 140,
  ghostSpeed: 320,
  ghostCount: 2,
};

/** Difficulty presets (Easy → Hard) that map to the speed/ghost settings. */
const PAC_DIFFICULTIES = {
  Easy: { playerSpeed: 180, ghostSpeed: 380, ghostCount: 1 },
  Medium: { playerSpeed: 140, ghostSpeed: 320, ghostCount: 2 },
  Hard: { playerSpeed: 110, ghostSpeed: 250, ghostCount: 2 },
} as const;
type PacDifficulty = keyof typeof PAC_DIFFICULTIES;

const difficultyOf = (s: PacmanSettings): PacDifficulty => {
  const match = (Object.keys(PAC_DIFFICULTIES) as PacDifficulty[]).find(
    (k) =>
      PAC_DIFFICULTIES[k].playerSpeed === s.playerSpeed &&
      PAC_DIFFICULTIES[k].ghostSpeed === s.ghostSpeed &&
      PAC_DIFFICULTIES[k].ghostCount === s.ghostCount
  );
  return match ?? "Medium";
};

const keyOf = (position: Position) => `${position.row}:${position.col}`;

const isWall = (position: Position) => BOARD_TEMPLATE[position.row][position.col] === "#";

const getNextPosition = (position: Position, direction: Direction): Position => {
  const move = MOVES[direction];
  return { row: position.row + move.row, col: position.col + move.col };
};

const createPelletSet = () => {
  const pellets = new Set<string>();
  BOARD_TEMPLATE.forEach((line, row) => {
    [...line].forEach((char, col) => {
      if (char === ".") pellets.add(`${row}:${col}`);
    });
  });
  pellets.delete(keyOf(START_PLAYER));
  START_GHOSTS.forEach((ghost) => pellets.delete(keyOf(ghost)));
  return pellets;
};

function PacmanGame() {
  const [settings, setSettings] = useState<PacmanSettings>(defaultSettings);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(true);
  const [phase, setPhase] = useState<"idle" | "playing">("idle");
  const [player, setPlayer] = useState<Position>(START_PLAYER);
  const [direction, setDirection] = useState<Direction>("right");
  const [ghosts, setGhosts] = useState<Position[]>(START_GHOSTS.slice(0, defaultSettings.ghostCount));
  const [pellets, setPellets] = useState<Set<string>>(() => createPelletSet());
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const isWin = pellets.size === 0;
  const isLose = lives <= 0;
  const isGameOver = isWin || isLose;

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") setDirection("up");
      if (event.key === "ArrowDown") setDirection("down");
      if (event.key === "ArrowLeft") setDirection("left");
      if (event.key === "ArrowRight") setDirection("right");
      if (event.key.toLowerCase() === "p") setIsPaused((prev) => !prev);
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  useEffect(() => {
    if (isPaused || isGameOver) return;
    const timer = window.setInterval(() => {
      setPlayer((prev) => {
        const next = getNextPosition(prev, direction);
        if (isWall(next)) return prev;
        return next;
      });
    }, settings.playerSpeed);
    return () => window.clearInterval(timer);
  }, [direction, isPaused, isGameOver, settings.playerSpeed]);

  useEffect(() => {
    if (isPaused || isGameOver) return;
    const timer = window.setInterval(() => {
      setGhosts((prevGhosts) =>
        prevGhosts.map((ghost) => {
          const validMoves = DIRECTIONS.map((dir) => getNextPosition(ghost, dir)).filter(
            (next) => !isWall(next),
          );
          return validMoves[Math.floor(Math.random() * validMoves.length)] ?? ghost;
        }),
      );
    }, settings.ghostSpeed);
    return () => window.clearInterval(timer);
  }, [isPaused, isGameOver, settings.ghostSpeed]);

  useEffect(() => {
    const playerKey = keyOf(player);
    setPellets((prev) => {
      if (!prev.has(playerKey)) return prev;
      const next = new Set(prev);
      next.delete(playerKey);
      return next;
    });
  }, [player]);

  useEffect(() => {
    const playerKey = keyOf(player);
    setScore((prev) => prev + (pellets.has(playerKey) ? 10 : 0));
  }, [player, pellets]);

  useEffect(() => {
    const collision = ghosts.some((ghost) => keyOf(ghost) === keyOf(player));
    if (!collision || isGameOver) return;
    setLives((prev) => prev - 1);
    setPlayer(START_PLAYER);
    setDirection("right");
  }, [ghosts, player, isGameOver]);

  useEffect(() => {
    setGhosts(START_GHOSTS.slice(0, settings.ghostCount));
  }, [settings.ghostCount]);

  const boardCells = useMemo(() => {
    const playerKey = keyOf(player);
    const ghostKeyMap = new Map<string, number>();
    ghosts.forEach((ghost, index) => ghostKeyMap.set(keyOf(ghost), index));
    const items: Array<{
      id: string;
      type: "wall" | "path" | "pellet" | "player" | "ghost";
      ghostIndex?: number;
    }> = [];

    BOARD_TEMPLATE.forEach((line, row) => {
      [...line].forEach((char, col) => {
        const cellKey = `${row}:${col}`;
        if (char === "#") {
          items.push({ id: cellKey, type: "wall" });
          return;
        }
        if (cellKey === playerKey) {
          items.push({ id: cellKey, type: "player" });
          return;
        }
        if (ghostKeyMap.has(cellKey)) {
          items.push({ id: cellKey, type: "ghost", ghostIndex: ghostKeyMap.get(cellKey) });
          return;
        }
        if (pellets.has(cellKey)) {
          items.push({ id: cellKey, type: "pellet" });
          return;
        }
        items.push({ id: cellKey, type: "path" });
      });
    });

    return items;
  }, [ghosts, pellets, player]);

  const restart = () => {
    setPlayer(START_PLAYER);
    setDirection("right");
    setGhosts(START_GHOSTS.slice(0, settings.ghostCount));
    setPellets(createPelletSet());
    setScore(0);
    setLives(3);
    setIsPaused(false);
  };

  return (
    <GameLayout
      title="Pacman Lite"
      subtitle="Use arrow keys to move. Press P to pause. Collect all pellets and avoid ghosts."
      stats={
        <>
          <span className="chip">Score: {score}</span>
          <span className="chip">Lives: {lives}</span>
          <span className="chip">Pellets: {pellets.size}</span>
        </>
      }
      actions={
        phase === "idle" ? null : (
          <>
            <button className="btn" onClick={() => setIsPaused((prev) => !prev)} disabled={isGameOver}>
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button className="btn" onClick={restart}>Restart</button>
            <button className="btn btn-secondary" style={{ opacity: 0.7, fontSize: "0.8rem", padding: "0.35rem 0.7rem" }} onClick={() => setIsSetupOpen(true)}>Setup</button>
          </>
        )
      }
    >
      {/* Setup modal */}
      {isSetupOpen ? (
        <div className="modal-backdrop" onClick={() => { if (phase !== "idle") setIsSetupOpen(false); }} role="presentation">
          <section className="setup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="setup-modal-head">
              <h3>Game Setup</h3>
              {phase !== "idle" && (
                <button className="close-btn" onClick={() => setIsSetupOpen(false)} aria-label="Close">✕</button>
              )}
            </div>
            <div className="setup-tab-content">
              <div className="setup-tab-pane">
                <p className="setup-hint">Slide to set the difficulty, then start the game.</p>
                <DifficultySlider
                  options={["Easy", "Medium", "Hard"]}
                  value={difficultyOf(settings)}
                  onChange={(v) => setSettings(PAC_DIFFICULTIES[v as PacDifficulty])}
                />
              </div>
            </div>
            <div className="setup-modal-footer">
              {phase === "idle" ? (
                <button className="btn btn-block" onClick={() => { restart(); setPhase("playing"); setIsSetupOpen(false); }}>
                  Start Game
                </button>
              ) : (
                <button className="btn btn-block" onClick={() => { restart(); setIsSetupOpen(false); }}>
                  Restart with Settings
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {/* Idle screen */}
      {phase === "idle" ? (
        <section className="game-idle-view">
          <div className="hero-icon">◎</div>
          <h3>Ready to play Pacman?</h3>
          <p>Use arrow keys (or on-screen buttons) to move. Collect all pellets and avoid the ghosts!</p>
          <button className="btn btn-lg" onClick={() => setIsSetupOpen(true)}>Configure &amp; Play</button>
        </section>
      ) : (
        <>
      <p className="status" role="status">
        {isWin && "You cleared the board. You win."}
        {isLose && "No lives left. Game over."}
        {!isGameOver && (isPaused ? "Game paused." : "Game running.")}
      </p>
      <div className="pacman-board" role="grid" aria-label="Pacman board">
        {boardCells.map((cell) => (
          <div
            key={cell.id}
            className={`tile tile-${cell.type}`}
            style={
              cell.type === "ghost" && typeof cell.ghostIndex === "number"
                ? { backgroundColor: ghostPalette[cell.ghostIndex % ghostPalette.length] }
                : undefined
            }
          />
        ))}
      </div>
      <div className="control-pad" aria-label="Touch controls">
        <button className="key-btn" onClick={() => setDirection("up")} aria-label="Move up">
          ↑
        </button>
        <div className="control-pad-middle">
          <button className="key-btn" onClick={() => setDirection("left")} aria-label="Move left">
            ←
          </button>
          <button className="key-btn" onClick={() => setDirection("right")} aria-label="Move right">
            →
          </button>
        </div>
        <button className="key-btn" onClick={() => setDirection("down")} aria-label="Move down">
          ↓
        </button>
      </div>
        </>
      )}
    </GameLayout>
  );
}

export default PacmanGame;
