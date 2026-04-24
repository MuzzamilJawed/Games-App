import { Link } from "react-router-dom";

const games = [
  {
    id: "hangman",
    title: "Hangman",
    icon: "🪓",
    description: "Rescue the hero by guessing the secret word before the time runs out.",
    path: "/hangman",
    difficulty: "Medium",
    color: "#3b82f6"
  },
  {
    id: "pacman",
    title: "Pacman Lite",
    icon: "🟡",
    description: "Classic arcade action! Dodge the ghosts and clear the maze of pellets.",
    path: "/pacman",
    difficulty: "Hard",
    color: "#facc15"
  },
  {
    id: "imposter",
    title: "Imposter",
    icon: "🕵️‍♂️",
    description: "Find the odd one out in this social deduction game. Perfect for parties!",
    path: "/imposter",
    difficulty: "Party",
    color: "#ef4444"
  },
];

function DashboardPage() {
  return (
    <section className="dashboard-view">
      <div className="hero-premium">
        <div className="hero-content">
          <h1>Arcade Universe</h1>
          <p>Experience the ultimate collection of classic and social games.</p>
          <div className="hero-stats">
            <div className="stat"><span>3</span> Games</div>
            <div className="stat"><span>∞</span> Fun</div>
          </div>
        </div>
      </div>
      
      <div className="game-grid-premium">
        {games.map((game) => (
          <Link key={game.id} to={game.path} className="game-card-premium" style={{"--accent": game.color} as any}>
            <div className="card-top">
              <div className="game-icon">{game.icon}</div>
              <div className="game-badge">{game.difficulty}</div>
            </div>
            <div className="card-body">
              <h3>{game.title}</h3>
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
