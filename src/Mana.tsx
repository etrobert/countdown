import { cn } from "./lib/utils.ts";
import { ManaIcon } from "./icons.tsx";

/** A row of mana pips: `mana` filled crystals out of `max`. Filled pips read as
 *  spendable this turn; empty ones are the ceiling already used up.
 *
 *  `flash` pulses the whole bar red once — set it when the player tries to play
 *  a card they can't afford. `onFlashEnd` fires when the pulse finishes; the
 *  owner should clear `flash` there, so crystals added later (the ceiling grows
 *  each round) don't mount mid-flash and pulse. */
export default function Mana({
  mana,
  max,
  className,
  flash = false,
  onFlashEnd,
}: {
  mana: number;
  max: number;
  className?: string;
  flash?: boolean;
  onFlashEnd?: () => void;
}) {
  return (
    <div
      className={cn("flex gap-1.5", className)}
      aria-label={`Mana ${mana} of ${max}`}
      onAnimationEnd={onFlashEnd}
    >
      {Array.from({ length: max }, (_, i) => (
        <ManaIcon
          key={i}
          // Filled while within the current mana, hollow once spent; flashes
          // red on a failed play.
          className={cn(
            "border border-ink",
            i < mana ? "bg-ink" : "bg-transparent",
            flash && "animate-mana-flash",
          )}
        />
      ))}
    </div>
  );
}
