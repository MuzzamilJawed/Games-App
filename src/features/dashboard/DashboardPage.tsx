import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GAMES, COMING_SOON } from "../../gameRegistry";

interface Props {
  hiddenGames?: string[];
}

type Card =
  | { kind: "game"; id: string; label: string; icon: string; path: string; color: string; description: string; difficulty: string }
  | { kind: "soon"; id: string; label: string; icon: string; color: string; description: string; difficulty: string };

/** Items per page based on viewport — keeps the grid full without overflow. */
function pageSizeFor(width: number) {
  if (width <= 640) return 4; // mobile: paginate in small chunks
  if (width <= 1024) return 6; // tablet
  return 8; // desktop
}

function DashboardPage({ hiddenGames = [] }: Props) {
  const cards = useMemo<Card[]>(() => {
    const live: Card[] = GAMES.filter((g) => !hiddenGames.includes(g.id)).map((g) => ({ kind: "game", ...g }));
    const soon: Card[] = COMING_SOON.map((g) => ({ kind: "soon", ...g }));
    return [...live, ...soon];
  }, [hiddenGames]);

  const liveCount = useMemo(() => cards.filter((c) => c.kind === "game").length, [cards]);

  const [perPage, setPerPage] = useState(() =>
    pageSizeFor(typeof window !== "undefined" ? window.innerWidth : 1280)
  );
  const [page, setPage] = useState(0);

  useEffect(() => {
    const onResize = () => setPerPage(pageSizeFor(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const pageCount = Math.max(1, Math.ceil(cards.length / perPage));

  // Clamp current page if perPage / card count changes.
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const start = page * perPage;
  const visibleCards = cards.slice(start, start + perPage);

  return (
    <section className="dashboard-view">
      {/* Enhanced Hero Section */}
      <div className="hero-premium">
        <div className="hero-content">
          <div className="hero-badge">Welcome to Arcade</div>
          <h1>Your Ultimate Gaming Hub</h1>
          <p>Discover a collection of classic and social games. Play anywhere, anytime, with anyone.</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">{liveCount}</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">{COMING_SOON.length}</span>
              <span className="stat-label">Coming Soon</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">∞</span>
              <span className="stat-label">Fun</span>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="games-section">
        <div className="section-header">
          <h2>Available Games</h2>
          <p>{liveCount} ready to play · {COMING_SOON.length} more on the way</p>
        </div>

        <div className="game-grid-premium">
          {visibleCards.map((card) =>
            card.kind === "game" ? (
              <Link
                key={card.id}
                to={card.path}
                className="game-card-premium"
                style={{ "--accent": card.color } as React.CSSProperties}
              >
                <div className="card-header">
                  <div className="game-icon">{card.icon}</div>
                  <div className="game-badge">{card.difficulty}</div>
                </div>
                <div className="card-body">
                  <h3>{card.label}</h3>
                  <p>{card.description}</p>
                </div>
                <div className="card-footer">
                  <span className="play-hint">Play Now</span>
                  <span className="arrow">→</span>
                </div>
              </Link>
            ) : (
              <div
                key={card.id}
                className="game-card-premium game-card-soon"
                style={{ "--accent": card.color } as React.CSSProperties}
                aria-disabled="true"
              >
                <div className="card-header">
                  <div className="game-icon">{card.icon}</div>
                  <div className="game-badge game-badge-soon">Soon</div>
                </div>
                <div className="card-body">
                  <h3>{card.label}</h3>
                  <p>{card.description}</p>
                </div>
                <div className="card-footer">
                  <span className="play-hint">Coming Soon</span>
                  <span className="lock">🔒</span>
                </div>
              </div>
            )
          )}
        </div>

        {pageCount > 1 && (
          <div className="dash-pagination" role="navigation" aria-label="Games pages">
            <button
              className="dash-page-btn"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
            >
              ‹
            </button>
            <div className="dash-page-dots">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  className={`dash-dot${i === page ? " active" : ""}`}
                  onClick={() => setPage(i)}
                  aria-label={`Page ${i + 1}`}
                  aria-current={i === page}
                />
              ))}
            </div>
            <button
              className="dash-page-btn"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default DashboardPage;
