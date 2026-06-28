import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameLayout from "../../components/GameLayout";
import DifficultySlider from "../../components/DifficultySlider";
import "./memory.css";

type Difficulty = "easy" | "medium" | "hard";

type DifficultyConfig = {
  label: string;
  cols: number;
  rows: number;
};

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { label: "Easy (4 × 4)", cols: 4, rows: 4 },
  medium: { label: "Medium (4 × 5)", cols: 4, rows: 5 },
  hard: { label: "Hard (6 × 6)", cols: 6, rows: 6 },
};

const EMOJIS = [
  "🍎", "🍌", "🍇", "🍓", "🍒", "🍑", "🍍", "🥝",
  "🚀", "⭐", "🌙", "☀️", "🔥", "❄️", "🌈", "⚡",
  "🐶", "🐱", "🦊", "🐼", "🐸", "🐵", "🦄", "🐙",
];

type Card = {
  id: number;
  symbol: string;
  matched: boolean;
};

const shuffle = <T,>(input: T[]): T[] => {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const buildDeck = (difficulty: Difficulty): Card[] => {
  const { cols, rows } = DIFFICULTIES[difficulty];
  const pairCount = (cols * rows) / 2;
  const symbols = shuffle(EMOJIS).slice(0, pairCount);
  const deck = symbols.flatMap((symbol, index) => [
    { id: index * 2, symbol, matched: false },
    { id: index * 2 + 1, symbol, matched: false },
  ]);
  return shuffle(deck);
};

function MemoryGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [phase, setPhase] = useState<"idle" | "playing">("idle");
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);

  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [found, setFound] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [locked, setLocked] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const mismatchRef = useRef<number | null>(null);

  const config = DIFFICULTIES[difficulty];
  const total = (config.cols * config.rows) / 2;
  const isWin = phase === "playing" && found === total && total > 0;

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    if (mismatchRef.current !== null) window.clearTimeout(mismatchRef.current);
    timerRef.current = null;
    mismatchRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // Timer
  useEffect(() => {
    if (phase !== "playing" || isWin) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => setTime((t) => t + 1), 1000);
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, isWin]);

  const startGame = useCallback(
    (diff: Difficulty) => {
      clearTimers();
      setCards(buildDeck(diff));
      setFlipped([]);
      setMoves(0);
      setFound(0);
      setTime(0);
      setLocked(false);
      setPhase("playing");
      setIsSetupOpen(false);
    },
    [clearTimers],
  );

  const reset = useCallback(() => {
    startGame(difficulty);
  }, [difficulty, startGame]);

  const handleFlip = (index: number) => {
    if (locked || phase !== "playing") return;
    if (flipped.includes(index)) return;
    if (cards[index].matched) return;

    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = nextFlipped;
      if (cards[a].symbol === cards[b].symbol) {
        // Match
        mismatchRef.current = window.setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)),
          );
          setFound((f) => f + 1);
          setFlipped([]);
          setLocked(false);
        }, 350);
      } else {
        // Mismatch: flip back after delay
        mismatchRef.current = window.setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 850);
      }
    }
  };

  const gridStyle = useMemo(
    () => ({ ["--mem-cols" as string]: String(config.cols) }),
    [config.cols],
  );

  return (
    <GameLayout
      title="Memory Match"
      subtitle="Flip cards and find every matching pair."
      stats={
        <>
          <span className="chip">Moves: {moves}</span>
          <span className="chip">Pairs: {found}/{total}</span>
          <span className="chip">Time: {time}s</span>
        </>
      }
      actions={
        phase === "idle" ? null : (
          <>
            <button className="btn" onClick={reset}>New Game</button>
            <button className="btn btn-secondary" onClick={() => setIsSetupOpen(true)}>Setup</button>
          </>
        )
      }
    >
      {phase === "idle" ? (
        <section className="game-idle-view">
          <div className="hero-icon">🃏</div>
          <h3>Ready to test your memory?</h3>
          <p>Flip cards two at a time and match every pair in as few moves as you can.</p>
          <button className="btn btn-lg" onClick={() => setIsSetupOpen(true)}>Configure &amp; Play</button>
        </section>
      ) : (
        <div className="mem-stage">
          <div className="mem-board" style={gridStyle} role="grid" aria-label="Memory match board">
            {cards.map((card, index) => {
              const isUp = card.matched || flipped.includes(index);
              return (
                <button
                  key={card.id}
                  type="button"
                  className={`mem-card${isUp ? " is-flipped" : ""}${card.matched ? " is-matched" : ""}`}
                  onClick={() => handleFlip(index)}
                  disabled={card.matched || isWin}
                  role="gridcell"
                  aria-label={isUp ? `Card showing ${card.symbol}` : "Hidden card, click to flip"}
                >
                  <span className="mem-card-inner">
                    <span className="mem-face mem-face-back" aria-hidden="true">
                      <span className="mem-back-mark">?</span>
                    </span>
                    <span className="mem-face mem-face-front" aria-hidden={!isUp}>
                      {card.symbol}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {isWin ? (
            <div className="mem-win-overlay" role="status">
              <div className="mem-win-card">
                <div className="mem-win-emoji">🎉</div>
                <h3>You did it!</h3>
                <p>
                  Cleared {total} pairs in <strong>{moves}</strong> moves and <strong>{time}s</strong>.
                </p>
                <button className="btn btn-lg" onClick={reset}>Play Again</button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {isSetupOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => { if (phase !== "idle") setIsSetupOpen(false); }}
          role="presentation"
        >
          <section className="setup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="setup-modal-head">
              <h3>Game Setup</h3>
              {phase !== "idle" && (
                <button className="close-btn" onClick={() => setIsSetupOpen(false)} aria-label="Close">✕</button>
              )}
            </div>
            <div className="setup-tab-content">
              <div className="setup-tab-pane">
                <p className="setup-hint">Pick a difficulty, then start matching.</p>
                <DifficultySlider
                  options={Object.keys(DIFFICULTIES) as Difficulty[]}
                  value={difficulty}
                  onChange={(v) => setDifficulty(v as Difficulty)}
                  labels={Object.fromEntries(
                    (Object.keys(DIFFICULTIES) as Difficulty[]).map((k) => [k, DIFFICULTIES[k].label])
                  )}
                />
              </div>
            </div>
            <div className="setup-modal-footer">
              <button className="btn btn-block" onClick={() => startGame(difficulty)}>
                {phase === "idle" ? "Start Game" : "Restart with Settings"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </GameLayout>
  );
}

export default MemoryGame;
