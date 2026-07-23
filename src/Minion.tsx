import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";
import { CLASH_LUNGE_PX, CLASH_MS, CONTACT_MS, MILL_MS, RECOIL_PX } from "./anim.ts";
import { CARDS } from "./balance.ts";
import { HeartIcon, SwordIcon } from "./icons.tsx";
import { cn } from "./lib/utils.ts";
import type { Minion as MinionData } from "./state.ts";

declare module "react" {
  interface CSSProperties {
    /** Wind-up / strike offsets fed to the attack keyframes (see style.css). */
    "--recoil-x"?: string;
    "--recoil-y"?: string;
    "--lunge-x"?: string;
    "--lunge-y"?: string;
  }
}

/** The blow a minion is playing this beat, or undefined when it just stands.
 *  `clash`: trades with an adjacent enemy — `dir` is its facing (+1 / -1) and
 *  `dies` picks the settle-home or hold-and-vanish keyframe. `mill`: charges the
 *  enemy deck; `deckRef` points at that deck so the dash can be aimed along the
 *  live on-screen diagonal. */
export type MinionAttack =
  | { kind: "clash"; dir: number; dies: boolean }
  | { kind: "mill"; deckRef: RefObject<HTMLElement | null> };

export default function Minion({
  minion,
  attack,
}: {
  minion: MinionData;
  attack?: MinionAttack;
}) {
  const card = CARDS[minion.card];
  const rootRef = useRef<HTMLDivElement>(null);

  // A mill dash aims at wherever the target deck sits on screen right now, so
  // its vector is measured rather than authored: the diagonal to the deck's
  // centre becomes the strike, a short step back along it the wind-up. Set in a
  // layout effect (before paint) so the very first animated frame is aimed.
  useLayoutEffect(() => {
    if (attack?.kind !== "mill") return;
    const el = rootRef.current;
    const deck = attack.deckRef.current;
    if (!el || !deck) return;
    const me = el.getBoundingClientRect();
    const to = deck.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (me.left + me.width / 2);
    const dy = to.top + to.height / 2 - (me.top + me.height / 2);
    const len = Math.hypot(dx, dy) || 1;
    el.style.setProperty("--lunge-x", `${dx}px`);
    el.style.setProperty("--lunge-y", `${dy}px`);
    el.style.setProperty("--recoil-x", `${(-dx / len) * RECOIL_PX}px`);
    el.style.setProperty("--recoil-y", `${(-dy / len) * RECOIL_PX}px`);
  }, [attack]);

  // The sketches are drawn facing right, which is the way your minions (seat 0)
  // advance. Anyone across the board walks the other way, so mirror their art
  // to face left. Only the art flips — the ATK/HP footer stays readable.
  const facingLeft = minion.owner !== 0;

  // Attack styling: which keyframe to run and for how long, plus — for a clash
  // — the fixed horizontal wind-up/strike offsets. A mill's offsets are written
  // by the layout effect above, so none are set inline for it.
  const animStyle: CSSProperties | undefined = attack && {
    animationFillMode: "both",
    ...(attack.kind === "clash"
      ? {
          animationName: attack.dies ? "clash-kill" : "clash-strike",
          animationDuration: `${CLASH_MS}ms`,
          "--recoil-x": `${-attack.dir * RECOIL_PX}px`,
          "--lunge-x": `${attack.dir * CLASH_LUNGE_PX}px`,
        }
      : { animationName: "mill-dash", animationDuration: `${MILL_MS}ms` }),
  };

  return (
    <div
      ref={rootRef}
      className="relative flex size-full flex-col"
      style={animStyle}
    >
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
      {/* Impact cue on a struck minion: a red wash over the body, held off
          until the strike lands (see the keyframe delay). Only a clash lands a
          blow on a minion. */}
      {attack?.kind === "clash" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md bg-red-500"
          style={{ animation: `hit-flash 220ms ${CONTACT_MS}ms both` }}
        />
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
