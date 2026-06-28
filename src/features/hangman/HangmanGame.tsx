import { useCallback, useEffect, useMemo, useState } from "react";
import GameLayout from "../../components/GameLayout";
import DifficultySlider from "../../components/DifficultySlider";
import { HANGMAN_CATEGORIES, HANGMAN_WORDS, HangmanDifficulty, HangmanWordEntry } from "./words";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

function HangmanDrawing({
  wrongCount,
  maxWrong,
  isLost,
  isWon,
  shaking,
}: {
  wrongCount: number;
  maxWrong: number;
  isLost: boolean;
  isWon: boolean;
  shaking: boolean;
}) {
  const show = (n: number) => wrongCount >= n;
  const danger = Math.min(1, wrongCount / maxWrong);
  const stroke = isLost ? "#f87171" : isWon ? "#4ade80" : "#60a5fa";

  return (
    <div className={`hangman-drawing${shaking ? " hangman-shake" : ""}`} role="img" aria-label={`Hangman figure: ${wrongCount} wrong guesses`}>
      <svg viewBox="0 0 200 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* Gallows */}
        <line x1="20" y1="195" x2="180" y2="195" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        <line x1="60" y1="195" x2="60" y2="15" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        <line x1="60" y1="15" x2="140" y2="15" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        <line x1="60" y1="42" x2="88" y2="15" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
        <line x1="140" y1="15" x2="140" y2="45" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />

        {/* Head */}
        {show(1) && <circle cx="140" cy="61" r="15" fill="none" stroke={stroke} strokeWidth="3" className="hm-part" />}

        {/* Body */}
        {show(2) && <line x1="140" y1="76" x2="140" y2="128" stroke={stroke} strokeWidth="3" strokeLinecap="round" className="hm-part" />}

        {/* Left arm */}
        {show(3) && <line x1="140" y1="93" x2="110" y2="116" stroke={stroke} strokeWidth="3" strokeLinecap="round" className="hm-part" />}

        {/* Right arm */}
        {show(4) && <line x1="140" y1="93" x2="170" y2="116" stroke={stroke} strokeWidth="3" strokeLinecap="round" className="hm-part" />}

        {/* Left leg */}
        {show(5) && <line x1="140" y1="128" x2="112" y2="165" stroke={stroke} strokeWidth="3" strokeLinecap="round" className="hm-part" />}

        {/* Right leg */}
        {show(6) && <line x1="140" y1="128" x2="168" y2="165" stroke={stroke} strokeWidth="3" strokeLinecap="round" className="hm-part" />}

        {/* Lost: X eyes + frown */}
        {isLost && (
          <g className="hm-part">
            <line x1="133" y1="54" x2="139" y2="60" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="139" y1="54" x2="133" y2="60" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="141" y1="54" x2="147" y2="60" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="147" y1="54" x2="141" y2="60" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M133 67 Q140 63 147 67" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* Won: dot eyes + smile */}
        {isWon && show(1) && !isLost && (
          <g className="hm-part">
            <circle cx="135" cy="57" r="2.5" fill="#4ade80" />
            <circle cx="145" cy="57" r="2.5" fill="#4ade80" />
            <path d="M133 64 Q140 70 147 64" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
      </svg>

      <div className="hangman-danger-bar">
        <div className="hangman-danger-fill" style={{ width: `${danger * 100}%` }} />
      </div>
      <p className="hangman-danger-label">
        {isLost ? "Out of guesses!" : isWon ? "You got it!" : `${wrongCount} / ${maxWrong} wrong`}
      </p>
    </div>
  );
}
const defaultCategories = new Set<string>(["tech", "gaming"]);

type HangmanSettings = {
  selectedCategories: Set<string>;
  difficulty: HangmanDifficulty;
  maxWrong: number;
  revealCategoryHints: boolean;
};

const defaultSettings: HangmanSettings = {
  selectedCategories: defaultCategories,
  difficulty: "mixed",
  maxWrong: 7,
  revealCategoryHints: true,
};

const getWordDifficulty = (word: string): Exclude<HangmanDifficulty, "mixed"> => {
  if (word.length <= 6) return "easy";
  if (word.length <= 9) return "medium";
  return "hard";
};

const pickRandomWord = (settings: HangmanSettings, pool: HangmanWordEntry[]): HangmanWordEntry => {
  const categoryPool = pool.filter((entry) =>
    entry.categories.some((category) => settings.selectedCategories.has(category)),
  );
  const difficultyPool =
    settings.difficulty === "mixed"
      ? categoryPool
      : categoryPool.filter((entry) => getWordDifficulty(entry.value) === settings.difficulty);
  const fallbackPool =
    difficultyPool.length > 0 ? difficultyPool : categoryPool.length > 0 ? categoryPool : pool;
  return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
};

function HangmanGame() {
  const [wordPool, setWordPool] = useState<HangmanWordEntry[]>(HANGMAN_WORDS);
  const [settings, setSettings] = useState<HangmanSettings>(defaultSettings);
  const [entry, setEntry] = useState<HangmanWordEntry>(() => pickRandomWord(defaultSettings, HANGMAN_WORDS));
  const [guesses, setGuesses] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState<number>(0);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [phase, setPhase] = useState<"idle" | "playing">("idle");
  const [categoryInput, setCategoryInput] = useState<string>("");
  const [wordInput, setWordInput] = useState<string>("");
  const [wordCategoryInput, setWordCategoryInput] = useState<string>("");
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(HANGMAN_CATEGORIES);
  const [lastGuessResult, setLastGuessResult] = useState<{ letter: string; correct: boolean } | null>(null);
  const [setupTab, setSetupTab] = useState<"categories" | "words" | "rules">("categories");

  const wrongCount = useMemo(
    () => [...guesses].filter((letter) => !entry.value.includes(letter)).length,
    [guesses, entry.value],
  );

  const isWon = useMemo(
    () => entry.value.split("").every((letter) => guesses.has(letter)),
    [entry.value, guesses],
  );
  const isLost = wrongCount >= settings.maxWrong;
  const isGameOver = isWon || isLost;
  const maskedWord = useMemo(
    () =>
      entry.value
        .split("")
        .map((letter) => (guesses.has(letter) || isLost ? letter : "_"))
        .join(" "),
    [entry.value, guesses, isLost],
  );

  const onGuess = useCallback(
    (letter: string) => {
      if (isGameOver || guesses.has(letter)) return;
      const isCorrect = entry.value.includes(letter);
      setGuesses((prev) => new Set(prev).add(letter));
      setLastGuessResult({ letter, correct: isCorrect });
    },
    [guesses, isGameOver, entry.value],
  );

  useEffect(() => {
    if (!lastGuessResult) return;
    const timer = setTimeout(() => setLastGuessResult(null), 650);
    return () => clearTimeout(timer);
  }, [lastGuessResult]);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      const letter = event.key.toLowerCase();
      if (ALPHABET.includes(letter)) onGuess(letter);
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [onGuess]);

  const restart = useCallback(() => {
    const nextEntry = pickRandomWord(settings, wordPool);
    setEntry(nextEntry);
    setGuesses(new Set());
  }, [settings, wordPool]);

  useEffect(() => {
    restart();
  }, [settings, restart]);

  useEffect(() => {
    if (isWon) setStreak((prev) => prev + 1);
    if (isLost) setStreak(0);
  }, [isWon, isLost]);

  const toggleCategory = (category: string) => {
    setSettings((prev) => {
      const next = new Set(prev.selectedCategories);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      if (next.size === 0) {
        next.add(category);
      }
      return { ...prev, selectedCategories: next };
    });
  };

  const addCategory = () => {
    const normalized = categoryInput.trim().toLowerCase();
    if (!normalized) return;
    setDynamicCategories((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setSettings((prev) => {
      const next = new Set(prev.selectedCategories);
      next.add(normalized);
      return { ...prev, selectedCategories: next };
    });
    setCategoryInput("");
  };

  const addWord = () => {
    const normalizedWord = wordInput.trim().toLowerCase().replace(/\s+/g, "");
    if (!normalizedWord || normalizedWord.length < 3) return;
    const normalizedCategories = wordCategoryInput
      .split(",")
      .map((category) => category.trim().toLowerCase())
      .filter(Boolean);
    const finalCategories =
      normalizedCategories.length > 0
        ? [...new Set(normalizedCategories)]
        : Array.from(settings.selectedCategories);
    if (finalCategories.length === 0) return;

    setWordPool((prev) => [...prev, { value: normalizedWord, categories: finalCategories }]);
    setDynamicCategories((prev) => {
      const next = new Set(prev);
      finalCategories.forEach((category) => next.add(category));
      return [...next];
    });
    setWordInput("");
    setWordCategoryInput("");
  };

  const removeCategory = (category: string) => {
    setDynamicCategories((prev) => prev.filter((item) => item !== category));
    setSettings((prev) => {
      const next = new Set(prev.selectedCategories);
      next.delete(category);
      if (next.size === 0) next.add("tech");
      return { ...prev, selectedCategories: next };
    });
  };

  return (
    <GameLayout
      title="Hangman"
      subtitle="Multi-category mode: customize settings, then guess the word before attempts run out."
      stats={
        <>
          <span className="chip">Wrong: {wrongCount}</span>
          <span className="chip">Left: {settings.maxWrong - wrongCount}</span>
          <span className="chip">Difficulty: {settings.difficulty}</span>
          <span className="chip">Streak: {streak}</span>
        </>
      }
      actions={
        phase === "idle" ? null : (
          <>
            <button className="btn btn-secondary" onClick={() => setIsSetupOpen(true)}>Setup</button>
            <button className="btn" onClick={restart}>New word</button>
          </>
        )
      }
    >
      {/* Idle / pre-game screen */}
      {phase === "idle" ? (
        <section className="game-idle-view">
          <div className="hero-icon">🪓</div>
          <h3>Ready to play Hangman?</h3>
          <p>Pick your categories, difficulty, and start guessing words before the figure is complete.</p>
          <button className="btn btn-lg" onClick={() => setIsSetupOpen(true)}>Configure &amp; Play</button>
        </section>
      ) : null}

      {/* Setup modal */}
      {isSetupOpen ? (
        <div className="modal-backdrop" onClick={() => { if (phase !== "idle") setIsSetupOpen(false); }} role="presentation">
          <section
            className="setup-modal"
            aria-label="Hangman setup"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="setup-modal-head">
              <h3>Game Setup</h3>
              <button className="close-btn" onClick={() => setIsSetupOpen(false)} aria-label="Close setup">✕</button>
            </div>

            {/* Tab bar */}
            <div className="setup-tabs" role="tablist">
              {(["categories", "words", "rules"] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={setupTab === tab}
                  className={`setup-tab-btn ${setupTab === tab ? "setup-tab-active" : ""}`}
                  onClick={() => setSetupTab(tab)}
                >
                  {tab === "categories" ? "🏷 Categories" : tab === "words" ? "📝 Words" : "⚙ Rules"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="setup-tab-content" role="tabpanel">

              {/* CATEGORIES TAB */}
              {setupTab === "categories" && (
                <div className="setup-tab-pane">
                  <p className="setup-hint">Tap to toggle. Words will be drawn from active categories.</p>
                  <div className="settings-chips setup-chips-grid">
                    {dynamicCategories.map((category) => {
                      const active = settings.selectedCategories.has(category);
                      return (
                        <div key={category} className="category-chip-wrap">
                          <button
                            className={`chip-btn ${active ? "chip-btn-active" : ""}`}
                            onClick={() => toggleCategory(category)}
                            type="button"
                            aria-pressed={active}
                          >
                            {category}
                          </button>
                          {!HANGMAN_CATEGORIES.includes(category) ? (
                            <button
                              type="button"
                              className="chip-remove-btn"
                              aria-label={`Remove ${category}`}
                              onClick={() => removeCategory(category)}
                            >
                              ✕
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  <div className="setup-add-row">
                    <input
                      id="addCategoryInput"
                      className="setting-input"
                      value={categoryInput}
                      onChange={(event) => setCategoryInput(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") addCategory(); }}
                      placeholder="New category (e.g. mythology)"
                    />
                    <button className="btn btn-secondary" type="button" onClick={addCategory}>Add</button>
                  </div>
                </div>
              )}

              {/* WORDS TAB */}
              {setupTab === "words" && (
                <div className="setup-tab-pane">
                  <p className="setup-hint">Add custom words to the pool for this session.</p>
                  <div className="setup-add-row">
                    <input
                      id="wordInput"
                      className="setting-input"
                      value={wordInput}
                      onChange={(event) => setWordInput(event.target.value)}
                      placeholder="Word (e.g. odyssey)"
                    />
                  </div>
                  <div className="setup-add-row">
                    <input
                      className="setting-input"
                      value={wordCategoryInput}
                      onChange={(event) => setWordCategoryInput(event.target.value)}
                      placeholder="Categories: mythology, travel"
                    />
                    <button className="btn" type="button" onClick={addWord}>Add word</button>
                  </div>
                  <div className="setup-word-list">
                    <p className="setup-list-label">Recent words ({wordPool.length} total)</p>
                    <div className="setup-word-chips">
                      {wordPool.slice(-20).reverse().map((wordEntry, index) => (
                        <span key={`${wordEntry.value}-${index}`} className="word-pill">
                          {wordEntry.value}
                          <span className="word-pill-cat">{wordEntry.categories[0]}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RULES TAB */}
              {setupTab === "rules" && (
                <div className="setup-tab-pane">
                  <div className="rules-grid">
                    <div className="rule-card">
                      <DifficultySlider
                        options={["easy", "medium", "hard", "mixed"]}
                        value={settings.difficulty}
                        onChange={(v) =>
                          setSettings((prev) => ({
                            ...prev,
                            difficulty: v as HangmanDifficulty,
                          }))
                        }
                        labels={{
                          easy: "Easy",
                          medium: "Medium",
                          hard: "Hard",
                          mixed: "Mixed",
                        }}
                      />
                    </div>
                    <div className="rule-card">
                      <label className="rule-label" htmlFor="maxWrongSelect">Max wrong guesses</label>
                      <select
                        id="maxWrongSelect"
                        className="setting-select"
                        value={settings.maxWrong}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            maxWrong: Number(event.target.value),
                          }))
                        }
                      >
                        {[5, 6, 7, 8, 9].map((n) => (
                          <option key={n} value={n}>{n} mistakes</option>
                        ))}
                      </select>
                    </div>
                    <div className="rule-card rule-card-wide">
                      <label className="switch-field">
                        <input
                          type="checkbox"
                          checked={settings.revealCategoryHints}
                          onChange={(event) =>
                            setSettings((prev) => ({
                              ...prev,
                              revealCategoryHints: event.target.checked,
                            }))
                          }
                        />
                        <span>Show category hints during play</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="setup-modal-footer">
              {phase === "idle" ? (
                <button className="btn btn-block" onClick={() => { restart(); setPhase("playing"); setIsSetupOpen(false); }}>
                  Start Game
                </button>
              ) : (
                <button className="btn btn-block" onClick={() => { restart(); setIsSetupOpen(false); }}>
                  Apply &amp; New Word
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {/* Game board — only shown while playing */}
      {phase === "playing" ? (
        <>
          <HangmanDrawing
            wrongCount={wrongCount}
            maxWrong={settings.maxWrong}
            isLost={isLost}
            isWon={isWon}
            shaking={lastGuessResult?.correct === false}
          />
          <div className="hangman-word" aria-live="polite">
            {maskedWord}
          </div>
          {settings.revealCategoryHints ? (
            <p className="category-hints">Categories: {entry.categories.join(", ")}</p>
          ) : null}
          <p className="status" role="status">
            {isWon && "You won. Great guessing."}
            {isLost && `Game over. The word was "${entry.value}".`}
            {!isGameOver && "Keep guessing letters."}
          </p>
          <div className="letter-grid">
            {ALPHABET.map((letter) => {
              const used = guesses.has(letter);
              const result = lastGuessResult?.letter === letter ? lastGuessResult : null;
              return (
                <button
                  key={letter}
                  className={`key-btn${result?.correct === false ? " key-btn-wrong" : ""}${result?.correct === true ? " key-btn-correct" : ""}`}
                  onClick={() => onGuess(letter)}
                  disabled={used || isGameOver}
                  aria-label={`Guess ${letter}`}
                >
                  {letter.toUpperCase()}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </GameLayout>
  );
}

export default HangmanGame;
