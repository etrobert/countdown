import { LANES, LANE_CELLS } from "./balance.ts";

export default function Board() {
  return (
    <div className="flex gap-3 self-center">
      {Array.from({ length: LANES }, (_, lane) => (
        // Reversed so cell 0 sits nearest you — a minion you summon enters
        // there and walks upward toward the far end.
        <div key={lane} className="flex flex-col-reverse gap-2">
          {Array.from({ length: LANE_CELLS }, (_, cell) => (
            <div
              key={cell}
              className="size-16 rounded-md border border-dashed border-ink/25"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
