import { CARDS } from "./balance.ts";
import { HeartIcon, SwordIcon } from "./icons.tsx";
import { cn } from "./lib/utils.ts";
import type { Minion as MinionData } from "./state.ts";

export default function Minion({ minion }: { minion: MinionData }) {
  const card = CARDS[minion.card];
  // The sketches are drawn facing right, which is the way your minions (seat 0)
  // advance. Anyone across the board walks the other way, so mirror their art
  // to face left. Only the art flips — the ATK/HP footer stays readable.
  const facingLeft = minion.owner !== 0;
  return (
    <div className="relative flex size-full flex-col">
      <div className="flex min-h-0 flex-1 items-end justify-center">
        {/* One shared zoom on each sketch's own pixels, and NO per-image max
            clamp — that clamp is what would flatten every crop to the cell and
            kill the relative scale. Kept off, the crops keep their drawn sizes:
            saper stays smaller, the hydra towers past its cell. Stood on the
            tile floor (items-end) for a common ground line; multiply drops the
            paper out. */}
        <img
          src={card.art}
          alt={card.name}
          className={cn(
            "mix-blend-multiply [zoom:0.08]",
            facingLeft && "-scale-x-100",
          )}
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
