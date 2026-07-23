import { LANES, LANE_CELLS } from "./balance.ts";
import MinionView, { type MinionAttack } from "./Minion.tsx";
import { cn } from "./lib/utils.ts";
import type { Minion } from "./state.ts";

export default function Board({
  minions,
  attacks,
  dragging,
  dragLane,
}: {
  minions: Minion[];
  /** The blow each minion is playing this beat, keyed by uid — empty when the
   *  board is at rest. Drives the attack animation (see `Minion`). */
  attacks?: Map<number, MinionAttack>;
  /** True while a card is being dragged, so valid lanes light up. */
  dragging: boolean;
  /** The playable lane under the pointer, highlighted as the drop target. */
  dragLane: number | null;
}) {
  const at = (lane: number, cell: number) =>
    minions.find((m) => m.lane === lane && m.cell === cell);

  return (
    // Lanes run horizontally and stack vertically: yours advance left to right,
    // theirs right to left.
    <div className="flex flex-col gap-1 self-center">
      {Array.from({ length: LANES }, (_, lane) => {
        // A card arrives at cell 0, so a full entry cell blocks the whole lane.
        const playable = dragging && !at(lane, 0);
        const targeted = dragLane === lane;
        return (
          // `data-lane` lets the drag resolve which lane the pointer is over.
          <div
            key={lane}
            data-lane={lane}
            // Cell 0 is leftmost — a minion you summon enters there and walks
            // rightward toward the far end.
            className={`flex gap-2 rounded-lg p-1 transition-colors ${
              targeted ? "bg-ink/15" : playable ? "bg-ink/8" : ""
            }`}
          >
            {Array.from({ length: LANE_CELLS }, (_, cell) => {
              const minion = at(lane, cell);
              // The cell is only as tall as the lane strip — the empty dashed
              // box shows that height. A minion keeps the same footprint (so
              // landing one never resizes the row) but its taller art is
              // bottom-anchored and unclamped, so it overflows upward and draws
              // on top of the lane above.
              return (
                <div
                  key={cell}
                  // Mid-drag the cell drops pointer-events so the minion's
                  // hover preview (see Minion) can't pop over the drop target;
                  // lane resolution walks the DOM upward, so it is unaffected.
                  className={cn(
                    "h-14 w-20 rounded-md",
                    !minion && "border border-dashed border-ink/25",
                    dragging && minion && "pointer-events-none",
                  )}
                >
                  {minion && (
                    <MinionView
                      minion={minion}
                      attack={attacks?.get(minion.uid)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
