import type { Card as CardData } from "./balance.ts";
import { HeartIcon, SwordIcon } from "./icons.tsx";

export default function Card({ card }: { card: CardData }) {
  return (
    <article className="grid h-[var(--card-h)] w-[var(--card-w)] grid-rows-[auto_1fr_auto] rounded-md border border-ink bg-face p-2.5 shadow-md">
      <span className="justify-self-start font-bold">{card.cost}</span>
      <div className="flex min-h-0 flex-col items-center justify-end gap-1">
        {/* One shared zoom on each sketch's own pixels, with NO per-image max
            clamp — the clamp would flatten every crop to the frame and kill the
            relative scale (saper smaller, hydra huge). Bottom-aligned by the
            column's justify-end for a common ground line; multiply drops the
            sketch's paper out against the card face. */}
        <img
          src={card.art}
          alt={card.name}
          className="rounded-sm mix-blend-multiply [zoom:0.09]"
        />
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
