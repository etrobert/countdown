import { useState } from "react";
import Card from "./Card.tsx";
import { CARDS, REMOVE_LIMIT, type CardId } from "./balance.ts";
import { cn } from "./lib/utils.ts";

/** The between-battles remove step, second half of the draft: cut up to
 *  REMOVE_LIMIT cards from the run deck, or none, then start the next battle.
 *  Cards are marked by position, not id — the deck holds duplicate ids, so each
 *  copy is cut on its own. */
export default function Remove({
  deck,
  onConfirm,
}: {
  deck: CardId[];
  onConfirm: (kept: CardId[]) => void;
}) {
  const [marked, setMarked] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else if (next.size < REMOVE_LIMIT) next.add(index);
      return next;
    });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-parchment text-ink">
      <div className="grid justify-items-center gap-8 p-8">
        <h1 className="font-bold text-4xl">Remove up to {REMOVE_LIMIT} cards</h1>
        <p className="font-bold">
          {marked.size} / {REMOVE_LIMIT} marked
        </p>
        <div className="flex max-w-6xl flex-wrap justify-center gap-6">
          {deck.map((id, index) => {
            const cut = marked.has(index);
            // Once the cap is reached, the unmarked cards can't be marked — they
            // read as disabled until you free a slot.
            const locked = !cut && marked.size >= REMOVE_LIMIT;
            return (
              <button
                // Index as key: the deck order is fixed for this step, so an
                // index is a stable handle even across duplicate ids.
                key={index}
                type="button"
                onClick={() => toggle(index)}
                disabled={locked}
                className={cn(
                  "rounded-md transition-transform duration-150",
                  cut && "opacity-50 ring-4 ring-red-700",
                  locked
                    ? "cursor-not-allowed opacity-40"
                    : "cursor-pointer hover:-translate-y-1",
                )}
              >
                <Card card={CARDS[id]} />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onConfirm(deck.filter((_, i) => !marked.has(i)))}
          className="cursor-pointer rounded-md bg-ink px-4 py-2 font-bold text-parchment transition-transform duration-150 hover:-translate-y-1"
        >
          {marked.size === 0
            ? "Start next battle"
            : `Remove ${marked.size} and start`}
        </button>
      </div>
    </main>
  );
}
