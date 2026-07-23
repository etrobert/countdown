import { useState } from "react";
import Board from "./Board.tsx";
import Card from "./Card.tsx";
import Deck from "./Deck.tsx";
import Hand from "./Hand.tsx";
import { CARDS } from "./balance.ts";
import { useDrag } from "./drag.ts";
import { cn } from "./lib/utils.ts";
import { draw, endTurn, initialState } from "./state.ts";

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

  return (
    <main
      className={cn(
        "relative grid min-h-screen grid-rows-[auto_1fr_auto] justify-items-center bg-parchment text-ink",
        drag && "cursor-grabbing select-none",
      )}
    >
      <Hand cards={enemy.hand} faceDown />
      <Board
        minions={state.minions}
        dragging={drag !== null}
        dragLane={drag?.lane ?? null}
      />
      <Hand cards={you.hand} dragging={dragUid} onDragStart={start} />
      <Deck
        count={you.deck.length}
        onDraw={() => setState((s) => draw(s, YOU))}
        className="right-10 bottom-12"
      />
      <Deck count={enemy.deck.length} className="top-12 left-10" />
      <button
        type="button"
        onClick={() => setState(endTurn)}
        className="absolute bottom-12 left-10 cursor-pointer rounded-md bg-ink px-4 py-2 font-bold text-parchment transition-transform duration-150 hover:-translate-y-1"
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
