import { ReactNode } from "react";

type GameLayoutProps = {
  title: string;
  subtitle: string;
  stats?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

function GameLayout({ title, subtitle, stats, actions, children }: GameLayoutProps) {
  return (
    <section className="game-layout">
      <div className="game-layout-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {stats ? <div className="stats-row">{stats}</div> : null}
      </div>
      <div className="game-layout-body">{children}</div>
      {actions ? <div className="game-layout-actions">{actions}</div> : null}
    </section>
  );
}

export default GameLayout;
