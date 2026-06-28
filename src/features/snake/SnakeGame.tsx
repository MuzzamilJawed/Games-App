import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import GameLayout from "../../components/GameLayout";
import "./snake.css";

type Direction = "up" | "down" | "left" | "right";
type Cell = { row: number; col: number };
type Phase = "idle" | "playing";

const GRID = 17;
const BEST_KEY = "snake_best";
const BASE_SPEED = 170; // ms per step at score 0
const MIN_SPEED = 75; // fastest step interval

const MOVES: Record<Direction, Cell> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const keyOf = (c: Cell) => `${c.row}:${c.col}`;

const initialSnake = (): Cell[] => {
  const mid = Math.floor(GRID / 2);
  return [
    { row: mid, col: mid },
    { row: mid, col: mid - 1 },
    { row: mid, col: mid - 2 },
  ];
};

const randomFood = (occupied: Set<string>): Cell => {
  const free: Cell[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      if (!occupied.has(`${row}:${col}`)) free.push({ row, col });
    }
  }
  if (free.length === 0) return { row: 0, col: 0 };
  return free[Math.floor(Math.random() * free.length)];
};

const loadBest = (): number => {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
};

function SnakeGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [snake, setSnake] = useState<Cell[]>(initialSnake);
  const [food, setFood] = useState<Cell>({ row: 4, col: 4 });
  const [direction, setDirection] = useState<Direction>("right");
  const [score, setScore] = useState<number>(0);
  const [best, setBest] = useState<number>(loadBest);
  const [paused, setPaused] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Refs to avoid stale closures inside the rAF loop.
  const dirRef = useRef<Direction>(direction);
  const pendingDirRef = useRef<Direction>(direction);
  const snakeRef = useRef<Cell[]>(snake);
  const foodRef = useRef<Cell>(food);
  const scoreRef = useRef<number>(score);
  const pausedRef = useRef<boolean>(paused);
  const gameOverRef = useRef<boolean>(gameOver);
  const phaseRef = useRef<Phase>(phase);

  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const currentSpeed = useMemo(
    () => Math.max(MIN_SPEED, BASE_SPEED - score * 4),
    [score],
  );
  const speedRef = useRef<number>(currentSpeed);
  useEffect(() => { speedRef.current = currentSpeed; }, [currentSpeed]);

  const queueDirection = useCallback((next: Direction) => {
    // Prevent 180-degree reversal relative to the last committed direction.
    if (next === OPPOSITE[dirRef.current]) return;
    pendingDirRef.current = next;
  }, []);

  const start = useCallback(() => {
    const fresh = initialSnake();
    setSnake(fresh);
    snakeRef.current = fresh;
    dirRef.current = "right";
    pendingDirRef.current = "right";
    setDirection("right");
    setScore(0);
    scoreRef.current = 0;
    setGameOver(false);
    gameOverRef.current = false;
    setPaused(false);
    pausedRef.current = false;
    const occupied = new Set(fresh.map(keyOf));
    const f = randomFood(occupied);
    setFood(f);
    foodRef.current = f;
    setPhase("playing");
    phaseRef.current = "playing";
  }, []);

  const togglePause = useCallback(() => {
    if (gameOverRef.current) return;
    setPaused((p) => !p);
  }, []);

  const step = useCallback(() => {
    if (pausedRef.current || gameOverRef.current || phaseRef.current !== "playing") return;

    const committed = pendingDirRef.current;
    dirRef.current = committed;
    setDirection(committed);

    const prev = snakeRef.current;
    const move = MOVES[committed];
    const head = prev[0];
    const next: Cell = { row: head.row + move.row, col: head.col + move.col };

    // Wall collision.
    if (next.row < 0 || next.row >= GRID || next.col < 0 || next.col >= GRID) {
      setGameOver(true);
      gameOverRef.current = true;
      return;
    }

    const ate = next.row === foodRef.current.row && next.col === foodRef.current.col;

    // Self-collision (tail moves away unless we just ate).
    const body = ate ? prev : prev.slice(0, prev.length - 1);
    if (body.some((seg) => seg.row === next.row && seg.col === next.col)) {
      setGameOver(true);
      gameOverRef.current = true;
      return;
    }

    const newSnake = [next, ...body];
    snakeRef.current = newSnake;
    setSnake(newSnake);

    if (ate) {
      const nextScore = scoreRef.current + 10;
      scoreRef.current = nextScore;
      setScore(nextScore);
      setBest((b) => {
        if (nextScore > b) {
          try { localStorage.setItem(BEST_KEY, String(nextScore)); } catch { /* ignore */ }
          return nextScore;
        }
        return b;
      });
      const occupied = new Set(newSnake.map(keyOf));
      const f = randomFood(occupied);
      foodRef.current = f;
      setFood(f);
    }
  }, []);

  // Main loop: requestAnimationFrame with a time accumulator keyed off speed.
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const delta = now - last;
      last = now;
      if (pausedRef.current || gameOverRef.current) return;
      acc += delta;
      while (acc >= speedRef.current) {
        acc -= speedRef.current;
        step();
        if (gameOverRef.current) break;
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, step]);

  // Keyboard controls.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") { queueDirection("up"); e.preventDefault(); }
      else if (k === "arrowdown" || k === "s") { queueDirection("down"); e.preventDefault(); }
      else if (k === "arrowleft" || k === "a") { queueDirection("left"); e.preventDefault(); }
      else if (k === "arrowright" || k === "d") { queueDirection("right"); e.preventDefault(); }
      else if (k === "p") { togglePause(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queueDirection, togglePause]);

  const segmentLookup = useMemo(() => {
    const map = new Map<string, number>();
    snake.forEach((seg, idx) => map.set(keyOf(seg), idx));
    return map;
  }, [snake]);

  const foodKey = keyOf(food);

  const cells = useMemo(() => {
    const out: { id: string; kind: "empty" | "head" | "body" | "food" }[] = [];
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        const id = `${row}:${col}`;
        const segIndex = segmentLookup.get(id);
        if (segIndex === 0) out.push({ id, kind: "head" });
        else if (segIndex !== undefined) out.push({ id, kind: "body" });
        else if (id === foodKey) out.push({ id, kind: "food" });
        else out.push({ id, kind: "empty" });
      }
    }
    return out;
  }, [segmentLookup, foodKey]);

  return (
    <GameLayout
      title="Snake"
      subtitle="Eat the food, grow longer, don't bite yourself."
      stats={
        <>
          <span className="chip">Score: {score}</span>
          <span className="chip">Best: {best}</span>
          <span className="chip">Length: {snake.length}</span>
        </>
      }
      actions={
        phase === "idle" ? null : (
          <>
            <button className="btn" onClick={togglePause} disabled={gameOver}>
              {paused ? "Resume" : "Pause"}
            </button>
            <button className="btn" onClick={start}>Restart</button>
          </>
        )
      }
    >
      {phase === "idle" ? (
        <section className="game-idle-view">
          <div className="hero-icon">🐍</div>
          <h3>Ready to play Snake?</h3>
          <p>
            Use arrow keys, WASD, or the on-screen D-pad to steer. Eat food to grow,
            but avoid the walls and your own tail!
          </p>
          <button className="btn btn-lg" onClick={start}>Play Snake</button>
        </section>
      ) : (
        <div className="snk-play">
          <p className="status" role="status">
            {gameOver
              ? "Game over."
              : paused
              ? "Game paused."
              : "Game running."}
          </p>

          <div className="snk-stage">
            <div
              className="snk-board"
              style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}
              role="grid"
              aria-label="Snake board"
            >
              {cells.map((cell) => (
                <div key={cell.id} className={`snk-cell snk-${cell.kind}`}>
                  {cell.kind === "food" ? <span className="snk-food-dot" /> : null}
                  {cell.kind === "head" ? <span className="snk-eyes" /> : null}
                </div>
              ))}
            </div>

            {gameOver ? (
              <div className="snk-overlay" role="alertdialog" aria-label="Game over">
                <div className="snk-overlay-card">
                  <h3>Game Over</h3>
                  <p className="snk-final-score">Score: {score}</p>
                  {score >= best && score > 0 ? (
                    <p className="snk-newbest">New best!</p>
                  ) : (
                    <p className="snk-best-line">Best: {best}</p>
                  )}
                  <button className="btn btn-lg" onClick={start}>Play Again</button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="control-pad" aria-label="Touch controls">
            <button className="key-btn" onClick={() => queueDirection("up")} aria-label="Move up">↑</button>
            <div className="control-pad-middle">
              <button className="key-btn" onClick={() => queueDirection("left")} aria-label="Move left">←</button>
              <button className="key-btn" onClick={() => queueDirection("down")} aria-label="Move down">↓</button>
              <button className="key-btn" onClick={() => queueDirection("right")} aria-label="Move right">→</button>
            </div>
          </div>
        </div>
      )}
    </GameLayout>
  );
}

export default SnakeGame;
