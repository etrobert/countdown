import { useState } from "react";
import { flushSync } from "react-dom";
import Board from "./Board.tsx";
import Card from "./Card.tsx";
import Deck from "./Deck.tsx";
import Hand from "./Hand.tsx";
import Mana from "./Mana.tsx";
import { CARDS } from "./balance.ts";
import { useDrag } from "./drag.ts";
import { cn } from "./lib/utils.ts";
import { playSummonSound } from "./sound.ts";
import { chooseSummon, endTurn, initialState, play } from "./state.ts";

// Seats. The local player's hand is face-up and draggable; the enemy's is a row
// of card backs. Only two seats today — the board is two-sided — but GameState
// holds a list, so adding more later is a layout problem, not a state one.
const YOU = 0;
const ENEMY = 1;

/** Applies a state update inside a View Transition when the browser supports
 *  one. Every card and minion carries a stable `view-transition-name` keyed by
 *  its uid, so the browser snapshots each one's old and new box and animates
 *  the difference — a drawn card slides from the deck into the hand, a played
 *  card from the hand onto the board, with no measurement code of our own.
 *  `flushSync` forces React to apply the update synchronously, which is the
 *  DOM change the transition captures. */
function withViewTransition(update: () => void) {
  if (!document.startViewTransition) return update();
  document.startViewTransition(() => flushSync(update));
}

/** A promise that resolves after `ms`, so turn beats can be spaced out with
 *  plain `await` instead of nested timeout callbacks. */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  const [state, setState] = useState(initialState);
  const { drag, dragUid, start } = useDrag(state, setState, YOU);

  const you = state.players[YOU];
  const enemy = state.players[ENEMY];
  const yourTurn = state.activePlayerIndex === YOU;

  // End the human's turn, then drive the enemy's one beat at a time so the
  // player can follow along: passing the turn draws for the enemy, then after a
  // second it summons a minion, and a second later it ends its own turn back to
  // you. Each beat is computed from the previous one with the pure state
  // functions — the closure's `state` is only fresh at click time — which is
  // also how the enemy's pick surfaces here to sound its clip. The plain
  // setState calls overwrite anything landing mid-sequence, so a card played
  // during the enemy's turn would be lost (playing off-turn is due to be
  // blocked anyway).
  async function handleEndTurn() {
    const afterEnd = endTurn(state);
    withViewTransition(() => setState(afterEnd));
    await sleep(1000);
    const choice = chooseSummon(afterEnd, ENEMY);
    const afterSummon = choice
      ? play(afterEnd, ENEMY, choice.uid, choice.lane)
      : afterEnd;
    if (choice) {
      withViewTransition(() => setState(afterSummon));
      playSummonSound(choice.card);
    }
    await sleep(1000);
    withViewTransition(() => setState(endTurn(afterSummon)));
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
          <Deck
            count={you.deck.length}
            topUid={you.deck[0]?.uid}
            className="relative"
          />
          <Mana mana={you.mana} max={you.maxMana} />
        </div>
        <Board
          minions={state.minions}
          dragging={drag !== null}
          dragLane={drag?.lane ?? null}
        />
        <div className="grid justify-items-center gap-3">
          <Deck
            count={enemy.deck.length}
            topUid={enemy.deck[0]?.uid}
            className="relative"
          />
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
