import { useEffect, useMemo, useState } from "react";
import GameLayout from "../../components/GameLayout";
import { DEFAULT_CATEGORIES, IMPOSTER_WORDS } from "./imposterData";

type SetupState = {
  players: number;
  imposters: number;
  categories: string[];
  rounds: number;
  showHints: boolean;
  playerNames: string[];
};

type PlayerRole = {
  id: number;
  name: string;
  isImposter: boolean;
};

const defaultSetup: SetupState = {
  players: 4,
  imposters: 1,
  categories: ["movies", "food", "objects"],
  rounds: 1,
  showHints: true,
  playerNames: ["Player 1", "Player 2", "Player 3", "Player 4"],
};

const randomPick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const createRoles = (setup: SetupState): PlayerRole[] => {
  const { players, imposters, playerNames } = setup;
  const indexes = new Set<number>();
  while (indexes.size < imposters) {
    indexes.add(Math.floor(Math.random() * players));
  }
  return Array.from({ length: players }, (_, index) => ({
    id: index + 1,
    name: playerNames[index] || `Player ${index + 1}`,
    isImposter: indexes.has(index),
  }));
};

function ImposterGame() {
  const [setup, setSetup] = useState<SetupState>(defaultSetup);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(true);
  const [setupTab, setSetupTab] = useState<"players" | "categories" | "custom">("players");
  const [roles, setRoles] = useState<PlayerRole[]>([]);
  const [secretWord, setSecretWord] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [isCardRevealed, setIsCardRevealed] = useState<boolean>(false);
  const [phase, setPhase] = useState<"idle" | "reveal" | "summary">("idle");
  const [firstSpeaker, setFirstSpeaker] = useState<string>("");

  // Custom Categories and Words
  const [customWords, setCustomWords] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem("imposter_custom_words");
    return saved ? JSON.parse(saved) : {};
  });

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newWord, setNewWord] = useState("");
  const [addingToCategory, setAddingToCategory] = useState("");

  useEffect(() => {
    localStorage.setItem("imposter_custom_words", JSON.stringify(customWords));
  }, [customWords]);

  const allWords = useMemo(() => ({ ...IMPOSTER_WORDS, ...customWords }), [customWords]);
  const allCategories = useMemo(() => Object.keys(allWords), [allWords]);

  const imposterCount = useMemo(() => roles.filter((player) => player.isImposter).length, [roles]);

  const startRound = (roundToStart = 1) => {
    if (setup.categories.length === 0) {
      alert("Please select at least one category!");
      return;
    }

    const nextRoles = createRoles(setup);

    // Pick a random category from selected ones
    const cat = randomPick(setup.categories);
    const word = randomPick(allWords[cat]);

    // Pick first speaker (randomly from anyone)
    const speaker = randomPick(nextRoles).name;

    setRoles(nextRoles);
    setSecretWord(word);
    setSelectedCategory(cat);
    setFirstSpeaker(speaker);
    setCurrentRound(roundToStart);
    setCurrentPlayerIndex(0);
    setIsCardRevealed(false);
    setPhase("reveal");
    setIsSetupOpen(false);
  };

  const advancePlayer = () => {
    setIsCardRevealed(false);
    if (currentPlayerIndex + 1 >= roles.length) {
      setPhase("summary");
      return;
    }
    setCurrentPlayerIndex((prev) => prev + 1);
  };

  const nextRound = () => {
    if (currentRound >= setup.rounds) {
      setPhase("idle");
      setIsSetupOpen(true);
      return;
    }
    startRound(currentRound + 1);
  };

  const toggleCategory = (cat: string) => {
    setSetup(prev => {
      const categories = prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories };
    });
  };

  const updatePlayerCount = (val: number) => {
    setSetup(prev => {
      const newCount = Math.max(3, Math.min(16, val));
      const newNames = [...prev.playerNames];
      if (newCount > prev.playerNames.length) {
        for (let i = prev.playerNames.length; i < newCount; i++) {
          newNames.push(`Player ${i + 1}`);
        }
      } else {
        newNames.splice(newCount);
      }
      return {
        ...prev,
        players: newCount,
        playerNames: newNames,
        imposters: Math.min(prev.imposters, newCount - 1)
      };
    });
  };

  const updatePlayerName = (index: number, name: string) => {
    setSetup(prev => {
      const newNames = [...prev.playerNames];
      newNames[index] = name;
      return { ...prev, playerNames: newNames };
    });
  };

  const addNewCategory = () => {
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.toLowerCase().trim();
    if (allWords[catName]) {
      alert("Category already exists!");
      return;
    }
    setCustomWords(prev => ({ ...prev, [catName]: [] }));
    setNewCategoryName("");
    setAddingToCategory(catName);
  };

  const addNewWord = (cat: string) => {
    if (!newWord.trim()) return;
    setCustomWords(prev => ({
      ...prev,
      [cat]: [...(prev[cat] || []), newWord.trim()]
    }));
    setNewWord("");
  };

  const removeCategory = (cat: string) => {
    if (DEFAULT_CATEGORIES.includes(cat)) {
      alert("Cannot remove default categories.");
      return;
    }
    setCustomWords(prev => {
      const next = { ...prev };
      delete next[cat];
      return next;
    });
    setSetup(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== cat)
    }));
    if (addingToCategory === cat) setAddingToCategory("");
  };

  const activePlayer = roles[currentPlayerIndex];

  return (
    <GameLayout
      title="Imposter"
      subtitle="A game of social deduction. Find the imposter among you!"
      stats={
        <>
          <span className="chip">Players: {setup.players}</span>
          <span className="chip">Imposters: {setup.imposters}</span>
          <span className="chip">Round: {currentRound}/{setup.rounds}</span>
        </>
      }
    >
      <div className="imposter-game-container">
        {phase !== "idle" ? (
          <div className="imp-game-toolbar">
            <button className="imp-toolbar-btn" onClick={() => startRound(1)}>↺ New Game</button>
            <button className="imp-toolbar-btn imp-toolbar-btn-ghost" onClick={() => setIsSetupOpen(true)}>⚙ Setup</button>
          </div>
        ) : null}
        {phase === "idle" ? (
          <section className="imposter-center main-menu-view">
            <div className="hero-icon">🕵️‍♂️</div>
            <h3>Ready to play?</h3>
            <p>Customize your game settings and start hunting for the imposter.</p>
            <button className="btn btn-lg" onClick={() => setIsSetupOpen(true)}>
              Open Game Setup
            </button>
          </section>
        ) : null}

        {phase === "reveal" && activePlayer ? (
          <section className="imposter-center reveal-view">
            <>
              <div className="player-avatar">
                <span className="avatar-circle">{activePlayer.id}</span>
                <h3>{activePlayer.name}</h3>
              </div>
              <p className="instruction-text">
                Only <strong>{activePlayer.name}</strong> should see the screen now.
              </p>

                <div className={`imposter-card-premium ${isCardRevealed ? "is-flipped" : ""}`}>
                  <div className="card-inner">
                    <div className="card-front">
                      <button className="btn btn-reveal" onClick={() => setIsCardRevealed(true)}>
                        REVEAL ROLE
                      </button>
                    </div>
                    <div className="card-back">
                      <div className={`role-badge ${activePlayer.isImposter ? "imposter" : "crewmate"}`}>
                        {activePlayer.isImposter ? "IMPOSTER" : "CREWMATE"}
                      </div>
                      <div className="word-display">
                        {activePlayer.isImposter ? (
                          <span className="no-word">You don't have a word!</span>
                        ) : (
                          <>
                            <span className="word-label">Your word is:</span>
                            <span className="word-text">{secretWord}</span>
                          </>
                        )}
                      </div>
                      {setup.showHints && (
                        <div className="category-hint-display">
                          Category: <span>{selectedCategory}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              <button className="btn btn-primary btn-next" onClick={advancePlayer} disabled={!isCardRevealed}>
                {currentPlayerIndex + 1 === roles.length ? "All Roles Revealed" : "Next"}
              </button>
            </>
          </section>
        ) : null}

        {phase === "summary" ? (
          <section className="imposter-center summary-view">
            <div className="hero-icon">🗣️</div>
            <h3>Time to Discuss!</h3>
            <p>The words have been assigned. Discuss and vote for the imposter.</p>

            <div className="first-speaker-announcement">
              <span className="speaker-label">First Speaker:</span>
              <span className="speaker-name">{firstSpeaker}</span>
            </div>

            <div className="summary-info-cards">
              <div className="info-card">
                <span className="info-label">Selected Categories</span>
                <div className="info-chips">
                  {setup.categories.map(c => <span key={c} className="chip">{c}</span>)}
                </div>
              </div>
              <div className="info-card">
                <span className="info-label">Active Imposters</span>
                <span className="info-value">{imposterCount}</span>
              </div>
            </div>

            <div className="summary-actions">
              <button className="btn btn-secondary" onClick={() => setIsSetupOpen(true)}>
                Change Settings
              </button>
              <button className="btn" onClick={nextRound}>
                {currentRound >= setup.rounds ? "Restart Game" : "Next Round"}
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {isSetupOpen ? (
        <div className="modal-backdrop" onClick={() => setIsSetupOpen(false)} role="presentation">
          <section className="setup-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="setup-modal-head">
              <h3>Game Setup</h3>
              <button className="close-btn" onClick={() => setIsSetupOpen(false)} aria-label="Close">✕</button>
            </div>

            {/* Tabs */}
            <div className="setup-tabs" role="tablist">
              {(["players", "categories", "custom"] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={setupTab === tab}
                  className={`setup-tab-btn${setupTab === tab ? " setup-tab-active" : ""}`}
                  onClick={() => setSetupTab(tab)}
                >
                  {tab === "players" ? "👥 Players" : tab === "categories" ? "🏷 Categories" : "✏️ Custom"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="setup-tab-content" role="tabpanel">

              {/* PLAYERS */}
              {setupTab === "players" && (
                <div className="setup-tab-pane">
                  <div className="imp-counters">
                    <div className="imp-counter-item">
                      <span className="imp-counter-label">Players</span>
                      <div className="number-input-group">
                        <button onClick={() => updatePlayerCount(setup.players - 1)}>−</button>
                        <span>{setup.players}</span>
                        <button onClick={() => updatePlayerCount(setup.players + 1)}>+</button>
                      </div>
                    </div>
                    <div className="imp-counter-item">
                      <span className="imp-counter-label">Imposters</span>
                      <div className="number-input-group">
                        <button onClick={() => setSetup(p => ({ ...p, imposters: Math.max(1, p.imposters - 1) }))}>−</button>
                        <span>{setup.imposters}</span>
                        <button onClick={() => setSetup(p => ({ ...p, imposters: Math.min(setup.players - 1, p.imposters + 1) }))}>+</button>
                      </div>
                    </div>
                    <div className="imp-counter-item">
                      <span className="imp-counter-label">Rounds</span>
                      <div className="number-input-group">
                        <button onClick={() => setSetup(p => ({ ...p, rounds: Math.max(1, p.rounds - 1) }))}>−</button>
                        <span>{setup.rounds}</span>
                        <button onClick={() => setSetup(p => ({ ...p, rounds: Math.min(10, p.rounds + 1) }))}>+</button>
                      </div>
                    </div>
                  </div>

                  <label className="switch-field" style={{ marginTop: "0.6rem" }}>
                    <input
                      type="checkbox"
                      checked={setup.showHints}
                      onChange={(e) => setSetup(p => ({ ...p, showHints: e.target.checked }))}
                    />
                    <span>Show category hints</span>
                  </label>

                  <p className="setup-hint" style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>Tap to rename players</p>
                  <div className="player-names-list">
                    {setup.playerNames.map((name, idx) => (
                      <div key={idx} className="name-input-row">
                        <span className="idx">{idx + 1}</span>
                        <input
                          value={name}
                          onChange={e => updatePlayerName(idx, e.target.value)}
                          placeholder={`Player ${idx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CATEGORIES */}
              {setupTab === "categories" && (
                <div className="setup-tab-pane">
                  <p className="setup-hint" style={{ marginBottom: "0.5rem" }}>Tap to toggle. At least one required.</p>
                  <div className="category-selection-grid">
                    {allCategories.map((cat) => (
                      <div
                        key={cat}
                        className={`category-item${setup.categories.includes(cat) ? " selected" : ""}`}
                        onClick={() => toggleCategory(cat)}
                      >
                        <span className="cat-name">{cat}</span>
                        <span className="cat-count">{allWords[cat].length} words</span>
                        {!DEFAULT_CATEGORIES.includes(cat) && (
                          <button
                            className="delete-cat"
                            onClick={(e) => { e.stopPropagation(); removeCategory(cat); }}
                          >×</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CUSTOM */}
              {setupTab === "custom" && (
                <div className="setup-tab-pane">
                  <p className="setup-hint" style={{ marginBottom: "0.5rem" }}>Add your own categories and words.</p>
                  <div className="setup-add-row">
                    <input
                      className="setting-input"
                      placeholder="New category name..."
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addNewCategory()}
                    />
                    <button className="btn btn-sm btn-secondary" onClick={addNewCategory}>Add</button>
                  </div>
                  <div className="imp-divider" />
                  <label className="settings-label" style={{ marginBottom: "0.3rem", display: "block" }}>Add word to category</label>
                  <div className="setup-add-row" style={{ marginBottom: "0.4rem" }}>
                    <select
                      className="setting-select"
                      value={addingToCategory}
                      onChange={e => setAddingToCategory(e.target.value)}
                    >
                      <option value="">Select category...</option>
                      {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="setup-add-row">
                    <input
                      className="setting-input"
                      placeholder="Word to add..."
                      value={newWord}
                      disabled={!addingToCategory}
                      onChange={e => setNewWord(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addNewWord(addingToCategory)}
                    />
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => addNewWord(addingToCategory)}
                      disabled={!addingToCategory || !newWord.trim()}
                    >Add</button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="setup-modal-footer">
              <button className="btn btn-block" onClick={() => startRound(1)}>
                Start Game
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </GameLayout>
  );
}

export default ImposterGame;
