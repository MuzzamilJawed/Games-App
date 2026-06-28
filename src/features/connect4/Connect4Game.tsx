import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameLayout from "../../components/GameLayout";
import "./connect4.css";

const COLS = 7;
const ROWS = 6;

type Cell = 0 | 1 | 2; // 0 empty, 1 red, 2 yellow
type Board = Cell[][]; // [row][col], row 0 = top
type Mode = "vs AI" | "2 Players";
type Player = 1 | 2;

type Score = { red: number; yellow: number };

const emptyBoard = (): Board =>
  Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 0 as Cell));

const cloneBoard = (b: Board): Board => b.map((row) => [...row]);

// lowest empty row in a column, or -1 if full
const dropRow = (b: Board, col: number): number => {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (b[r][col] === 0) return r;
  }
  return -1;
};

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
];

type WinResult = { player: Player; cells: Array<[number, number]> } | null;

const findWin = (b: Board): WinResult => {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = b[r][c];
      if (p === 0) continue;
      for (const [dr, dc] of DIRECTIONS) {
        const cells: Array<[number, number]> = [[r, c]];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || b[nr][nc] !== p) break;
          cells.push([nr, nc]);
        }
        if (cells.length === 4) return { player: p as Player, cells };
      }
    }
  }
  return null;
};

const isFull = (b: Board): boolean => b[0].every((c) => c !== 0);

const validColumns = (b: Board): number[] => {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) if (b[0][c] === 0) cols.push(c);
  return cols;
};

// ---- AI: shallow minimax with alpha-beta ----
const otherPlayer = (p: Player): Player => (p === 1 ? 2 : 1);
const CENTER_WEIGHTS = [3, 4, 5, 7, 5, 4, 3];

const scoreWindow = (cells: Cell[], me: Player): number => {
  const opp = otherPlayer(me);
  let mine = 0;
  let theirs = 0;
  let empty = 0;
  for (const c of cells) {
    if (c === me) mine++;
    else if (c === opp) theirs++;
    else empty++;
  }
  if (mine > 0 && theirs > 0) return 0;
  if (mine === 4) return 100000;
  if (theirs === 4) return -100000;
  if (mine === 3 && empty === 1) return 50;
  if (mine === 2 && empty === 2) return 10;
  if (theirs === 3 && empty === 1) return -80;
  if (theirs === 2 && empty === 2) return -8;
  return 0;
};

const evaluate = (b: Board, me: Player): number => {
  let total = 0;
  // center bias
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (b[r][c] === me) total += CENTER_WEIGHTS[c];
      else if (b[r][c] === otherPlayer(me)) total -= CENTER_WEIGHTS[c];
    }
  }
  // all 4-windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of DIRECTIONS) {
        const er = r + dr * 3;
        const ec = c + dc * 3;
        if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
        const cells: Cell[] = [];
        for (let k = 0; k < 4; k++) cells.push(b[r + dr * k][c + dc * k]);
        total += scoreWindow(cells, me);
      }
    }
  }
  return total;
};

