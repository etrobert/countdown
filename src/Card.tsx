import type { Card as CardData } from "./balance.ts";
import { BootIcon, HeartIcon, ManaIcon, SwordIcon } from "./icons.tsx";

export default function Card({
  card,
  hp,
}: {
  card: CardData;
  /** Live health, when the card stands for a minion on the board. Below the
   *  printed max it reads as current/max; equal (or omitted, as in hand) shows
   *  the plain printed number. */
  hp?: number;
}) {
  const wounded = hp !== undefined && hp < card.hp;
  return (
    <article className="grid h-[var(--card-h)] w-[var(--card-w)] grid-rows-[auto_1fr_auto] rounded-md border border-ink bg-face p-2.5 shadow-md">
      <span
        // gap-1.5, not the footer's gap-1: the rotated crystal overflows its
        // box at the corners and eats into the gap.
        className="flex items-center gap-1.5 justify-self-start font-bold"
        aria-label={`Cost ${card.cost}`}
      >
        <ManaIcon />
        {card.cost}
      </span>
      <div className="flex min-h-0 flex-col items-center justify-end gap-1">
        {/* Fit each sketch to the shared art box (object-contain) so every
            creature reads at a comparable size regardless of its source
            canvas — a single global zoom applied to raw pixels made tall
            creatures dwarf short ones. object-bottom keeps a common ground
            line; multiply drops the sketch's paper out against the card
            face. */}
        <img
          src={card.art}
          alt={card.name}
          className="min-h-0 w-full flex-1 rounded-sm object-contain object-bottom mix-blend-multiply"
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
          aria-label={`Movement ${card.movement}`}
        >
          <BootIcon />
          {card.movement}
        </span>
        <span
          className="flex items-center gap-1"
          aria-label={`Health ${wounded ? `${hp} of ${card.hp}` : card.hp}`}
        >
          <HeartIcon />
          {wounded ? (
            <span>
              <span className="text-red-700">{hp}</span>
              <span>/{card.hp}</span>
            </span>
          ) : (
            card.hp
          )}
        </span>
      </footer>
    </article>
  );
}
