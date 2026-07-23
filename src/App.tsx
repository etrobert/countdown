import { useEffect, useRef, useState } from "react";
import Board from "./Board.tsx";
import Card from "./Card.tsx";
import Deck from "./Deck.tsx";
import Hand from "./Hand.tsx";
import { CARDS } from "./balance.ts";
import {
  canPlay,
  draw,
  endTurn,
  initialState,
  play,
  type CardInstance,
} from "./state.ts";

/** A card in flight from the hand. `x`/`y` track the pointer; `lane` is the
 *  playable lane under it, or null when there is no valid drop target. */
type Drag = {
  instance: CardInstance;
  x: number;
  y: number;
  lane: number | null;
};

export default function App() {
  const [state, setState] = useState(initialState);
  // Dragging is a UI concern, not a rule, so it stays out of GameState.
  const [drag, setDrag] = useState<Drag | null>(null);

  // The pointer listeners resolve drop targets against the live state without
  // resubscribing on every move, so they read it through a ref.
  const stateRef = useRef(state);
  stateRef.current = state;

  const dragUid = drag?.instance.uid ?? null;

  useEffect(() => {
    if (dragUid === null) return;

    // The floating card is pointer-events-none, so elementFromPoint sees the
    // lane beneath it. A lane is a target only while cell 0 is free.
    const laneAt = (x: number, y: number): number | null => {
      const el = document
        .elementFromPoint(x, y)
        ?.closest<HTMLElement>("[data-lane]");
      if (!el) return null;
      const lane = Number(el.dataset.lane);
      return canPlay(stateRef.current, lane) ? lane : null;
    };

    const onMove = (e: PointerEvent) =>
      setDrag(
        (d) =>
          d && {
            ...d,
            x: e.clientX,
            y: e.clientY,
            lane: laneAt(e.clientX, e.clientY),
          },
      );

    const onUp = (e: PointerEvent) => {
      const lane = laneAt(e.clientX, e.clientY);
      if (lane !== null) setState((s) => play(s, dragUid, lane));
      setDrag(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragUid]);

  function startDrag(instance: CardInstance, e: React.PointerEvent) {
    setDrag({ instance, x: e.clientX, y: e.clientY, lane: null });
  }

  return (
    <main
      className={`relative grid min-h-screen grid-rows-[1fr_auto] justify-items-center bg-parchment text-ink ${
        drag ? "cursor-grabbing select-none" : ""
      }`}
    >
      <Board
        minions={state.minions}
        dragging={drag !== null}
        dragLane={drag?.lane ?? null}
      />
      <Hand cards={state.hand} dragging={dragUid} onDragStart={startDrag} />
      <Deck count={state.deck.length} onDraw={() => setState(draw)} />
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
