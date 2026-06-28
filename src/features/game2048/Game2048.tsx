import { useState, useEffect, useCallback, useRef } from "react";
import GameLayout from "../../components/GameLayout";
import "./game2048.css";

const SIZE = 4;
const BEST_KEY = "g2048_best";

type Dir = "up" | "down" | "left" | "right";

type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  merged: boolean;
};

type Board = (Tile | null)[][];

type MoveResult = {
  board: Board;
  changed: boolean;
  gained: number;
  won: boolean;
};

let idCounter = 1;
const nextId = () => idCounter++;

const emptyBoard = (): Board =>
  Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null));

const cloneBoard = (board: Board): Board =>
  board.map((row) =>
    row.map((tile) => (tile ? { ...tile } : null)),
  );

const emptyCells = (board: Board): [number, number][] => {
  const cells: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!board[r][c]) cells.push([r, c]);
    }
  }
  return cells;
};

const spawnTile = (board: Board): Board => {
  const cells = emptyCells(board);
  if (cells.length === 0) return board;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  const next = cloneBoard(board);
  next[r][c] = {
    id: nextId(),
    value: Math.random() < 0.9 ? 2 : 4,
    row: r,
    col: c,
    isNew: true,
    merged: false,
  };
  return next;
};

const startBoard = (): Board => {
  let board = emptyBoard();
  board = spawnTile(board);
  board = spawnTile(board);
  return board;
};

// Extract a line (array of tiles, leading toward the "start" of the move dir)
const getLine = (board: Board, index: number, dir: Dir): (Tile | null)[] => {
  const line: (Tile | null)[] = [];
  for (let i = 0; i < SIZE; i++) {
    if (dir === "left") line.push(board[index][i]);
    else if (dir === "right") line.push(board[index][SIZE - 1 - i]);
    else if (dir === "up") line.push(board[i][index]);
    else line.push(board[SIZE - 1 - i][index]);
  }
  return line;
};

const setLine = (board: Board, index: number, dir: Dir, line: (Tile | null)[]) => {
  for (let i = 0; i < SIZE; i++) {
    let r: number;
    let c: number;
    if (dir === "left") {
      r = index;
      c = i;
    } else if (dir === "right") {
      r = index;
      c = SIZE - 1 - i;
    } else if (dir === "up") {
      r = i;
      c = index;
    } else {
      r = SIZE - 1 - i;
      c = index;
    }
    const tile = line[i];
    if (tile) {
      tile.row = r;
      tile.col = c;
    }
    board[r][c] = tile;
  }
};

const move = (board: Board, dir: Dir): MoveResult => {
  const next = cloneBoard(board);
  // reset transient flags
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = next[r][c];
      if (t) {
        t.isNew = false;
        t.merged = false;
      }
    }
  }

  let changed = false;
  let gained = 0;
  let won = false;

  for (let index = 0; index < SIZE; index++) {
    const line = getLine(next, index, dir);
    const tiles = line.filter((t): t is Tile => t !== null);
    const result: (Tile | null)[] = [];

    for (let i = 0; i < tiles.length; i++) {
      const current = tiles[i];
      const upcoming = tiles[i + 1];
      if (upcoming && current.value === upcoming.value) {
        const mergedValue = current.value * 2;
        gained += mergedValue;
        if (mergedValue === 2048) won = true;
        result.push({
          ...current,
          value: mergedValue,
          merged: true,
          isNew: false,
        });
        i++; // skip the next tile, it merged
      } else {
        result.push({ ...current, merged: false });
      }
    }

    while (result.length < SIZE) result.push(null);

    // detect change before committing
    for (let i = 0; i < SIZE; i++) {
      const before = line[i];
      const after = result[i];
      if ((before?.id ?? null) !== (after?.id ?? null) || before?.value !== after?.value) {
        changed = true;
      }
    }

    setLine(next, index, dir, result);
  }

  return { board: next, changed, gained, won };
};

const canMove = (board: Board): boolean => {
  if (emptyCells(board).length > 0) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = board[r][c]?.value;
      if (v === board[r][c + 1]?.value) return true;
      if (v === board[r + 1]?.[c]?.value) return true;
    }
  }
  return false;
};

const flatTiles = (board: Board): Tile[] => {
  const tiles: Tile[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = board[r][c];
      if (t) tiles.push(t);
    }
  }
  return tiles;
};

type Snapshot = { board: Board; score: number };

