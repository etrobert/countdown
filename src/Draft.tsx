import { useState } from "react";
import Card from "./Card.tsx";
import { CARD_IDS, CARDS, DRAFT_CHOICES, type CardId } from "./balance.ts";

/** Rolls a draft offer: DRAFT_CHOICES distinct cards drawn from the pool. */
function rollDraft(): CardId[] {
  const pool = [...CARD_IDS];
  return Array.from(
    { length: DRAFT_CHOICES },
    () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0],
  );
}

/** The between-battles draft screen: pick one of the offered cards to add to
 *  the run deck, or pass to keep it as it is. Either way the next battle
 *  starts immediately. The offer is rolled once when the screen mounts and
 *  lives here — App only needs the outcome. */
export default function Draft({
  onPick,
  onPass,
}: {
  onPick: (card: CardId) => void;
  onPass: () => void;
}) {
  const [choices] = useState(rollDraft);

  return (
    <main className="grid min-h-screen place-items-center bg-parchment text-ink">
      <div className="grid justify-items-center gap-8">
        <h1 className="font-bold text-4xl">Add a card to your deck</h1>
        <div className="flex gap-6">
          {choices.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className="cursor-pointer transition-transform duration-150 hover:-translate-y-1"
            >
              <Card card={CARDS[id]} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onPass}
          className="cursor-pointer rounded-md bg-ink px-4 py-2 font-bold text-parchment transition-transform duration-150 hover:-translate-y-1"
        >
          Pass
        </button>
      </div>
    </main>
  );
}
