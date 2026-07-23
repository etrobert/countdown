import piouArt from "./assets/piou.png";
import blobArt from "./assets/blob.png";
import bushArt from "./assets/bush.png";
import zombieArt from "./assets/Zombie.png";
import saperArt from "./assets/saper.png";
import universmanArt from "./assets/UniversMan.png";
import wizardArt from "./assets/wizard.png";
import mountdogArt from "./assets/mountdog.png";
import lionArt from "./assets/lion.png";
import hydraArt from "./assets/hydraf.png";

/** The printed card: what every copy of it shares. */
export type Card = {
  name: string;
  cost: number;
  atk: number;
  hp: number;
  /** Cells walked per turn when the way is open. */
  movement: number;
  art: string;
};

export const HAND_SIZE = 3;

/** The mana ceiling stops climbing here, so turns don't run away late-game. */
export const MAX_MANA = 10;

export const DECK_SIZE = 15;

export const LANES = 4;

/** Cells per lane. Cell 0 is your end; a minion walks toward the far end.
 *  Long enough that movement (1 slow, 2 standard, 3 fast) meaningfully spreads
 *  arrival times. */
export const LANE_CELLS = 7;

// Placeholder stats along the cost curve (cost 1→5). Real decklists are open.
// Movement spread: 1 is slow, 2 is standard, 3 is fast — averaging about 2
// across the pool.
export const CARDS = {
  piou: { name: "Piou", cost: 1, atk: 2, hp: 1, movement: 3, art: piouArt },
  blob: { name: "Blob", cost: 1, atk: 2, hp: 2, movement: 1, art: blobArt },
  bush: { name: "Bush", cost: 2, atk: 1, hp: 4, movement: 1, art: bushArt },
  zombie: {
    name: "Zombie",
    cost: 2,
    atk: 2,
    hp: 3,
    movement: 1,
    art: zombieArt,
  },
  saper: { name: "Saper", cost: 3, atk: 3, hp: 2, movement: 3, art: saperArt },
  universman: {
    name: "Univers Man",
    cost: 3,
    atk: 3,
    hp: 3,
    movement: 2,
    art: universmanArt,
  },
  wizard: {
    name: "Wizard",
    cost: 3,
    atk: 2,
    hp: 4,
    movement: 2,
    art: wizardArt,
  },
  mountdog: {
    name: "Mount Dog",
    cost: 4,
    atk: 4,
    hp: 3,
    movement: 3,
    art: mountdogArt,
  },
  lion: { name: "Lion", cost: 4, atk: 5, hp: 3, movement: 3, art: lionArt },
  hydra: { name: "Hydra", cost: 5, atk: 3, hp: 12, movement: 1, art: hydraArt },
} satisfies Record<string, Card>;

/** Identifies a kind of card, not a copy of one — see `CardInstance`. */
export type CardId = keyof typeof CARDS;

export const CARD_IDS = Object.keys(CARDS) as CardId[];

/** Cards offered at the between-battles draft; pick one or pass. */
export const DRAFT_CHOICES = 3;

/** Placeholder: cycles the pool to fill the deck. Real decklists are still open. */
export const STARTING_DECK: CardId[] = Array.from(
  { length: DECK_SIZE },
  (_, i) => CARD_IDS[i % CARD_IDS.length],
);
