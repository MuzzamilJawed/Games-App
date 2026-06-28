import { useCallback, useEffect, useMemo, useState } from "react";
import GameLayout from "../../components/GameLayout";
import DifficultySlider from "../../components/DifficultySlider";
import "./tictactoe.css";

type Player = "X" | "O";
type Cell = Player | null;
type Board = Cell[];
type Mode = "ai" | "duo";
type Difficulty = "easy" | "medium" | "hard";
type Score = { x: number; o: number; draws: number };

const EMPTY_BOARD: Board = Array(9).fill(null);

const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

type WinInfo = { winner: Player; line: number[] } | null;

const getWinner = (board: Board): WinInfo => {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line };
    }
  }
  return null;
};

const isFull = (board: Board): boolean => board.every((cell) => cell !== null);

const emptyIndices = (board: Board): number[] =>
  board.reduce<number[]>((acc, cell, idx) => (cell === null ? [...acc, idx] : acc), []);

// Minimax for the AI (always plays as the "ai" mark).
const minimax = (board: Board, aiMark: Player, current: Player): { score: number; index: number } => {
  const humanMark: Player = aiMark === "X" ? "O" : "X";
  const result = getWinner(board);
  if (result) return { score: result.winner === aiMark ? 10 : -10, index: -1 };
  if (isFull(board)) return { score: 0, index: -1 };

  const moves = emptyIndices(board).map((index) => {
    const next = board.slice();
    next[index] = current;
    const nextPlayer: Player = current === "X" ? "O" : "X";
    const deep = minimax(next, aiMark, nextPlayer);
    // Prefer faster wins / slower losses by nudging score toward 0 with depth.
    const adjusted = deep.score > 0 ? deep.score - 1 : deep.score < 0 ? deep.score + 1 : 0;
    return { score: adjusted, index };
  });

  if (current === aiMark) {
    return moves.reduce((best, m) => (m.score > best.score ? m : best), moves[0]);
  }
  void humanMark;
  return moves.reduce((best, m) => (m.score < best.score ? m : best), moves[0]);
};

// Heuristic: try to win, then block, else take center/corner/random.
const heuristicMove = (board: Board, aiMark: Player): number => {
  const humanMark: Player = aiMark === "X" ? "O" : "X";
  const available = emptyIndices(board);

  const tryComplete = (mark: Player): number => {
    for (const index of available) {
      const next = board.slice();
      next[index] = mark;
      if (getWinner(next)?.winner === mark) return index;
    }
    return -1;
  };

  const winNow = tryComplete(aiMark);
  if (winNow !== -1) return winNow;
  const blockNow = tryComplete(humanMark);
  if (blockNow !== -1) return blockNow;

  if (available.includes(4)) return 4;
  const corners = [0, 2, 6, 8].filter((c) => available.includes(c));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return available[Math.floor(Math.random() * available.length)];
};

const chooseAiMove = (board: Board, aiMark: Player, difficulty: Difficulty): number => {
  const available = emptyIndices(board);
  if (available.length === 0) return -1;
  if (difficulty === "easy") {
    return available[Math.floor(Math.random() * available.length)];
  }
  if (difficulty === "medium") {
    // Mostly smart, occasionally random for a beatable feel.
    if (Math.random() < 0.35) return available[Math.floor(Math.random() * available.length)];
    return heuristicMove(board, aiMark);
  }
  // Hard: unbeatable minimax.
  return minimax(board, aiMark, aiMark).index;
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard (Unbeatable)",
};

