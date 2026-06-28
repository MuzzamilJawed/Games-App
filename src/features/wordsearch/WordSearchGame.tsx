import { useState, useRef, useEffect, useCallback } from "react";
import GameLayout from "../../components/GameLayout";
import "./wordsearch.css";

type Phase = "idle" | "playing";

type CategoryKey = "animals" | "fruits" | "countries" | "space";

type Category = {
  key: CategoryKey;
  label: string;
  icon: string;
  words: string[];
};

type PlacedWord = {
  word: string;
  cells: { row: number; col: number }[];
  found: boolean;
};

const GRID_SIZE = 10;

const CATEGORIES: Category[] = [
  {
    key: "animals",
    label: "Animals",
    icon: "🦊",
    words: ["TIGER", "PANDA", "ZEBRA", "HORSE", "EAGLE", "SHARK", "WHALE", "OTTER"],
  },
  {
    key: "fruits",
    label: "Fruits",
    icon: "🍓",
    words: ["APPLE", "MANGO", "LEMON", "GRAPE", "PEACH", "MELON", "BERRY", "OLIVE"],
  },
  {
    key: "countries",
    label: "Countries",
    icon: "🌍",
    words: ["BRAZIL", "CANADA", "FRANCE", "JAPAN", "EGYPT", "INDIA", "CHILE", "SPAIN"],
  },
  {
    key: "space",
    label: "Space",
    icon: "🚀",
    words: ["COMET", "ORBIT", "VENUS", "MARS", "PLUTO", "SOLAR", "LUNAR", "NOVA"],
  },
];

const DIRECTIONS: { dr: number; dc: number }[] = [
  { dr: 0, dc: 1 },
  { dr: 0, dc: -1 },
  { dr: 1, dc: 0 },
  { dr: -1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: -1, dc: -1 },
  { dr: 1, dc: -1 },
  { dr: -1, dc: 1 },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type GenResult = { grid: string[][]; placed: PlacedWord[] };

const generatePuzzle = (words: string[]): GenResult => {
  const grid: (string | null)[][] = Array.from({ length: GRID_SIZE }, () =>
    Array<string | null>(GRID_SIZE).fill(null)
  );
  const placed: PlacedWord[] = [];

  const tryPlace = (word: string): boolean => {
    for (let attempt = 0; attempt < 80; attempt++) {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      const endR = row + dir.dr * (word.length - 1);
      const endC = col + dir.dc * (word.length - 1);
      if (endR < 0 || endR >= GRID_SIZE || endC < 0 || endC >= GRID_SIZE) continue;

      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + dir.dr * i;
        const c = col + dir.dc * i;
        const existing = grid[r][c];
        if (existing !== null && existing !== word[i]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      const cells: { row: number; col: number }[] = [];
      for (let i = 0; i < word.length; i++) {
        const r = row + dir.dr * i;
        const c = col + dir.dc * i;
        grid[r][c] = word[i];
        cells.push({ row: r, col: c });
      }
      placed.push({ word, cells, found: false });
      return true;
    }
    return false;
  };

  for (const word of words) {
    tryPlace(word);
  }

  const finalGrid: string[][] = grid.map((rowArr) =>
    rowArr.map((cell) => cell ?? ALPHABET[Math.floor(Math.random() * ALPHABET.length)])
  );

  return { grid: finalGrid, placed };
};

const buildPuzzle = (words: string[]): GenResult => {
  // Regenerate up to a few times to maximize words placed.
  let best: GenResult = generatePuzzle(words);
  if (best.placed.length === words.length) return best;
  for (let i = 0; i < 8; i++) {
    const candidate = generatePuzzle(words);
    if (candidate.placed.length > best.placed.length) best = candidate;
    if (best.placed.length === words.length) break;
  }
  return best;
};

const cellKey = (r: number, c: number) => `${r},${c}`;

const lineBetween = (
  start: { row: number; col: number },
  end: { row: number; col: number }
): { row: number; col: number }[] | null => {
  const dr = end.row - start.row;
  const dc = end.col - start.col;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);
  // Must be straight: horizontal, vertical, or 45deg diagonal.
  if (!(dr === 0 || dc === 0 || adr === adc)) return null;
  const steps = Math.max(adr, adc);
  const stepR = steps === 0 ? 0 : dr / steps;
  const stepC = steps === 0 ? 0 : dc / steps;
  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    cells.push({ row: start.row + stepR * i, col: start.col + stepC * i });
  }
  return cells;
};

function WordSearchGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [grid, setGrid] = useState<string[][]>([]);
  const [placed, setPlaced] = useState<PlacedWord[]>([]);
  const [setupOpen, setSetupOpen] = useState<boolean>(false);
  const [pendingCategory, setPendingCategory] = useState<CategoryKey>(CATEGORIES[0].key);

  const [selecting, setSelecting] = useState<boolean>(false);
  const [selStart, setSelStart] = useState<{ row: number; col: number } | null>(null);
  const [selCells, setSelCells] = useState<{ row: number; col: number }[]>([]);

  const [seconds, setSeconds] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const total = placed.length;
  const found = placed.filter((p) => p.found).length;
  const won = total > 0 && found === total;

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  }, [stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  useEffect(() => {
    if (won) stopTimer();
  }, [won, stopTimer]);

  const startGame = useCallback(
    (cat: Category) => {
      const puzzle = buildPuzzle(cat.words);
      setCategory(cat);
      setGrid(puzzle.grid);
      setPlaced(puzzle.placed);
      setSeconds(0);
      setSelecting(false);
      setSelStart(null);
      setSelCells([]);
      setPhase("playing");
      startTimer();
    },
    [startTimer]
  );

  const newGame = useCallback(() => startGame(category), [startGame, category]);

  const openSetup = () => {
    setPendingCategory(category.key);
    setSetupOpen(true);
  };

  const applySetup = () => {
    const cat = CATEGORIES.find((c) => c.key === pendingCategory) ?? CATEGORIES[0];
    setSetupOpen(false);
    startGame(cat);
  };

  // --- Pointer selection ---
  const cellFromPoint = (clientX: number, clientY: number): { row: number; col: number } | null => {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!el) return null;
    const cellEl = el.closest("[data-row]") as HTMLElement | null;
    if (!cellEl) return null;
    const row = Number(cellEl.dataset.row);
    const col = Number(cellEl.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return null;
    return { row, col };
  };

  const beginSelect = (row: number, col: number) => {
    setSelecting(true);
    setSelStart({ row, col });
    setSelCells([{ row, col }]);
  };

  const updateSelect = (row: number, col: number) => {
    if (!selStart) return;
    const line = lineBetween(selStart, { row, col });
    if (line) setSelCells(line);
  };

  const endSelect = () => {
    if (selStart && selCells.length > 1) {
      const letters = selCells.map((c) => grid[c.row][c.col]).join("");
      const reversed = letters.split("").reverse().join("");
      setPlaced((prev) =>
        prev.map((p) => {
          if (p.found) return p;
          if (p.word === letters || p.word === reversed) {
            // verify the cells coincide (forward or backward)
            const matchSet = new Set(p.cells.map((c) => cellKey(c.row, c.col)));
            const selSet = selCells.filter((c) => matchSet.has(cellKey(c.row, c.col)));
            if (selSet.length === p.cells.length) {
              return { ...p, found: true };
            }
          }
          return p;
        })
      );
    }
    setSelecting(false);
    setSelStart(null);
    setSelCells([]);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (won) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    beginSelect(cell.row, cell.col);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!selecting) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell) updateSelect(cell.row, cell.col);
  };

  const onPointerUp = () => {
    if (selecting) endSelect();
  };

  const foundCells = new Set<string>();
  for (const p of placed) {
    if (p.found) for (const c of p.cells) foundCells.add(cellKey(c.row, c.col));
  }
  const selSet = new Set(selCells.map((c) => cellKey(c.row, c.col)));

  return (
    <GameLayout
      title="Word Search"
      subtitle="Find every hidden word in the letter grid."
      stats={
        <>
          <span className="chip">Found: {found}/{total}</span>
          <span className="chip">Time: {seconds}s</span>
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
      {phase === "idle" ? (
        <div className="game-idle-view">
          <div className="hero-icon">🔠</div>
          <h3>Word Search</h3>
          <p>Drag across the grid to highlight hidden words in 8 directions. Pick a category and find them all.</p>
          <button className="btn btn-lg" onClick={() => setSetupOpen(true)} aria-label="Start Word Search">
            Start Game
          </button>
        </div>
      ) : (
        <div className="ws-stage">
          <div className="ws-board-wrap">
            <div
              className={`ws-grid${won ? " ws-grid-won" : ""}`}
              ref={gridRef}
              role="grid"
              aria-label={`${category.label} word search grid`}
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {grid.map((rowArr, r) =>
                rowArr.map((letter, c) => {
                  const key = cellKey(r, c);
                  const isFound = foundCells.has(key);
                  const isSel = selSet.has(key);
                  return (
                    <div
                      key={key}
                      data-row={r}
                      data-col={c}
                      role="gridcell"
                      aria-label={`Row ${r + 1} column ${c + 1} letter ${letter}`}
                      className={`ws-cell${isFound ? " ws-cell-found" : ""}${isSel ? " ws-cell-sel" : ""}`}
                    >
                      {letter}
                    </div>
                  );
                })
              )}
            </div>
            {won ? (
              <div className="ws-win-banner" role="status">
                <span className="ws-win-emoji">🎉</span>
                <span>Solved in {seconds}s!</span>
              </div>
            ) : null}
          </div>

          <div className="ws-words" aria-label="Words to find">
            <span className="ws-words-title">{category.icon} {category.label}</span>
            <div className="ws-words-list">
              {placed.map((p) => (
                <span
                  key={p.word}
                  className={`ws-word-chip${p.found ? " ws-word-found" : ""}`}
                >
                  {p.word}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {setupOpen ? (
        <div className="modal-backdrop" onClick={() => setSetupOpen(false)} role="presentation">
          <section className="setup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="setup-modal-head">
              <h3>Word Search Setup</h3>
              <button className="close-btn" onClick={() => setSetupOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="setup-tab-content" role="tabpanel">
              <div className="setup-tab-pane">
                <div className="settings-row">
                  <span className="settings-label">Category</span>
                  <select
                    className="setting-select"
                    value={pendingCategory}
                    onChange={(e) => setPendingCategory(e.target.value as CategoryKey)}
                    aria-label="Choose category"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ws-setup-preview">
                  {(CATEGORIES.find((c) => c.key === pendingCategory) ?? CATEGORIES[0]).words.map(
                    (w) => (
                      <span key={w} className="ws-word-chip">
                        {w}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="setup-modal-footer">
              <button className="btn btn-block" onClick={applySetup}>
                Start Game
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </GameLayout>
  );
}

export default WordSearchGame;
