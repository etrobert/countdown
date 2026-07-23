import { LANES, LANE_CELLS } from "./balance.ts";
import MinionView from "./Minion.tsx";
import type { Minion } from "./state.ts";

export default function Board({
  minions,
  dragging,
  dragLane,
}: {
  minions: Minion[];
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
    <div className="flex flex-col gap-3 self-center">
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
              return (
                <div
                  key={cell}
                  className={`size-20 rounded-md ${
                    minion ? "" : "border border-dashed border-ink/25"
                  }`}
                >
                  {minion && <MinionView minion={minion} />}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
