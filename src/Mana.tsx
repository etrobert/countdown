import { cn } from "./lib/utils.ts";
import { ManaIcon } from "./icons.tsx";
import { effectiveMaxMana, manaBonus, type GameState } from "./state.ts";

/** A player's row of mana pips, derived from the game state: one pip per
 *  crystal of their ceiling, filled while still spendable this turn, hollow
 *  once spent.
 *
 *  The last pips are the wizard bonus — tinted teal, like the wizard's robe,
 *  so the player can tie them to the aura granting them.
 *
 *  `flash` pulses the whole bar red once — set it when the player tries to play
 *  a card they can't afford. `onFlashEnd` fires when the pulse finishes; the
 *  owner should clear `flash` there, so crystals added later (the ceiling grows
 *  each round) don't mount mid-flash and pulse. */
export default function Mana({
  state,
  playerIndex,
  className,
  flash = false,
  onFlashEnd,
}: {
  state: GameState;
  playerIndex: number;
  className?: string;
  flash?: boolean;
  onFlashEnd?: () => void;
}) {
  const { mana } = state.players[playerIndex];
  const max = effectiveMaxMana(state, playerIndex);
  const bonus = manaBonus(state, playerIndex);
  return (
    <div
      className={cn("flex gap-1.5", className)}
      aria-label={`Mana ${mana} of ${max}`}
      onAnimationEnd={onFlashEnd}
    >
      {Array.from({ length: max }, (_, i) => {
        const wizard = i >= max - bonus;
        return (
          <ManaIcon
            key={i}
            // Filled while within the current mana, hollow once spent; flashes
            // red on a failed play.
            className={cn(
              "border",
              wizard ? "border-teal-600" : "border-ink",
              i < mana ? (wizard ? "bg-teal-500" : "bg-ink") : "bg-transparent",
              flash && "animate-mana-flash",
            )}
          />
        );
      })}
    </div>
  );
}
