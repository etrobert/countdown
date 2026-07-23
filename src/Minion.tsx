import type { CSSProperties } from "react";
import Card from "./Card.tsx";
import { CARDS } from "./balance.ts";
import { HeartIcon, SwordIcon } from "./icons.tsx";
import { cn } from "./lib/utils.ts";
import type { Minion as MinionData } from "./state.ts";

declare module "react" {
  interface CSSProperties {
    /** Facing (+1 / -1) fed to the attack keyframes (see style.css). */
    "--dir"?: number;
  }
}

/** Full attack animation: ~130ms wind-up, ~90ms strike, ~180ms settle. The
 *  keyframes in `style.css` hold the segment ratios and distances; this sets
 *  the wall-clock. Also how long the board is held before the outcome commits
 *  (see App), so nothing is cut off mid-blow. This is motion feel, not game
 *  balance, so it lives here rather than in `balance.ts`. */
export const CLASH_MS = 400;

/** The blow a minion is playing this beat — its facing (+1 / -1), toward the
 *  enemy it clashes with or the deck it raids — or undefined when it just
 *  stands. The same bump plays whether the minion survives the beat or not; a
 *  dead clasher or a spent raider is just gone once the outcome commits. */
export type MinionAttack = number;

export default function Minion({
  minion,
  attack,
}: {
  minion: MinionData;
  attack?: MinionAttack;
}) {
  const card = CARDS[minion.card];
  // Once a minion has taken damage its current HP drops below the card's
  // printed HP — flag it so the health readout can warn in red.
  const damaged = minion.hp < card.hp;
  // The sketches are drawn facing right, which is the way your minions (seat 0)
  // advance. Anyone across the board walks the other way, so mirror their art
  // to face left. Only the art flips — the ATK/HP footer stays readable.
  const facingLeft = minion.owner !== 0;

  // The uid-keyed transition name (so plays/moves/deaths morph) rides on the
  // root; when this minion is attacking, the same element also runs the bump —
  // its facing sets the direction the keyframe strikes toward.
  const style: CSSProperties = {
    viewTransitionName: `card-${minion.uid}`,
    ...(attack !== undefined && {
      animationName: "clash-strike",
      animationDuration: `${CLASH_MS}ms`,
      animationFillMode: "both",
      "--dir": attack,
    }),
  };

  return (
    // The uid-keyed view-transition-name makes this root its own stacking
    // context, so the preview's z-40 can't escape it — minions later in DOM
    // order would paint over the popped card. Raising the whole root on hover
    // lifts the preview above the other creatures instead.
    <div
      className="group relative flex size-full flex-col hover:z-10"
      style={style}
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
            paper out. During an attack the sketch also runs hit-flash — a
            filter whitening it at the moment of contact, the art's own alpha
            keeping it the body's shape. */}
        <img
          src={card.art}
          alt={card.name}
          className={cn(
            "mix-blend-multiply [zoom:0.08]",
            facingLeft && "-scale-x-100",
          )}
          style={
            attack !== undefined
              ? { animation: `hit-flash ${CLASH_MS}ms both` }
              : undefined
          }
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
          className={cn("flex items-center gap-0.5", damaged && "text-red-600")}
          aria-label={`Health ${minion.hp}`}
        >
          <HeartIcon className="size-3" />
          {minion.hp}
        </span>
      </footer>
    </div>
  );
}
