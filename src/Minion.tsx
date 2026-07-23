import { CARDS } from "./balance.ts";
import { HeartIcon, SwordIcon } from "./icons.tsx";
import type { Minion as MinionData } from "./state.ts";

export default function Minion({ minion }: { minion: MinionData }) {
  const card = CARDS[minion.card];
  return (
    <div className="relative flex size-full flex-col overflow-hidden rounded-md border border-ink bg-face p-1 shadow-md">
      <div className="flex min-h-0 flex-1 items-end justify-center">
        {/* Sized to a fraction of the sketch's own pixels and stood on the
            tile floor, so the compressed relative scale reads on the board —
            a goblin barely fills its cell, a hydra towers. It stands in for
            the name, carrying the label; multiply drops the paper out. */}
        <img
          src={card.art}
          alt={card.name}
          className="max-h-full max-w-full mix-blend-multiply [zoom:0.24]"
        />
      </div>
      <footer className="relative flex justify-between text-xs font-bold">
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