const minimax = (
  b: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  me: Player
): { score: number; col: number } => {
  const win = findWin(b);
  if (win) {
    const s = win.player === me ? 1000000 + depth : -1000000 - depth;
    return { score: s, col: -1 };
  }
  const moves = validColumns(b);
  if (depth === 0 || moves.length === 0) {
    return { score: evaluate(b, me), col: -1 };
  }
  // order moves center-first
  const ordered = [...moves].sort(
    (a, c) => Math.abs(3 - a) - Math.abs(3 - c)
  );
  const turn: Player = maximizing ? me : otherPlayer(me);
  let bestCol = ordered[0];

  if (maximizing) {
    let best = -Infinity;
    for (const col of ordered) {
      const r = dropRow(b, col);
      b[r][col] = turn;
      const { score } = minimax(b, depth - 1, alpha, beta, false, me);
      b[r][col] = 0;
      if (score > best) {
        best = score;
        bestCol = col;
      }
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return { score: best, col: bestCol };
  }
  let best = Infinity;
  for (const col of ordered) {
    const r = dropRow(b, col);
    b[r][col] = turn;
    const { score } = minimax(b, depth - 1, alpha, beta, true, me);
    b[r][col] = 0;
    if (score < best) {
      best = score;
      bestCol = col;
    }
    beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return { score: best, col: bestCol };
};

const chooseAiColumn = (b: Board, me: Player): number => {
  const moves = validColumns(b);
  if (moves.length === 0) return -1;
  const { col } = minimax(cloneBoard(b), 4, -Infinity, Infinity, true, me);
  return col >= 0 ? col : moves[Math.floor(Math.random() * moves.length)];
};

const DISC_COLOR: Record<Player, string> = { 1: "Red", 2: "Yellow" };

function Connect4Game() {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [current, setCurrent] = useState<Player>(1);
  const [mode, setMode] = useState<Mode>("vs AI");
  const [score, setScore] = useState<Score>({ red: 0, yellow: 0 });
  const [win, setWin] = useState<WinResult>(null);
  const [draw, setDraw] = useState<boolean>(false);
  const [hoverCol, setHoverCol] = useState<number>(-1);
  const [lastDrop, setLastDrop] = useState<{ row: number; col: number } | null>(null);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  const scoredRef = useRef<boolean>(false);

  const winSet = useMemo(() => {
    const s = new Set<string>();
    if (win) for (const [r, c] of win.cells) s.add(`${r}-${c}`);
    return s;
  }, [win]);

  const gameOver = win !== null || draw;
  // In vs AI mode, AI is player 2 (Yellow). Human cannot click on AI's turn.
  const humanTurn = mode === "2 Players" || current === 1;

  const settle = useCallback((nextBoard: Board) => {
    const w = findWin(nextBoard);
    if (w) {
      setWin(w);
      if (!scoredRef.current) {
        scoredRef.current = true;
        setScore((s) =>
          w.player === 1 ? { ...s, red: s.red + 1 } : { ...s, yellow: s.yellow + 1 }
        );
      }
      return true;
    }
    if (isFull(nextBoard)) {
      setDraw(true);
      return true;
    }
    return false;
  }, []);

  const drop = useCallback(
    (col: number, player: Player): boolean => {
      if (gameOver) return false;
      const r = dropRow(board, col);
      if (r < 0) return false;
      const next = cloneBoard(board);
      next[r][col] = player;
      setBoard(next);
      setLastDrop({ row: r, col });
      const ended = settle(next);
      if (!ended) setCurrent(otherPlayer(player));
      return true;
    },
    [board, gameOver, settle]
  );

  const handleColumn = (col: number) => {
    if (!humanTurn || aiThinking || gameOver) return;
    drop(col, current);
  };

  // AI move
  useEffect(() => {
    if (mode !== "vs AI" || current !== 2 || gameOver) return;
    setAiThinking(true);
    const t = window.setTimeout(() => {
      setAiThinking(false);
      const col = chooseAiColumn(board, 2);
      if (col >= 0) drop(col, 2);
    }, 420);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, mode, gameOver, board]);

  const newRound = () => {
    setBoard(emptyBoard());
    setCurrent(1);
    setWin(null);
    setDraw(false);
    setLastDrop(null);
    setAiThinking(false);
    scoredRef.current = false;
  };

  const toggleMode = () => {
    setMode((m) => (m === "vs AI" ? "2 Players" : "vs AI"));
    setBoard(emptyBoard());
    setCurrent(1);
    setWin(null);
    setDraw(false);
    setLastDrop(null);
    setAiThinking(false);
    scoredRef.current = false;
  };

  const resetScore = () => setScore({ red: 0, yellow: 0 });

  const previewRow = hoverCol >= 0 ? dropRow(board, hoverCol) : -1;

  const statusText = (() => {
    if (win) {
      if (mode === "vs AI") return win.player === 1 ? "You win! 🎉" : "AI wins!";
      return `${DISC_COLOR[win.player]} wins! 🎉`;
    }
    if (draw) return "It's a draw!";
    if (mode === "vs AI" && current === 2) return aiThinking ? "AI is thinking…" : "AI's turn";
    if (mode === "vs AI") return "Your turn";
    return `${DISC_COLOR[current]}'s turn`;
  })();

  return (
    <GameLayout
      title="Connect Four"
      subtitle="Drop discs and line up four in a row."
      stats={
        <>
          <span className="chip">🔴 {score.red}</span>
          <span className="chip">🟡 {score.yellow}</span>
          <span className="chip">{mode}</span>
        </>
      }
      actions={
        <>
          <button className="btn" onClick={newRound}>
            New Round
          </button>
          <button className="btn btn-secondary" onClick={toggleMode}>
            {mode === "vs AI" ? "2 Players" : "vs AI"}
          </button>
          <button className="btn btn-secondary" onClick={resetScore}>
            Reset Score
          </button>
        </>
      }
    >
      <div className="c4-wrap">
        <div
          className={`c4-status${gameOver ? " c4-status-over" : ""}`}
          role="status"
          aria-live="polite"
        >
          <span
            className={`c4-turn-dot c4-disc-${
              win ? win.player : draw ? "draw" : current
            }`}
            aria-hidden="true"
          />
          <span>{statusText}</span>
        </div>

        <div className="c4-board-area">
          {/* drop arrows */}
          <div className="c4-arrows" role="group" aria-label="Drop disc">
            {Array.from({ length: COLS }, (_, c) => {
              const playable = humanTurn && !aiThinking && !gameOver && board[0][c] === 0;
              return (
                <button
                  key={c}
                  className={`c4-arrow${hoverCol === c ? " c4-arrow-active" : ""}`}
                  onClick={() => handleColumn(c)}
                  onMouseEnter={() => setHoverCol(c)}
                  onMouseLeave={() => setHoverCol(-1)}
                  disabled={!playable}
                  aria-label={`Drop in column ${c + 1}`}
                >
                  ▼
                </button>
              );
            })}
          </div>

          <div
            className="c4-board"
            role="grid"
            aria-label="Connect Four board"
            onMouseLeave={() => setHoverCol(-1)}
          >
            {Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const v = board[r][c];
                const key = `${r}-${c}`;
                const isWinCell = winSet.has(key);
                const isLast =
                  lastDrop && lastDrop.row === r && lastDrop.col === c;
                const showPreview =
                  hoverCol === c &&
                  previewRow === r &&
                  v === 0 &&
                  humanTurn &&
                  !aiThinking &&
                  !gameOver;
                return (
                  <button
                    key={key}
                    className={`c4-cell${hoverCol === c ? " c4-col-hover" : ""}`}
                    role="gridcell"
                    aria-label={`Row ${r + 1}, column ${c + 1}: ${
                      v === 0 ? "empty" : DISC_COLOR[v as Player]
                    }`}
                    onClick={() => handleColumn(c)}
                    onMouseEnter={() => setHoverCol(c)}
                  >
                    <span className="c4-hole">
                      {v !== 0 ? (
                        <span
                          className={`c4-disc c4-disc-${v}${
                            isWinCell ? " c4-disc-win" : ""
                          }${isLast ? " c4-disc-drop" : ""}`}
                        />
                      ) : showPreview ? (
                        <span className={`c4-disc c4-disc-${current} c4-disc-preview`} />
                      ) : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </GameLayout>
  );
}

export default Connect4Game;
