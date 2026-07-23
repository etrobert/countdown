import { useState } from "react";
import Board from "./Board.tsx";
import Card from "./Card.tsx";
import Deck from "./Deck.tsx";
import Hand from "./Hand.tsx";
import Mana from "./Mana.tsx";
import { CARDS } from "./balance.ts";
import { useDrag } from "./drag.ts";
import { cn } from "./lib/utils.ts";
import { endTurn, initialState, summonMinion } from "./state.ts";

// Seats. The local player's hand is face-up and draggable; the enemy's is a row
// of card backs. Only two seats today — the board is two-sided — but GameState
// holds a list, so adding more later is a layout problem, not a state one.
const YOU = 0;
const ENEMY = 1;

export default function App() {
  const [state, setState] = useState(initialState);
  const { drag, dragUid, start } = useDrag(state, setState, YOU);

  const you = state.players[YOU];
  const enemy = state.players[ENEMY];
  const yourTurn = state.activePlayerIndex === YOU;

  // End the human's turn, then drive the enemy's: it summons a minion (its turn
  // already drew for it), and after a pause so the player can watch, ends its
  // own turn back to you.
  function handleEndTurn() {
    setState((state) => summonMinion(endTurn(state), ENEMY));
    setTimeout(() => setState(endTurn), 2000);
  }

  return (
    <main
      className={cn(
        "relative grid min-h-screen grid-rows-[auto_1fr_auto] justify-items-center bg-parchment text-ink",
        drag && "cursor-grabbing select-none",
      )}
    >
      <Hand cards={enemy.hand} faceDown />
      {/* Decks flank the board at the ends they defend: yours on the left,
          where your minions spawn and march right; the enemy's on the right.
          Each deck's mana bar sits just below its stack. */}
      <div className="flex items-center gap-8">
        <div className="grid justify-items-center gap-3">
          <Deck count={you.deck.length} className="relative" />
          <Mana mana={you.mana} max={you.maxMana} />
        </div>
        <Board
          minions={state.minions}
          dragging={drag !== null}
          dragLane={drag?.lane ?? null}
        />
        <div className="grid justify-items-center gap-3">
          <Deck count={enemy.deck.length} className="relative" />
          <Mana mana={enemy.mana} max={enemy.maxMana} />
        </div>
      </div>
      <Hand cards={you.hand} dragging={dragUid} onDragStart={start} />
      <div className="absolute right-10 bottom-28 text-right font-bold text-ink">
        {yourTurn ? "Your turn" : "Enemy turn"}
      </div>
      <button
        type="button"
        onClick={handleEndTurn}
        disabled={!yourTurn}
        className={cn(
          "absolute right-10 bottom-12 rounded-md bg-ink px-4 py-2 font-bold text-parchment transition-transform duration-150",
          yourTurn
            ? "cursor-pointer hover:-translate-y-1"
            : "cursor-not-allowed opacity-40",
        )}
      >
        End Turn
      </button>
      {drag && (
        // Follows the pointer and stays out of hit-testing so lanes underneath
        // register the hover and drop.
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rotate-0 scale-105"
          style={{ left: drag.x, top: drag.y }}
        >
          <Card card={CARDS[drag.instance.card]} />
        </div>
      )}
    </main>
  );
}
