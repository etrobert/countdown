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
  /** The root, so a mill dash can measure where this deck sits on screen. */
  ref?: Ref<HTMLDivElement>;
}) {
  const interactive = onDraw !== undefined;
  return (
    <div
      ref={ref}
      className={cn("absolute grid justify-items-center gap-3", className)}
    >
      <button
        type="button"
        onClick={onDraw}
        disabled={!interactive || count === 0}
        aria-label={`${interactive ? "Draw a card" : "Enemy deck"} — ${count} left`}
        className={cn(
          "relative h-[var(--card-h)] w-[var(--card-w)]",
          interactive
            ? "cursor-pointer transition-transform duration-150 hover:-translate-y-1 disabled:cursor-default disabled:hover:translate-y-0"
            : "cursor-default",
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
      </button>
      <span className="font-bold tabular-nums">{count}</span>
    </div>
  );
}
