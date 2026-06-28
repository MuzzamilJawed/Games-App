import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameLayout from "../../components/GameLayout";
import DifficultySlider from "../../components/DifficultySlider";
import "./minesweeper.css";

type Difficulty = "easy" | "medium" | "hard";
type Phase = "idle" | "playing" | "won" | "lost";

type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
  exploded: boolean;
};

type Config = {
  rows: number;
  cols: number;
  mines: number;
  label: string;
};

const DIFFICULTIES: Record<Difficulty, Config> = {
  easy: { rows: 9, cols: 9, mines: 10, label: "Easy" },
  medium: { rows: 12, cols: 12, mines: 24, label: "Medium" },
  // Capped columns so the board still fits small screens with no scroll.
  hard: { rows: 16, cols: 14, mines: 44, label: "Hard" },
};

const makeEmptyBoard = (rows: number, cols: number): Cell[][] =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
      exploded: false,
    }))
  );

const NEIGHBORS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const inBounds = (board: Cell[][], r: number, c: number): boolean =>
  r >= 0 && r < board.length && c >= 0 && c < board[0].length;

function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [phase, setPhase] = useState<Phase>("idle");
  const [setupOpen, setSetupOpen] = useState<boolean>(false);
  const [board, setBoard] = useState<Cell[][]>(() => makeEmptyBoard(9, 9));
  const [flagMode, setFlagMode] = useState<boolean>(false);
  const [seeded, setSeeded] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  const [flags, setFlags] = useState<number>(0);

  const config = DIFFICULTIES[difficulty];
  const timerRef = useRef<number | null>(null);
  const longPressRef = useRef<number | null>(null);
  const longPressFired = useRef<boolean>(false);

  const minesLeft = Math.max(0, config.mines - flags);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Timer runs only while actively playing and at least one cell revealed.
  useEffect(() => {
    if (phase === "playing" && seeded) {
      if (timerRef.current === null) {
        timerRef.current = window.setInterval(() => setTime((t) => t + 1), 1000);
      }
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [phase, seeded, stopTimer]);

  const resetBoard = useCallback((diff: Difficulty) => {
    const cfg = DIFFICULTIES[diff];
    setBoard(makeEmptyBoard(cfg.rows, cfg.cols));
    setSeeded(false);
    setFlags(0);
    setTime(0);
    setFlagMode(false);
  }, []);

  const newGame = useCallback(() => {
    resetBoard(difficulty);
    setPhase("playing");
  }, [difficulty, resetBoard]);

  const startWithDifficulty = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      resetBoard(diff);
      setPhase("playing");
      setSetupOpen(false);
    },
    [resetBoard]
  );

  const openSetup = useCallback(() => setSetupOpen(true), []);

  // Place mines after the first click; keep the first cell + its neighbors safe.
  const placeMines = (base: Cell[][], safeR: number, safeC: number, mines: number): Cell[][] => {
    const rows = base.length;
    const cols = base[0].length;
    const next = base.map((row) => row.map((cell) => ({ ...cell })));

    const forbidden = new Set<string>();
    forbidden.add(`${safeR},${safeC}`);
    for (const [dr, dc] of NEIGHBORS) {
      const nr = safeR + dr;
      const nc = safeC + dc;
      if (inBounds(next, nr, nc)) forbidden.add(`${nr},${nc}`);
    }

    const available: Array<[number, number]> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!forbidden.has(`${r},${c}`)) available.push([r, c]);
      }
    }

    const total = Math.min(mines, available.length);
    for (let i = 0; i < total; i++) {
      const idx = i + Math.floor(Math.random() * (available.length - i));
      const tmp = available[i];
      available[i] = available[idx];
      available[idx] = tmp;
      const [mr, mc] = available[i];
      next[mr][mc].mine = true;
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (next[r][c].mine) continue;
        let count = 0;
        for (const [dr, dc] of NEIGHBORS) {
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(next, nr, nc) && next[nr][nc].mine) count++;
        }
        next[r][c].adjacent = count;
      }
    }
    return next;
  };

  const floodReveal = (base: Cell[][], r: number, c: number): void => {
    const stack: Array<[number, number]> = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop() as [number, number];
      const cell = base[cr][cc];
      if (cell.revealed || cell.flagged || cell.mine) continue;
      cell.revealed = true;
      if (cell.adjacent === 0) {
        for (const [dr, dc] of NEIGHBORS) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (inBounds(base, nr, nc) && !base[nr][nc].revealed) stack.push([nr, nc]);
        }
      }
    }
  };

  const checkWin = (base: Cell[][]): boolean => {
    for (const row of base) {
      for (const cell of row) {
        if (!cell.mine && !cell.revealed) return false;
      }
    }
    return true;
  };

  const revealAllMines = (base: Cell[][], explodedR: number, explodedC: number): void => {
    for (let r = 0; r < base.length; r++) {
      for (let c = 0; c < base[0].length; c++) {
        if (base[r][c].mine) base[r][c].revealed = true;
      }
    }
    base[explodedR][explodedC].exploded = true;
  };

  const revealCell = useCallback(
    (r: number, c: number) => {
      if (phase !== "playing") return;
      setBoard((prev) => {
        let working = prev;
        let didSeed = seeded;

        if (!didSeed) {
          working = placeMines(prev, r, c, config.mines);
          didSeed = true;
        } else {
          working = prev.map((row) => row.map((cell) => ({ ...cell })));
        }

        const target = working[r][c];
        if (target.revealed || target.flagged) return prev;

        if (target.mine) {
          revealAllMines(working, r, c);
          setPhase("lost");
          if (!seeded) setSeeded(true);
          return working;
        }

        floodReveal(working, r, c);

        if (!seeded && didSeed) setSeeded(true);

        if (checkWin(working)) {
          setPhase("won");
        }
        return working;
      });
    },
    [phase, seeded, config.mines]
  );

  const toggleFlag = useCallback(
    (r: number, c: number) => {
      if (phase !== "playing") return;
      setBoard((prev) => {
        const cell = prev[r][c];
        if (cell.revealed) return prev;
        const next = prev.map((row) => row.map((cl) => ({ ...cl })));
        const willFlag = !next[r][c].flagged;
        next[r][c].flagged = willFlag;
        setFlags((f) => f + (willFlag ? 1 : -1));
        return next;
      });
    },
    [phase]
  );

  const handleCellClick = (r: number, c: number) => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    if (flagMode) toggleFlag(r, c);
    else revealCell(r, c);
  };

  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    toggleFlag(r, c);
  };

  // Long-press to flag (touch convenience).
  const handlePointerDown = (r: number, c: number) => {
    longPressFired.current = false;
    if (longPressRef.current !== null) window.clearTimeout(longPressRef.current);
    longPressRef.current = window.setTimeout(() => {
      longPressFired.current = true;
      toggleFlag(r, c);
    }, 450);
  };

  const clearLongPress = () => {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  useEffect(() => () => {
    if (longPressRef.current !== null) window.clearTimeout(longPressRef.current);
  }, []);

  const boardStyle = useMemo(
    () => ({ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }),
    [config.cols]
  );

  const cellLabel = (cell: Cell, r: number, c: number): string => {
    const pos = `Row ${r + 1}, column ${c + 1}`;
    if (cell.flagged) return `${pos}, flagged`;
    if (!cell.revealed) return `${pos}, hidden`;
    if (cell.mine) return `${pos}, mine`;
    if (cell.adjacent > 0) return `${pos}, ${cell.adjacent} adjacent mines`;
    return `${pos}, empty`;
  };

  const renderBoard = () => (
    <div className="mine-board-wrap">
      <div
        className={`mine-board${phase === "lost" || phase === "won" ? " mine-board-over" : ""}`}
        style={boardStyle}
        role="grid"
        aria-label="Minesweeper board"
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const classes = ["mine-cell"];
            if (cell.revealed) {
              classes.push("mine-revealed");
              if (cell.mine) classes.push("mine-bomb");
              if (cell.exploded) classes.push("mine-exploded");
              if (cell.adjacent > 0 && !cell.mine) classes.push(`mine-n${cell.adjacent}`);
            }
            if (cell.flagged && !cell.revealed) classes.push("mine-flagged");
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                className={classes.join(" ")}
                role="gridcell"
                aria-label={cellLabel(cell, r, c)}
                disabled={phase === "won" || phase === "lost"}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleContextMenu(e, r, c)}
                onPointerDown={() => handlePointerDown(r, c)}
                onPointerUp={clearLongPress}
                onPointerLeave={clearLongPress}
                onPointerCancel={clearLongPress}
              >
                {cell.revealed ? (
                  cell.mine ? (
                    <span className="mine-glyph">💣</span>
                  ) : cell.adjacent > 0 ? (
                    <span className="mine-num">{cell.adjacent}</span>
                  ) : null
                ) : cell.flagged ? (
                  <span className="mine-glyph">🚩</span>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      {phase === "won" || phase === "lost" ? (
        <div className="mine-overlay" role="alert">
          <div className="mine-overlay-card">
            <div className="mine-overlay-icon">{phase === "won" ? "🏆" : "💥"}</div>
            <h3>{phase === "won" ? "You cleared it!" : "Boom!"}</h3>
            <p>
              {phase === "won"
                ? `Solved ${config.label} in ${time}s.`
                : "You hit a mine. Better luck next time."}
            </p>
            <button className="btn btn-lg" onClick={newGame}>
              Play Again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <GameLayout
      title="Minesweeper"
      subtitle="Clear the field without hitting a mine."
      stats={
        <>
          <span className="chip">Mines: {minesLeft}</span>
          <span className="chip">Time: {time}s</span>
          <span className="chip">{config.label}</span>
        </>
      }
      actions={
        phase === "idle" ? null : (
          <>
            <button className="btn" onClick={newGame}>
              New Game
            </button>
            <button
              className={`btn ${flagMode ? "" : "btn-secondary"}`}
              onClick={() => setFlagMode((f) => !f)}
              aria-pressed={flagMode}
              disabled={phase !== "playing"}
            >
              {flagMode ? "🚩 Flag: ON" : "🚩 Flag: OFF"}
            </button>
            <button className="btn btn-secondary" onClick={openSetup}>
              Setup
            </button>
          </>
        )
      }
    >
      {phase === "idle" ? (
        <div className="game-idle-view">
          <div className="hero-icon">💣</div>
          <h3>Ready to sweep?</h3>
          <p>Reveal every safe tile and flag the hidden mines. First tap is always safe.</p>
          <button className="btn btn-lg" onClick={() => setSetupOpen(true)}>
            Choose Difficulty
          </button>
        </div>
      ) : (
        renderBoard()
      )}

      {setupOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => setSetupOpen(false)}
          role="presentation"
        >
          <section className="setup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="setup-modal-head">
              <h3>Minesweeper Setup</h3>
              <button
                className="close-btn"
                onClick={() => setSetupOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="setup-tab-content" role="tabpanel">
              <div className="setup-tab-pane">
                <DifficultySlider
                  options={Object.keys(DIFFICULTIES) as Difficulty[]}
                  value={difficulty}
                  onChange={(v) => setDifficulty(v as Difficulty)}
                  labels={Object.fromEntries(
                    (Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => [d, DIFFICULTIES[d].label])
                  )}
                />

                <div className="mine-diff-grid">
                  {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`mine-diff-card${difficulty === d ? " mine-diff-active" : ""}`}
                      onClick={() => setDifficulty(d)}
                    >
                      <span className="mine-diff-name">{DIFFICULTIES[d].label}</span>
                      <span className="mine-diff-meta">
                        {DIFFICULTIES[d].rows}×{DIFFICULTIES[d].cols}
                      </span>
                      <span className="mine-diff-meta">{DIFFICULTIES[d].mines} 💣</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="setup-modal-footer">
              <button
                className="btn btn-block"
                onClick={() => startWithDifficulty(difficulty)}
              >
                Start Game
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </GameLayout>
  );
}

export default MinesweeperGame;
