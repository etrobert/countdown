import {
  useEffect,
  useEffectEvent,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
} from "react";
import { playSummonSound } from "./sound.ts";
import {
  canAfford,
  canPlay,
  play,
  type CardInstance,
  type GameState,
} from "./state.ts";

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
  onInsufficientMana?: () => void,
) {
  const [drag, setDrag] = useState<Drag | null>(null);

  const dragUid = drag?.instance.uid ?? null;
  const dragCard = drag?.instance.card ?? null;

  // Affordability doesn't depend on the pointer, so it's checked apart from
  // lane resolution: an unaffordable drag highlights no lanes, and dropping it
  // on an otherwise legal lane flashes the mana bar instead of playing.
  const affordable = useEffectEvent(
    () => dragCard !== null && canAfford(state, playerIndex, dragCard),
  );

  // The floating card is pointer-events-none, so elementFromPoint sees the lane
  // beneath it. A lane is a target only while cell 0 is free. An Effect Event
  // so the pointer listeners read live state without resubscribing on each move.
  const laneAt = useEffectEvent((x: number, y: number): number | null => {
    const el = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>("[data-lane]");
    if (!el) return null;
    const lane = Number(el.dataset.lane);
    return canPlay(state, lane, playerIndex) ? lane : null;
  });

  const onInsufficient = useEffectEvent(() => onInsufficientMana?.());

  useEffect(() => {
    if (dragUid === null || dragCard === null) return;

    const onMove = (e: PointerEvent) => {
      // Resolve the lane here in the handler, not inside the setDrag updater:
      // the updater runs during render, where Effect Events can't be called.
      const lane = affordable() ? laneAt(e.clientX, e.clientY) : null;
      setDrag((d) => d && { ...d, x: e.clientX, y: e.clientY, lane });
    };

    const onUp = (e: PointerEvent) => {
      const lane = laneAt(e.clientX, e.clientY);
      // `laneAt` only returns a lane when the play is valid, so an affordable
      // drop there always summons — sound it. `dragCard` is non-null past the
      // guard above.
      if (lane !== null) {
        if (affordable()) {
          setState((s) => play(s, playerIndex, dragUid, lane));
          playSummonSound(dragCard);
        } else onInsufficient();
      }
      setDrag(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragUid, dragCard, setState, playerIndex]);

  const start = (instance: CardInstance, e: ReactPointerEvent) =>
    setDrag({ instance, x: e.clientX, y: e.clientY, lane: null });

  return { drag, dragUid, start };
}
