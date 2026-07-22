import type { Card as CardData } from "./balance.ts";

export default function Card({ card }: { card: CardData }) {
  return (
    <article className="card">
      <span className="card-cost">{card.cost}</span>
      <h2 className="card-name">{card.name}</h2>
      <footer className="card-stats">
        <span className="card-atk">{card.atk}</span>
        <span className="card-hp">{card.hp}</span>
      </footer>
    </article>
  );
}
