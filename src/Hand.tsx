import type { CSSProperties } from "react";
import Card from "./Card.tsx";
import { CARDS } from "./balance.ts";
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
  dragging,
  onDragStart,
}: {
  cards: CardInstance[];
  /** uid of the card being dragged, so its slot in the fan reads as empty. */
  dragging: number | null;
  onDragStart: (instance: CardInstance, e: React.PointerEvent) => void;
}) {
  return (
    // Rotation, translate and the hover scale do not grow the layout box, so
    // the hand needs padding to overhang into or it clips the viewport.
    <div className="flex touch-none items-end justify-center px-8 pt-16 pb-12 select-none">
      {cards.map((instance, i) => (
        <button
          key={instance.uid}
          type="button"
          onPointerDown={(e) => onDragStart(instance, e)}
          // The card face holds an image; killing native drag stops its ghost
          // from fighting the pointer drag.
          onDragStart={(e) => e.preventDefault()}
          className={`relative transition-[rotate,translate,scale] duration-150 ease-in-out not-first:-ml-16 hover:z-10 hover:-translate-y-10 hover:rotate-0 hover:scale-115 ${FANNED} ${
            dragging === instance.uid
              ? "cursor-grabbing opacity-0"
              : "cursor-grab"
          }`}
          style={fan(i, cards.length)}
        >
          <Card card={CARDS[instance.card]} />
        </button>
      ))}
    </div>
  );
}
