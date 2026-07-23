import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type RefObject,
} from "react";
import Card from "./Card.tsx";
import { CARDS } from "./balance.ts";
import { cn } from "./lib/utils.ts";
import type { CardInstance } from "./state.ts";

declare module "react" {
  interface CSSProperties {
    /** Fan rotation, as a `deg` value. */
    "--rot"?: string;
    /** Downward arc offset, as a `px` value. */
    "--dy"?: string;
    /** Stack order within the hand. */
    "--z"?: number;
  }
}

/** Fans the hand around its centre so the cards splay like held paper. Values
 *  go out as custom properties so :hover can override them — an inline
 *  `rotate` would outrank the stylesheet. */
function fan(index: number, count: number): CSSProperties {
  const offset = index - (count - 1) / 2;
  return {
    "--rot": `${offset * 4}deg`,
    "--dy": `${Math.abs(offset) * 8}px`,
    "--z": index,
  };
}

const FANNED = "z-[var(--z)] translate-y-[var(--dy)] rotate-[var(--rot)]";

export default function Hand({
  cards,
  dragging = null,
  onDragStart,
  faceDown = false,
  originRef,
}: {
  cards: CardInstance[];
  /** uid of the card being dragged, so its slot in the fan reads as empty. */
  dragging?: number | null;
  onDragStart?: (instance: CardInstance, e: React.PointerEvent) => void;
  /** The enemy hand: card backs, no interaction, and flipped 180° so the fan
   *  hangs from the top edge instead of rising from the bottom. */
  faceDown?: boolean;
  /** The deck a drawn card flies in from. */
  originRef?: RefObject<HTMLElement | null>;
}) {
  // The rendered node for each card by uid, and the uids already dealt in — a
  // card only ever enters the hand by being drawn, so any uid we have not seen
  // before is a fresh draw to animate.
  const cardEls = useRef(new Map<number, HTMLElement>());
  const dealt = useRef(new Set<number>());

  useLayoutEffect(() => {
    const origin = originRef?.current?.getBoundingClientRect();
    for (const { uid } of cards) {
      if (dealt.current.has(uid)) continue;
      dealt.current.add(uid);
      const el = cardEls.current.get(uid);
      if (!el || !origin) continue;
      // Fly from the deck's centre to the card's landing slot. Both rects are
      // in screen space; the transform is applied in the element's own space,
      // which the face-down hand's 180° flip inverts — hence the sign.
      const to = el.getBoundingClientRect();
      const sign = faceDown ? -1 : 1;
      const dx =
        (origin.left + origin.width / 2 - (to.left + to.width / 2)) * sign;
      const dy =
        (origin.top + origin.height / 2 - (to.top + to.height / 2)) * sign;
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: "translate(0, 0)" },
        ],
        { duration: 400, easing: "ease-out" },
      );
    }
    // Forget cards that have left the hand, so a later copy of the same uid
    // would deal in again.
    for (const uid of dealt.current)
      if (!cards.some((c) => c.uid === uid)) dealt.current.delete(uid);
  }, [cards, faceDown, originRef]);

  const setEl = (uid: number) => (el: HTMLElement | null) => {
    if (el) cardEls.current.set(uid, el);
    else cardEls.current.delete(uid);
  };

  return (
    // Rotation, translate and the hover scale do not grow the layout box, so
    // the hand needs padding to overhang into or it clips the viewport.
    // min-h reserves a full card's height (plus the pt-16 + pb-12 padding) so an
    // empty hand keeps the same footprint and the board above/below stays put.
    <div
      className={cn(
        "flex min-h-[calc(var(--card-h)+7rem)] touch-none items-end justify-center px-8 pt-16 pb-12 select-none",
        faceDown && "rotate-180",
      )}
    >
      {cards.map((instance, i) => {
        const style = fan(i, cards.length);
        if (faceDown)
          return (
            <div
              key={instance.uid}
              ref={setEl(instance.uid)}
              aria-hidden
              className={cn(
                "card-back relative h-[var(--card-h)] w-[var(--card-w)] rounded-md border border-edge not-first:-ml-16",
                FANNED,
              )}
              style={style}
            />
          );
        return (
          <button
            key={instance.uid}
            ref={setEl(instance.uid)}
            type="button"
            onPointerDown={(e) => onDragStart?.(instance, e)}
            // The card face holds an image; killing native drag stops its ghost
            // from fighting the pointer drag.
            onDragStart={(e) => e.preventDefault()}
            className={cn(
              "relative transition-[rotate,translate,scale] duration-150 ease-in-out not-first:-ml-16 hover:z-10 hover:-translate-y-10 hover:rotate-0 hover:scale-115",
              FANNED,
              dragging === instance.uid
                ? "cursor-grabbing opacity-0"
                : "cursor-grab",
            )}
            style={style}
          >
            <Card card={CARDS[instance.card]} />
          </button>
        );
      })}
    </div>
  );
}
