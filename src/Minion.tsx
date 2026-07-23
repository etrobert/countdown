import Card from "./Card.tsx";
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
    // Same uid-keyed transition name as the card in hand, so playing it morphs
    // the card onto the board, and later moves/deaths animate too.
    <div
      className="group relative flex size-full flex-col"
      style={{ viewTransitionName: `card-${minion.uid}` }}
    >
      {/* Hover to inspect: the minion's full card pops to the right, centered
          on the cell so the taller card straddles the minion's row. Kept out of
          hit-testing and the a11y tree — it only enlarges what the footer and
          art already show. The cell drops pointer-events mid-drag (see Board),
          which stops :hover firing so previews stay out of the drop flow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-full z-40 ml-2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      >
        <Card card={card} hp={minion.hp} />
      </div>
      {/* Summoned this turn: it sits still and sleeps. A trio of drifting z's
          signals it can't advance yet — it wakes on its owner's next turn. */}
      {minion.summoned && (
        <div
          className="pointer-events-none absolute -top-1 right-0.5 flex items-start text-edge"
          aria-label="Resting — summoned this turn"
        >
          {[0, 0.8, 1.6].map((delay, i) => (
            <span
              key={i}
              className="animate-zzz font-serif font-bold italic leading-none"
              style={{
                animationDelay: `${delay}s`,
                fontSize: `${0.5 + i * 0.15}rem`,
              }}
            >
              z
            </span>
          ))}
        </div>
      )}
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
