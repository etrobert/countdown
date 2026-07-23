import { useRef, useState } from "react";
import Board from "./Board.tsx";
import Card from "./Card.tsx";
import Deck from "./Deck.tsx";
import Hand from "./Hand.tsx";
import type { MinionAttack } from "./Minion.tsx";
import Mana from "./Mana.tsx";
import { COMBAT_MS, ENEMY_PAUSE } from "./anim.ts";
import { CARDS } from "./balance.ts";
import { useDrag } from "./drag.ts";
import { cn } from "./lib/utils.ts";
import {
  draw,
  initialState,
  resolveTurn,
  step,
  summonMinion,
  type CombatEvent,
  type GameState,
  type Minion,
} from "./state.ts";

// Seats. The local player's hand is face-up and draggable; the enemy's is a row
// of card backs. Only two seats today — the board is two-sided — but GameState
// holds a list, so adding more later is a layout problem, not a state one.
const YOU = 0;
const ENEMY = 1;

/** An in-flight combat animation: the board is frozen on `before` while every
 *  minion in `attacks` plays its blow, and `resolved` — the damage, deaths and
 *  mills — commits the moment the animation ends. */
type Combat = {
  before: Minion[];
  attacks: Map<number, MinionAttack>;
  resolved: GameState;
};

export default function App() {
  const [state, setState] = useState(initialState);
  // While set, the board is held on `combat.before` playing `combat.attacks`,
  // input is blocked, and the outcome commits when the animation ends.
  const [combat, setCombat] = useState<Combat | null>(null);
  const { drag, dragUid, start } = useDrag(state, setState, YOU);

  // The enemy's turn plays out across timeouts, turns apart from this render,
  // so its callbacks read the latest state through a ref, not a stale closure.
  const stateRef = useRef(state);
  stateRef.current = state;

  // A mill dash aims at the live on-screen position of the deck it hits, so
  // each deck hands its node down to be measured.
  const yourDeckRef = useRef<HTMLDivElement>(null);
  const enemyDeckRef = useRef<HTMLDivElement>(null);

  const you = state.players[YOU];
  const enemy = state.players[ENEMY];
  const yourTurn = state.activePlayerIndex === YOU;
  const busy = combat !== null;

  // Turn each landed blow into the animation its minion(s) play. A clash moves
  // both fighters (each toward the other, each showing the damage it took); a
  // mill moves only the raider, aimed at the deck it struck.
  function attacksFor(events: CombatEvent[], resolved: GameState) {
    const alive = new Set(resolved.minions.map((m) => m.uid));
    const attacks = new Map<number, MinionAttack>();
    for (const event of events) {
      if (event.kind === "clash") {
        const { a, b } = event;
        attacks.set(a.uid, {
          kind: "clash",
          dir: step(a.owner),
          damage: CARDS[b.card].atk,
          dies: !alive.has(a.uid),
        });
        attacks.set(b.uid, {
          kind: "clash",
          dir: step(b.owner),
          damage: CARDS[a.card].atk,
          dies: !alive.has(b.uid),
        });
      } else {
        attacks.set(event.attacker.uid, {
          kind: "mill",
          deckRef: event.targetSeat === YOU ? yourDeckRef : enemyDeckRef,
        });
      }
    }
    return attacks;
  }

  // Resolve one player's turn. If blows land, hold the pre-combat board and
  // play them, then commit the outcome; if none do, commit at once. `then`
  // runs once the outcome is on the board.
  function playTurn(from: GameState, then: () => void) {
    const { state: resolved, events } = resolveTurn(from);
    if (events.length === 0) {
      setState(resolved);
      then();
      return;
    }
    setCombat({
      before: from.minions,
      attacks: attacksFor(events, resolved),
      resolved,
    });
    setTimeout(() => {
      setCombat(null);
      setState(resolved);
      then();
    }, COMBAT_MS);
  }

  // End the human's turn, then drive the enemy's: your minions act, then the
  // enemy draws and summons, and after a beat to read the board its minions
  // act back to you.
  function handleEndTurn() {
    playTurn(stateRef.current, () => {
      setState((s) => summonMinion(draw(s, ENEMY), ENEMY));
      setTimeout(() => playTurn(stateRef.current, () => {}), ENEMY_PAUSE);
    });
  }

  return (
    <main
      className={cn(
        "relative grid min-h-screen grid-rows-[auto_1fr_auto] justify-items-center bg-parchment text-ink",
        drag && "cursor-grabbing select-none",
      )}
    >
      <Hand cards={enemy.hand} faceDown />
      <Board
        minions={combat ? combat.before : state.minions}
        attacks={combat?.attacks}
        dragging={drag !== null}
        dragLane={drag?.lane ?? null}
      />
      <Hand
        cards={you.hand}
        dragging={dragUid}
        onDragStart={busy ? undefined : start}
      />
      <Deck
        ref={yourDeckRef}
        count={you.deck.length}
        onDraw={() => setState((s) => draw(s, YOU))}
        className="bottom-12 left-10"
      />
      <Deck
        ref={enemyDeckRef}
        count={enemy.deck.length}
        className="top-12 right-10"
      />
      {/* Each mana bar sits just inward of its owner's deck, out of the card
          stack's footprint. */}
      <Mana
        mana={enemy.mana}
        max={enemy.maxMana}
        className="absolute top-16 right-52"
      />
      <Mana
        mana={you.mana}
        max={you.maxMana}
        className="absolute bottom-16 left-52"
      />
      <div className="absolute right-10 bottom-28 text-right font-bold text-ink">
        {yourTurn ? "Your turn" : "Enemy turn"}
      </div>
      <button
        type="button"
        onClick={handleEndTurn}
        disabled={!yourTurn || busy}
        className={cn(
          "absolute right-10 bottom-12 rounded-md bg-ink px-4 py-2 font-bold text-parchment transition-transform duration-150",
          yourTurn && !busy
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