function Game2048() {
  const [board, setBoard] = useState<Board>(() => startBoard());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => {
    const saved = localStorage.getItem(BEST_KEY);
    return saved ? Number(saved) || 0 : 0;
  });
  const [status, setStatus] = useState<"playing" | "won" | "over">("playing");
  const [keepGoing, setKeepGoing] = useState(false);
  const historyRef = useRef<Snapshot | null>(null);

  useEffect(() => {
    if (score > best) {
      setBest(score);
      localStorage.setItem(BEST_KEY, String(score));
    }
  }, [score, best]);

  const newGame = useCallback(() => {
    historyRef.current = null;
    setBoard(startBoard());
    setScore(0);
    setStatus("playing");
    setKeepGoing(false);
  }, []);

  const handleMove = useCallback(
    (dir: Dir) => {
      setBoard((prev) => {
        if (status === "over") return prev;
        const result = move(prev, dir);
        if (!result.changed) return prev;

        historyRef.current = { board: cloneBoard(prev), score };

        const spawned = spawnTile(result.board);
        setScore((s) => s + result.gained);

        if (result.won && !keepGoing) {
          setStatus("won");
        } else if (!canMove(spawned)) {
          setStatus("over");
        }
        return spawned;
      });
    },
    [status, score, keepGoing],
  );

  const undo = useCallback(() => {
    const snap = historyRef.current;
    if (!snap) return;
    setBoard(snap.board);
    setScore(snap.score);
    setStatus("playing");
    historyRef.current = null;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleMove]);

  // Touch / pointer swipe
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 24;
    if (Math.max(absX, absY) < threshold) return;
    if (absX > absY) handleMove(dx > 0 ? "right" : "left");
    else handleMove(dy > 0 ? "down" : "up");
  };

  const tiles = flatTiles(board);
  const cells = Array.from({ length: SIZE * SIZE });

  const overlay =
    status === "won" ? (
      <div className="g2048-overlay" role="alertdialog" aria-label="You won">
        <div className="g2048-overlay-card">
          <div className="g2048-overlay-emoji">🎉</div>
          <h3>You made 2048!</h3>
          <p>Score {score}</p>
          <div className="g2048-overlay-actions">
            <button
              className="btn"
              onClick={() => {
                setKeepGoing(true);
                setStatus("playing");
              }}
            >
              Keep Going
            </button>
            <button className="btn btn-secondary" onClick={newGame}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    ) : status === "over" ? (
      <div className="g2048-overlay" role="alertdialog" aria-label="Game over">
        <div className="g2048-overlay-card">
          <div className="g2048-overlay-emoji">💥</div>
          <h3>Game Over</h3>
          <p>Score {score}</p>
          <div className="g2048-overlay-actions">
            <button className="btn" onClick={newGame}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <GameLayout
      title="2048"
      subtitle="Slide and merge tiles to reach 2048."
      stats={
        <>
          <span className="chip">Score: {score}</span>
          <span className="chip">Best: {best}</span>
        </>
      }
      actions={
        <>
          <button className="btn" onClick={newGame}>
            New Game
          </button>
          <button
            className="btn btn-secondary"
            onClick={undo}
            disabled={!historyRef.current}
          >
            Undo
          </button>
        </>
      }
    >
      <div className="g2048-wrap">
        <div
          className="g2048-board"
          role="grid"
          aria-label="2048 board, use arrow keys or swipe to move tiles"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <div className="g2048-grid">
            {cells.map((_, i) => (
              <div key={i} className="g2048-cell" />
            ))}
          </div>
          <div className="g2048-tiles">
            {tiles.map((tile) => (
              <div
                key={tile.id}
                className={`g2048-tile g2048-v${tile.value > 2048 ? "super" : tile.value}${
                  tile.isNew ? " g2048-pop" : ""
                }${tile.merged ? " g2048-bounce" : ""}`}
                style={
                  {
                    "--col": tile.col,
                    "--row": tile.row,
                  } as React.CSSProperties
                }
              >
                <span className="g2048-tile-inner">{tile.value}</span>
              </div>
            ))}
          </div>
          {overlay}
        </div>

        <div className="g2048-controls" aria-hidden="true">
          <button className="g2048-arrow g2048-arrow-up" onClick={() => handleMove("up")}>
            ▲
          </button>
          <button
            className="g2048-arrow g2048-arrow-left"
            onClick={() => handleMove("left")}
          >
            ◀
          </button>
          <button
            className="g2048-arrow g2048-arrow-right"
            onClick={() => handleMove("right")}
          >
            ▶
          </button>
          <button
            className="g2048-arrow g2048-arrow-down"
            onClick={() => handleMove("down")}
          >
            ▼
          </button>
        </div>
        <p className="g2048-hint">Swipe, use arrow keys / WASD, or the buttons.</p>
      </div>
    </GameLayout>
  );
}

export default Game2048;
