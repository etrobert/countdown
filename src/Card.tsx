import type { Card as CardData } from "./balance.ts";

export default function Card({ card }: { card: CardData }) {
  return (
    <article className="grid h-[var(--card-h)] w-[var(--card-w)] grid-rows-[auto_1fr_auto] rounded-md border border-ink bg-face p-2.5 shadow-md">
      <span className="justify-self-start font-bold">{card.cost}</span>
      <h2 className="self-center text-center text-lg font-bold">{card.name}</h2>
      <footer className="flex justify-between font-bold">
        <span>{card.atk}</span>
        <span>{card.hp}</span>
      </footer>
    </article>
  );
}
