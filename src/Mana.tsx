import { cn } from "./lib/utils.ts";
import { ManaIcon } from "./icons.tsx";

/** A row of mana pips: `mana` filled crystals out of `max`. Filled pips read as
 *  spendable this turn; empty ones are the ceiling already used up. */
export default function Mana({
  mana,
  max,
  className,
}: {
  mana: number;
  max: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex gap-1.5", className)}
      aria-label={`Mana ${mana} of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <ManaIcon
          key={i}
          // Filled while within the current mana, hollow once spent.
          className={cn(
            "border border-ink",
            i < mana ? "bg-ink" : "bg-transparent",
          )}
        />
      ))}
    </div>
  );
}
