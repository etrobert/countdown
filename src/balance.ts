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
  art: string;
};

export const HAND_SIZE = 5;

/** The mana ceiling stops climbing here, so turns don't run away late-game. */
export const MAX_MANA = 10;

export const DECK_SIZE = 15;

export const LANES = 3;

/** Cells per lane. Cell 0 is your end; a minion walks toward the far end. */
export const LANE_CELLS = 4;

// Placeholder stats along the cost curve (cost 1→5). Real decklists are open.
export const CARDS = {
  piou: { name: "Piou", cost: 1, atk: 2, hp: 1, art: piouArt },
  blob: { name: "Blob", cost: 1, atk: 1, hp: 2, art: blobArt },
  bush: { name: "Bush", cost: 2, atk: 1, hp: 4, art: bushArt },
  zombie: { name: "Zombie", cost: 2, atk: 2, hp: 3, art: zombieArt },
  saper: { name: "Saper", cost: 3, atk: 3, hp: 2, art: saperArt },
  universman: { name: "Univers Man", cost: 3, atk: 3, hp: 3, art: universmanArt },
  wizard: { name: "Wizard", cost: 3, atk: 2, hp: 4, art: wizardArt },
  mountdog: { name: "Mount Dog", cost: 4, atk: 4, hp: 3, art: mountdogArt },
  lion: { name: "Lion", cost: 4, atk: 5, hp: 3, art: lionArt },
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
