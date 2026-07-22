import type { CSSProperties } from "react";
import Card from "./Card.tsx";
import type { Card as CardData } from "./balance.ts";

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

export default function Hand({ cards }: { cards: CardData[] }) {
  return (
    <div className="hand">
      {cards.map((card, i) => (
        <div key={card.id} className="hand-slot" style={fan(i, cards.length)}>
          <Card card={card} />
        </div>
      ))}
    </div>
  );
}
