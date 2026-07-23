import type { Ref } from "react";
import { cn } from "./lib/utils.ts";

declare module "react" {
  interface CSSProperties {
    /** Position of a back within the stack, 0 at the bottom. */
    "--depth"?: number;
  }
}

export default function Deck({
  count,
  onDraw,
  className,
  ref,
}: {
  count: number;
  /** Omitted for the enemy deck, which is shown but not drawn from here. */
  onDraw?: () => void;
  className?: string;
  /** The stack element, so the hand can fly a drawn card in from here. */
  ref?: Ref<HTMLButtonElement>;
}) {
  const interactive = onDraw !== undefined;
  return (
    <button
      ref={ref}
      type="button"
      onClick={onDraw}
      disabled={!interactive || count === 0}
      aria-label={`${interactive ? "Draw a card" : "Enemy deck"} — ${count} left`}
      className={cn(
        "absolute h-[var(--card-h)] w-[var(--card-w)]",
        interactive
          ? "cursor-pointer transition-transform duration-150 hover:-translate-y-1 disabled:cursor-default disabled:hover:translate-y-0"
          : "cursor-default",
        className,
      )}
    >
      {/* Each back sits slightly above and right of the one below, and
          carries a pale edge so the seams read against the dark face —
          otherwise the stack looks like a single flat card. */}
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="card-back absolute inset-0 translate-x-[calc(var(--depth)*0.5px)] translate-y-[calc(var(--depth)*-3px)] rounded-md border border-edge"
          style={{ "--depth": i }}
        />
      ))}
      {/* The count is the countdown itself — your remaining life. It reads as
          the deck's face: large, centered on the topmost card, so it carries
          the same depth offset as that card rather than the base of the stack. */}
      <span
        className="absolute inset-0 flex translate-x-[calc(var(--depth)*0.5px)] translate-y-[calc(var(--depth)*-3px)] items-center justify-center text-6xl font-bold text-white tabular-nums text-shadow-lg"
        style={{ "--depth": Math.max(count - 1, 0) }}
      >
        {count}
      </span>
    </button>
  );
}
