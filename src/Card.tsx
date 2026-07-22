import type { Card as CardData } from "./balance.ts";
import { HeartIcon, SwordIcon } from "./icons.tsx";

export default function Card({ card }: { card: CardData }) {
  return (
    <article className="grid h-[var(--card-h)] w-[var(--card-w)] grid-rows-[auto_1fr_auto] rounded-md border border-ink bg-face p-2.5 shadow-md">
      <span className="justify-self-start font-bold">{card.cost}</span>
      <div className="flex min-h-0 flex-col justify-center gap-1">
        {card.art && (
          // multiply drops the sketch's paper out against the card face.
          <img
            src={card.art}
            alt={card.name}
            className="min-h-0 w-full flex-1 rounded-sm object-cover mix-blend-multiply"
          />
        )}
        <h2 className="text-center text-lg font-bold">{card.name}</h2>
      </div>
      <footer className="flex justify-between font-bold">
        <span
          className="flex items-center gap-1"
          aria-label={`Attack ${card.atk}`}
        >
          <SwordIcon />
          {card.atk}
        </span>
        <span
          className="flex items-center gap-1"
          aria-label={`Health ${card.hp}`}
        >
          <HeartIcon />
          {card.hp}
        </span>
      </footer>
    </article>
  );
}
