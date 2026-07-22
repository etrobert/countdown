import { CARDS, type Card } from "./balance.ts";
import { HeartIcon, SwordIcon } from "./icons.tsx";
import type { Minion as MinionData } from "./state.ts";

export default function Minion({ minion }: { minion: MinionData }) {
  // Annotated because `satisfies` gives CARDS the literal entry types, and
  // entries without art have no `art` property at all to narrow against.
  const card: Card = CARDS[minion.card];
  return (
    <div className="relative flex size-full flex-col overflow-hidden rounded-md border border-ink bg-face p-1 shadow-md">
      {card.art ? (
        // Fills the tile and stands in for the name, so it carries the label.
        <img
          src={card.art}
          alt={card.name}
          className="absolute inset-0 size-full object-cover mix-blend-multiply"
        />
      ) : (
        <span className="truncate text-center text-xs font-bold">
          {card.name}
        </span>
      )}
      {/* `relative` lifts the stats above the absolutely-placed art; `mt-auto`
          holds them at the bottom whether or not a name renders above. */}
      <footer className="relative mt-auto flex justify-between text-xs font-bold">
        <span
          className="flex items-center gap-0.5"
          aria-label={`Attack ${card.atk}`}
        >
          <SwordIcon className="size-3" />
          {card.atk}
        </span>
        <span
          className="flex items-center gap-0.5"
          aria-label={`Health ${minion.hp}`}
        >
          <HeartIcon className="size-3" />
          {minion.hp}
        </span>
      </footer>
    </div>
  );
}
