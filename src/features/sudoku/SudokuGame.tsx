import { useCallback, useEffect, useMemo, useState } from "react";
import GameLayout from "../../components/GameLayout";
import DifficultySlider from "../../components/DifficultySlider";
import "./sudoku.css";

type Difficulty = "Easy" | "Medium" | "Hard";
type Phase = "idle" | "playing";
type Cell = number; // 0 = empty

const SIZE = 9;
const MAX_MISTAKES = 3;

const REMOVE_COUNT: Record<Difficulty, number> = {
  Easy: 38,
  Medium: 48,
  Hard: 54,
};

const cloneGrid = (grid: Cell[][]): Cell[][] => grid.map((row) => row.slice());

const emptyGrid = (): Cell[][] =>
  Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(0));

const shuffle = <T,>(arr: T[]): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const canPlace = (grid: Cell[][], row: number, col: number, val: number): boolean => {
  for (let i = 0; i < SIZE; i += 1) {
    if (grid[row][i] === val) return false;
    if (grid[i][col] === val) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (grid[br + r][bc + c] === val) return false;
    }
  }
  return true;
};

const fillGrid = (grid: Cell[][]): boolean => {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (grid[row][col] === 0) {
        for (const val of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (canPlace(grid, row, col, val)) {
            grid[row][col] = val;
            if (fillGrid(grid)) return true;
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const generateSolved = (): Cell[][] => {
  const grid = emptyGrid();
  fillGrid(grid);
  return grid;
};

type Puzzle = {
  puzzle: Cell[][];
  solution: Cell[][];
  given: boolean[][];
};

const generatePuzzle = (difficulty: Difficulty): Puzzle => {
  const solution = generateSolved();
  const puzzle = cloneGrid(solution);
  const positions = shuffle(
    Array.from({ length: SIZE * SIZE }, (_, i) => i),
  );
  let removed = 0;
  const target = REMOVE_COUNT[difficulty];
  for (const pos of positions) {
    if (removed >= target) break;
    const r = Math.floor(pos / SIZE);
    const c = pos % SIZE;
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removed += 1;
    }
  }
  const given = puzzle.map((row) => row.map((v) => v !== 0));
  return { puzzle, solution, given };
};

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

function SudokuGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty>("Easy");
  const [phase, setPhase] = useState<Phase>("idle");
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(true);

  const [board, setBoard] = useState<Cell[][]>(emptyGrid);
  const [solution, setSolution] = useState<Cell[][]>(emptyGrid);
  const [given, setGiven] = useState<boolean[][]>(() =>
    emptyGrid().map((row) => row.map(() => false)),
  );

  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [mistakes, setMistakes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);

  const isWin = useMemo(() => {
    if (phase !== "playing") return false;
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        if (board[r][c] === 0 || board[r][c] !== solution[r][c]) return false;
      }
    }
    return true;
  }, [board, solution, phase]);

  const isGameOver = mistakes >= MAX_MISTAKES;
  const isDone = isWin || isGameOver;

  // Conflicts: cells whose value violates row/col/box uniqueness.
  const conflicts = useMemo(() => {
    const set = new Set<string>();
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        const val = board[r][c];
        if (val === 0) continue;
        let bad = false;
        for (let i = 0; i < SIZE && !bad; i += 1) {
          if (i !== c && board[r][i] === val) bad = true;
          if (i !== r && board[i][c] === val) bad = true;
        }
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let dr = 0; dr < 3 && !bad; dr += 1) {
          for (let dc = 0; dc < 3 && !bad; dc += 1) {
            const rr = br + dr;
            const cc = bc + dc;
            if ((rr !== r || cc !== c) && board[rr][cc] === val) bad = true;
          }
        }
        if (bad) set.add(`${r}:${c}`);
      }
    }
    return set;
  }, [board]);

  // Timer
  useEffect(() => {
    if (phase !== "playing" || isDone) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase, isDone]);

  const startGame = useCallback((diff: Difficulty) => {
    const { puzzle, solution: sol, given: giv } = generatePuzzle(diff);
    setBoard(puzzle);
    setSolution(sol);
    setGiven(giv);
    setDifficulty(diff);
    setSelected(null);
    setMistakes(0);
    setSeconds(0);
    setPhase("playing");
  }, []);

  const placeValue = useCallback(
    (val: number) => {
      if (isDone || !selected) return;
      const { row, col } = selected;
      if (given[row][col]) return;
      setBoard((prev) => {
        if (prev[row][col] === val) return prev;
        const next = cloneGrid(prev);
        next[row][col] = val;
        return next;
      });
      if (val !== 0 && solution[row][col] !== 0 && val !== solution[row][col]) {
        setMistakes((m) => Math.min(MAX_MISTAKES, m + 1));
      }
    },
    [isDone, selected, given, solution],
  );

  // Keyboard input
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.key >= "1" && e.key <= "9") {
        placeValue(Number(e.key));
      } else if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        placeValue(0);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        setSelected((cur) => {
          if (!cur) return cur;
          let { row, col } = cur;
          if (e.key === "ArrowUp") row = Math.max(0, row - 1);
          if (e.key === "ArrowDown") row = Math.min(SIZE - 1, row + 1);
          if (e.key === "ArrowLeft") col = Math.max(0, col - 1);
          if (e.key === "ArrowRight") col = Math.min(SIZE - 1, col + 1);
          return { row, col };
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, selected, placeValue]);

  const selectedValue =
    selected && board[selected.row][selected.col] !== 0
      ? board[selected.row][selected.col]
      : 0;

  const digitCounts = useMemo(() => {
    const counts = new Array<number>(10).fill(0);
    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        counts[board[r][c]] += 1;
      }
    }
    return counts;
  }, [board]);

  const isPeer = (r: number, c: number): boolean => {
    if (!selected) return false;
    if (r === selected.row && c === selected.col) return false;
    if (r === selected.row || c === selected.col) return true;
    return (
      Math.floor(r / 3) === Math.floor(selected.row / 3) &&
      Math.floor(c / 3) === Math.floor(selected.col / 3)
    );
  };

  const openSetup = () => {
    setPendingDifficulty(difficulty);
    setIsSetupOpen(true);
  };

  const newGame = () => startGame(difficulty);

  return (
    <GameLayout
      title="Sudoku"
      subtitle="Fill the grid so every row, column and box holds 1–9."
      stats={
        <>
          <span className="chip">{difficulty}</span>
          <span className="chip">Mistakes: {mistakes}/{MAX_MISTAKES}</span>
          <span className="chip">Time: {formatTime(seconds)}</span>
        </>
      }
      actions={
        phase === "idle" ? null : (
          <>
            <button className="btn" onClick={newGame}>
              New Game
            </button>
            <button className="btn btn-secondary" onClick={openSetup}>
              Setup
            </button>
          </>
        )
      }
    >
      {/* Setup modal */}
      {isSetupOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (phase !== "idle") setIsSetupOpen(false);
          }}
          role="presentation"
        >
          <section className="setup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="setup-modal-head">
              <h3>Game Setup</h3>
              {phase !== "idle" && (
                <button
                  className="close-btn"
                  onClick={() => setIsSetupOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="setup-tab-content">
              <div className="setup-tab-pane">
                <p className="setup-hint">Pick a difficulty, then start the game.</p>
                <DifficultySlider
                  options={["Easy", "Medium", "Hard"]}
                  value={pendingDifficulty}
                  onChange={(v) => setPendingDifficulty(v as Difficulty)}
                />
              </div>
            </div>
            <div className="setup-modal-footer">
              <button
                className="btn btn-block"
                onClick={() => {
                  startGame(pendingDifficulty);
                  setIsSetupOpen(false);
                }}
              >
                {phase === "idle" ? "Start Game" : "Restart with Settings"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* Idle screen */}
      {phase === "idle" ? (
        <section className="game-idle-view">
          <div className="hero-icon">🔢</div>
          <h3>Ready to play Sudoku?</h3>
          <p>
            Fill every row, column and 3×3 box with the digits 1–9. Tap a cell, then
            choose a number. Three mistakes and it's game over.
          </p>
          <button className="btn btn-lg" onClick={() => setIsSetupOpen(true)}>
            Configure &amp; Play
          </button>
        </section>
      ) : (
        <div className="sdk-play">
          <p className="status" role="status">
            {isWin && "Solved! Brilliant work."}
            {isGameOver && "Too many mistakes. Game over."}
            {!isDone && "Select a cell and fill in a number."}
          </p>

          <div className={`sdk-stage${isWin ? " sdk-win" : ""}`}>
            <div
              className={`sdk-grid${isGameOver ? " sdk-locked" : ""}`}
              role="grid"
              aria-label="Sudoku board"
            >
              {board.map((row, r) =>
                row.map((val, c) => {
                  const key = `${r}:${c}`;
                  const isSelected =
                    selected?.row === r && selected?.col === c;
                  const peer = isPeer(r, c);
                  const isGiven = given[r][c];
                  const conflict = conflicts.has(key);
                  const match =
                    selectedValue !== 0 && val === selectedValue && !isSelected;
                  const classes = [
                    "sdk-cell",
                    isGiven ? "sdk-given" : "sdk-user",
                    isSelected ? "sdk-selected" : "",
                    peer ? "sdk-peer" : "",
                    conflict ? "sdk-conflict" : "",
                    match ? "sdk-match" : "",
                    c % 3 === 2 && c !== 8 ? "sdk-bx" : "",
                    r % 3 === 2 && r !== 8 ? "sdk-by" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <button
                      key={key}
                      type="button"
                      className={classes}
                      role="gridcell"
                      aria-label={`Row ${r + 1} column ${c + 1}${
                        val ? `, value ${val}` : ", empty"
                      }`}
                      onClick={() => setSelected({ row: r, col: c })}
                      disabled={isDone}
                    >
                      {val !== 0 ? val : ""}
                    </button>
                  );
                }),
              )}
            </div>
          </div>

          <div className="sdk-pad" aria-label="Number pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                className="sdk-key"
                onClick={() => placeValue(n)}
                disabled={isDone || digitCounts[n] >= SIZE}
                aria-label={`Enter ${n}`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className="sdk-key sdk-erase"
              onClick={() => placeValue(0)}
              disabled={isDone}
              aria-label="Erase cell"
            >
              ⌫
            </button>
          </div>
        </div>
      )}
    </GameLayout>
  );
}

export default SudokuGame;
