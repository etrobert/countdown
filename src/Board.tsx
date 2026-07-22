import { LANES, LANE_CELLS } from "./balance.ts";
import MinionView from "./Minion.tsx";
import type { Minion } from "./state.ts";

export default function Board({
  minions,
  selecting,
  onPlayLane,
}: {
  minions: Minion[];
  selecting: boolean;
  onPlayLane: (lane: number) => void;
}) {
  const at = (lane: number, cell: number) =>
    minions.find((m) => m.lane === lane && m.cell === cell);

  return (
    <div className="flex gap-3 self-center">
      {Array.from({ length: LANES }, (_, lane) => {
        // A card arrives at cell 0, so a full entry cell blocks the whole lane.
        const playable = selecting && !at(lane, 0);
        return (
          <button
            key={lane}
            type="button"
            disabled={!playable}
            onClick={() => onPlayLane(lane)}
            aria-label={`Play into lane ${lane + 1}`}
            // Reversed so cell 0 sits nearest you — a minion you summon enters
            // there and walks upward toward the far end.
            className={`flex flex-col-reverse gap-2 rounded-lg p-1 transition-colors ${
              playable ? "cursor-pointer bg-ink/8" : "cursor-default"
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
          </button>
        );
      })}
    </div>
  );
}
