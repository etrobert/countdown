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

const LIFTED = "z-10 -translate-y-10 rotate-0 scale-115";
const FANNED = "z-[var(--z)] translate-y-[var(--dy)] rotate-[var(--rot)]";

export default function Hand({
  cards,
  selected,
  onSelect,
}: {
  cards: CardInstance[];
  selected: number | null;
  onSelect: (uid: number | null) => void;
}) {
  return (
    // Rotation, translate and the hover scale do not grow the layout box, so
    // the hand needs padding to overhang into or it clips the viewport.
    <div className="flex items-end justify-center px-8 pt-16 pb-12">
      {cards.map((instance, i) => (
        <button
          key={instance.uid}
          type="button"
          aria-pressed={selected === instance.uid}
          onClick={() =>
            onSelect(selected === instance.uid ? null : instance.uid)
          }
          // Selected and fanned set the same properties, so they are swapped
          // rather than combined — appending would leave the winner up to
          // Tailwind's own rule order rather than this list.
          className={`relative cursor-pointer transition-[rotate,translate,scale] duration-150 ease-in-out not-first:-ml-16 hover:z-10 hover:-translate-y-10 hover:rotate-0 hover:scale-115 ${
            selected === instance.uid ? LIFTED : FANNED
          }`}
          style={fan(i, cards.length)}
        >
          <Card card={CARDS[instance.card]} />
        </button>
      ))}
    </div>
  );
}