function TicTacToeGame() {
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [current, setCurrent] = useState<Player>("X");
  const [score, setScore] = useState<Score>({ x: 0, o: 0, draws: 0 });
  const [mode, setMode] = useState<Mode>("ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [aiMark, setAiMark] = useState<Player>("O");
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [roundCounted, setRoundCounted] = useState<boolean>(false);

  const win = useMemo(() => getWinner(board), [board]);
  const draw = useMemo(() => !win && isFull(board), [win, board]);
  const isOver = Boolean(win) || draw;
  const winningLine = win?.line ?? [];

  const resetBoard = useCallback((starter: Player = "X") => {
    setBoard(EMPTY_BOARD.slice());
    setCurrent(starter);
    setRoundCounted(false);
  }, []);

  const playMove = useCallback(
    (index: number) => {
      setBoard((prev) => {
        if (prev[index] !== null || getWinner(prev) || isFull(prev)) return prev;
        const next = prev.slice();
        next[index] = current;
        return next;
      });
    },
    [current],
  );

  const handleCellClick = (index: number) => {
    if (isOver || board[index] !== null) return;
    if (mode === "ai" && current === aiMark) return; // not the human's turn
    playMove(index);
    setCurrent((c) => (c === "X" ? "O" : "X"));
  };

  // Tally the score once when a round ends.
  useEffect(() => {
    if (!isOver || roundCounted) return;
    setRoundCounted(true);
    if (win) {
      setScore((s) => (win.winner === "X" ? { ...s, x: s.x + 1 } : { ...s, o: s.o + 1 }));
    } else if (draw) {
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
    }
  }, [isOver, roundCounted, win, draw]);

  // AI plays automatically when it's its turn.
  useEffect(() => {
    if (mode !== "ai" || isOver || current !== aiMark) return;
    const timer = window.setTimeout(() => {
      const index = chooseAiMove(board, aiMark, difficulty);
      if (index === -1) return;
      playMove(index);
      setCurrent((c) => (c === "X" ? "O" : "X"));
    }, 420);
    return () => window.clearTimeout(timer);
  }, [mode, isOver, current, aiMark, board, difficulty, playMove]);

  const newGame = () => {
    // Alternate who starts could be nice, but keep X-first for clarity.
    resetBoard("X");
  };

  const applySetup = () => {
    setScore({ x: 0, o: 0, draws: 0 });
    resetBoard("X");
    setIsSetupOpen(false);
  };

  const statusMessage = (): string => {
    if (win) {
      if (mode === "ai") {
        return win.winner === aiMark ? "AI wins this round." : "You win! Nicely played.";
      }
      return `Player ${win.winner} wins this round.`;
    }
    if (draw) return "It's a draw. Good game.";
    if (mode === "ai") {
      return current === aiMark ? "AI is thinking..." : "Your turn.";
    }
    return `Player ${current}'s turn.`;
  };

  const humanMark: Player = aiMark === "X" ? "O" : "X";

  return (
    <GameLayout
      title="Tic-Tac-Toe"
      subtitle="Get three in a row. Play a friend or the AI."
      stats={
        <>
          <span className="chip">X: {score.x}</span>
          <span className="chip">O: {score.o}</span>
          <span className="chip">Draws: {score.draws}</span>
        </>
      }
      actions={
        <>
          <button className="btn" onClick={newGame}>New Game</button>
          <button className="btn btn-secondary" onClick={() => setIsSetupOpen(true)}>Setup</button>
        </>
      }
    >
      <div className="ttt-wrap">
        <div className="ttt-topbar">
          <div className="ttt-mode-toggle" role="group" aria-label="Game mode">
            <button
              type="button"
              className={`ttt-seg ${mode === "ai" ? "is-active" : ""}`}
              aria-pressed={mode === "ai"}
              onClick={() => {
                setMode("ai");
                resetBoard("X");
              }}
            >
              vs AI
            </button>
            <button
              type="button"
              className={`ttt-seg ${mode === "duo" ? "is-active" : ""}`}
              aria-pressed={mode === "duo"}
              onClick={() => {
                setMode("duo");
                resetBoard("X");
              }}
            >
              2 Players
            </button>
          </div>

          <div
            className={`ttt-turn ${isOver ? "is-over" : ""}`}
            role="status"
            aria-live="polite"
          >
            {!isOver && (
              <span className={`ttt-turn-dot ttt-mark-${current.toLowerCase()}`} aria-hidden="true">
                {current}
              </span>
            )}
            <span className="ttt-turn-text">{statusMessage()}</span>
          </div>
        </div>

        <div className="ttt-board-area">
          <div
            className={`ttt-board ${isOver ? "is-over" : ""}`}
            role="grid"
            aria-label="Tic-Tac-Toe board"
          >
            {board.map((cell, index) => {
              const isWinCell = winningLine.includes(index);
              const playable =
                !isOver && cell === null && !(mode === "ai" && current === aiMark);
              return (
                <button
                  key={index}
                  type="button"
                  role="gridcell"
                  className={`ttt-cell ${isWinCell ? "is-win" : ""} ${playable ? "is-playable" : ""}`}
                  onClick={() => handleCellClick(index)}
                  disabled={cell !== null || isOver || (mode === "ai" && current === aiMark)}
                  aria-label={
                    cell
                      ? `Cell ${index + 1}, ${cell}`
                      : `Cell ${index + 1}, empty`
                  }
                >
                  {cell && (
                    <span className={`ttt-mark ttt-mark-${cell.toLowerCase()}`} aria-hidden="true">
                      {cell}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ttt-footinfo">
          {mode === "ai" ? (
            <span className="ttt-meta">
              You are <strong className={`ttt-mark-${humanMark.toLowerCase()}`}>{humanMark}</strong>
              {" • "}
              {DIFFICULTY_LABELS[difficulty]}
            </span>
          ) : (
            <span className="ttt-meta">Pass &amp; play with a friend</span>
          )}
        </div>
      </div>

      {isSetupOpen ? (
        <div className="modal-backdrop" onClick={() => setIsSetupOpen(false)} role="presentation">
          <section className="setup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="setup-modal-head">
              <h3>Game Setup</h3>
              <button className="close-btn" onClick={() => setIsSetupOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="setup-tab-content">
              <div className="setup-tab-pane">
                <p className="setup-hint">Choose your mode and difficulty. This also resets the score.</p>

                <div className="settings-row">
                  <label className="settings-label" htmlFor="ttt-mode">Mode</label>
                  <select
                    id="ttt-mode"
                    className="setting-select"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as Mode)}
                  >
                    <option value="ai">vs AI</option>
                    <option value="duo">2 Players</option>
                  </select>
                </div>

                {mode === "ai" && (
                  <>
                    <DifficultySlider
                      options={["easy", "medium", "hard"]}
                      value={difficulty}
                      onChange={(v) => setDifficulty(v as Difficulty)}
                      labels={{ easy: "Easy", medium: "Medium", hard: "Hard" }}
                    />

                    <div className="settings-row">
                      <label className="settings-label" htmlFor="ttt-side">You play as</label>
                      <select
                        id="ttt-side"
                        className="setting-select"
                        value={humanMark}
                        onChange={(e) => setAiMark((e.target.value as Player) === "X" ? "O" : "X")}
                      >
                        <option value="X">X (you go first)</option>
                        <option value="O">O (AI goes first)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="setup-modal-footer">
              <button className="btn btn-block" onClick={applySetup}>
                Apply &amp; Reset Score
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </GameLayout>
  );
}

export default TicTacToeGame;
