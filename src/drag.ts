import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
} from "react";
import { canPlay, play, type CardInstance, type GameState } from "./state.ts";

/** A card in flight from the hand. `x`/`y` track the pointer; `lane` is the
 *  playable lane under it, or null when there is no valid drop target. */
export type Drag = {
  instance: CardInstance;
  x: number;
  y: number;
  lane: number | null;
};

/** Pointer-drag of a hand card onto a lane. Owns the drag state and the window
 *  listeners: `start` fires on a hand card's pointer down, `drag` drives the
 *  lane highlights and the floating card, and dropping over a playable lane
 *  plays the card. */
export function useDrag(
  state: GameState,
  setState: Dispatch<SetStateAction<GameState>>,
  playerIndex: number,
) {
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
      return canPlay(stateRef.current, lane, playerIndex) ? lane : null;
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
      if (lane !== null) setState((s) => play(s, playerIndex, dragUid, lane));
      setDrag(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragUid, setState, playerIndex]);

  const start = (instance: CardInstance, e: ReactPointerEvent) =>
    setDrag({ instance, x: e.clientX, y: e.clientY, lane: null });

  return { drag, dragUid, start };
}
