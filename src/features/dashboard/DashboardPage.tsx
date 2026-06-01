import React from "react";
import { Link } from "react-router-dom";
import { GAMES } from "../../gameRegistry";

interface Props {
  hiddenGames?: string[];
}

function DashboardPage({ hiddenGames = [] }: Props) {
  const visibleGames = GAMES.filter((g) => !hiddenGames.includes(g.id));
  return (
    <section className="dashboard-view">
      <div className="hero-premium">
        <div className="hero-content">
          <h1>Arcade Universe</h1>
          <p>Experience the ultimate collection of classic and social games — play anywhere, on any device.</p>
          <div className="hero-stats">
            <div className="stat"><span>{GAMES.length}</span> Games</div>
            <div className="stat"><span>8</span> Categories</div>
            <div className="stat"><span>∞</span> Fun</div>
          </div>
        </div>
      </div>
      
      <div className="game-grid-premium">
        {visibleGames.map((game) => (
          <Link key={game.id} to={game.path} className="game-card-premium" style={{"--accent": game.color} as React.CSSProperties}>
            <div className="card-top">
              <div className="game-icon">{game.icon}</div>
              <div className="game-badge">{game.difficulty}</div>
            </div>
            <div className="card-body">
              <h3>{game.label}</h3>
              <p>{game.description}</p>
            </div>
            <div className="card-footer">
              <span className="play-hint">Play Now</span>
              <span className="arrow">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default DashboardPage;

