import { CARDS } from "./balance.ts";
import { HeartIcon, SwordIcon } from "./icons.tsx";
import type { Minion as MinionData } from "./state.ts";

export default function Minion({ minion }: { minion: MinionData }) {
  const card = CARDS[minion.card];
  return (
    <div className="grid size-full grid-rows-[1fr_auto] rounded-md border border-ink bg-face p-1 shadow-md">
      <span className="self-center truncate text-center text-xs font-bold">
        {card.name}
      </span>
      <footer className="flex justify-between text-xs font-bold">
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
