import goblinArt from "./assets/goblin.png";
import swordmanArt from "./assets/swordman.png";
import hydraArt from "./assets/hydra.png";

/** The printed card: what every copy of it shares. */
export type Card = {
  name: string;
  cost: number;
  atk: number;
  hp: number;
  art: string;
};

export const HAND_SIZE = 5;

export const DECK_SIZE = 15;

export const LANES = 3;

/** Cells per lane. Cell 0 is your end; a minion walks toward the far end. */
export const LANE_CELLS = 4;

export const CARDS = {
  goblin: { name: "Goblin", cost: 1, atk: 2, hp: 1, art: goblinArt },
  swordman: { name: "Swordman", cost: 3, atk: 3, hp: 3, art: swordmanArt },
  hydra: { name: "Hydra", cost: 5, atk: 5, hp: 6, art: hydraArt },
} satisfies Record<string, Card>;

/** Identifies a kind of card, not a copy of one — see `CardInstance`. */
export type CardId = keyof typeof CARDS;

const CARD_IDS = Object.keys(CARDS) as CardId[];

/** Placeholder: cycles the pool to fill the deck. Real decklists are still open. */
export const STARTING_DECK: CardId[] = Array.from(
  { length: DECK_SIZE },
  (_, i) => CARD_IDS[i % CARD_IDS.length],
);
