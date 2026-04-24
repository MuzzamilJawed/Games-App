import { useCallback, useEffect, useMemo, useState } from "react";
import GameLayout from "../../components/GameLayout";
import { HANGMAN_CATEGORIES, HANGMAN_WORDS, HangmanDifficulty, HangmanWordEntry } from "./words";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
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
  const [categoryInput, setCategoryInput] = useState<string>("");
  const [wordInput, setWordInput] = useState<string>("");
  const [wordCategoryInput, setWordCategoryInput] = useState<string>("");
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(HANGMAN_CATEGORIES);

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
  const dangerProgress = Math.min(1, wrongCount / settings.maxWrong);
  const sceneStage = Math.min(5, Math.floor((wrongCount / settings.maxWrong) * 5));
  const sceneImage = `/hangman/fall-${sceneStage}.svg`;

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
      setGuesses((prev) => new Set(prev).add(letter));
    },
    [guesses, isGameOver],
  );

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
        <>
          <button className="btn btn-secondary" onClick={() => setIsSetupOpen(true)}>
            Setup
          </button>
          <button className="btn" onClick={restart}>
            New word
          </button>
        </>
      }
    >
      {isSetupOpen ? (
        <div className="modal-backdrop" onClick={() => setIsSetupOpen(false)} role="presentation">
          <section
            className="setup-modal"
            aria-label="Hangman setup"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="setup-modal-head">
              <h3>Hangman Setup</h3>
              <button className="btn btn-secondary" onClick={() => setIsSetupOpen(false)}>
                Close
              </button>
            </div>
            <div className="settings-row">
              <span className="settings-label">Categories</span>
              <div className="settings-chips">
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
                          aria-label={`Remove ${category} category`}
                          onClick={() => removeCategory(category)}
                        >
                          x
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="settings-row">
              <label className="settings-label" htmlFor="addCategoryInput">
                Add category
              </label>
              <input
                id="addCategoryInput"
                className="setting-input"
                value={categoryInput}
                onChange={(event) => setCategoryInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addCategory();
                }}
                placeholder="e.g. mythology"
              />
              <button className="btn btn-secondary" type="button" onClick={addCategory}>
                Add
              </button>
            </div>
            <div className="settings-row">
              <label className="settings-label" htmlFor="wordInput">
                Add word
              </label>
              <input
                id="wordInput"
                className="setting-input"
                value={wordInput}
                onChange={(event) => setWordInput(event.target.value)}
                placeholder="e.g. odyssey"
              />
              <input
                className="setting-input"
                value={wordCategoryInput}
                onChange={(event) => setWordCategoryInput(event.target.value)}
                placeholder="categories: mythology, travel"
              />
              <button className="btn" type="button" onClick={addWord}>
                Add word
              </button>
            </div>
            <div className="settings-row">
              <label className="settings-label" htmlFor="difficultySelect">
                Difficulty
              </label>
              <select
                id="difficultySelect"
                className="setting-select"
                value={settings.difficulty}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    difficulty: event.target.value as HangmanDifficulty,
                  }))
                }
              >
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="settings-row">
              <label className="settings-label" htmlFor="maxWrongSelect">
                Max wrong attempts
              </label>
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
                {[5, 6, 7, 8, 9].map((attemptCount) => (
                  <option key={attemptCount} value={attemptCount}>
                    {attemptCount}
                  </option>
                ))}
              </select>
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
                <span>Show category hints</span>
              </label>
            </div>
            <div className="setup-list">
              <h4>Word list</h4>
              <ul>
                {wordPool.slice(-14).reverse().map((wordEntry, index) => (
                  <li key={`${wordEntry.value}-${index}`}>
                    <strong>{wordEntry.value}</strong>{" "}
                    <span>
                      {wordEntry.categories.join(", ")} - {getWordDifficulty(wordEntry.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      ) : null}
      <section
        className={`hangman-scene ${dangerProgress > 0.7 ? "hangman-scene-critical" : ""}`}
        aria-label="Tunnel danger meter"
      >
        <img className="scene-image" src={sceneImage} alt={`Hangman danger stage ${sceneStage + 1}`} />
        <div className="scene-overlay" style={{ opacity: `${0.15 + dangerProgress * 0.65}` }} />
        <div className="scene-stage">
          {isLost ? "Fell into the tunnel!" : `Danger ${Math.round(dangerProgress * 100)}%`}
        </div>
      </section>
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
          return (
            <button
              key={letter}
              className="key-btn"
              onClick={() => onGuess(letter)}
              disabled={used || isGameOver}
              aria-label={`Guess ${letter}`}
            >
              {letter.toUpperCase()}
            </button>
          );
        })}
      </div>
    </GameLayout>
  );
}

export default HangmanGame;
