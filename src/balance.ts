import rhinoArt from "./assets/rhino.jpg";
import steedArt from "./assets/horse.jpg";

/** The printed card: what every copy of it shares. */
export type Card = {
  name: string;
  cost: number;
  atk: number;
  hp: number;
  /** Optional until every card has a sketch. */
  art?: string;
};

export const HAND_SIZE = 5;

export const DECK_SIZE = 15;

export const LANES = 3;

/** Cells per lane. Cell 0 is your end; a minion walks toward the far end. */
export const LANE_CELLS = 4;

export const CARDS = {
  runner: { name: "Runner", cost: 1, atk: 1, hp: 1 },
  sentry: { name: "Sentry", cost: 2, atk: 1, hp: 4 },
  lash: { name: "Lash", cost: 3, atk: 3, hp: 2 },
  zealot: { name: "Zealot", cost: 3, atk: 5, hp: 3 },
  colossus: { name: "Colossus", cost: 5, atk: 4, hp: 6 },
  rhino: { name: "Rhino", cost: 3, atk: 4, hp: 4, art: rhinoArt },
  steed: { name: "Steed", cost: 2, atk: 3, hp: 2, art: steedArt },
} satisfies Record<string, Card>;

/** Identifies a kind of card, not a copy of one — see `CardInstance`. */
export type CardId = keyof typeof CARDS;

const CARD_IDS = Object.keys(CARDS) as CardId[];

/** Placeholder: cycles the pool to fill the deck. Real decklists are still open. */
export const STARTING_DECK: CardId[] = Array.from(
  { length: DECK_SIZE },
  (_, i) => CARD_IDS[i % CARD_IDS.length],
);
