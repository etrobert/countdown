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
  /** Ability text shown on the card face; cards without an ability omit it. */
  text?: string;
  art: string;
};

export const HAND_SIZE = 3;

/** The mana ceiling stops climbing here, so turns don't run away late-game. */
export const MAX_MANA = 5;

/** Mana granted on the player's first turn, so the opening isn't starved of
 *  plays; the ceiling climbs by one per turn from here up to MAX_MANA. */
export const STARTING_MANA = 3;

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
  piou: { name: "Piou", cost: 2, atk: 2, hp: 1, movement: 3, art: piouArt },
  blob: { name: "Blob", cost: 2, atk: 1, hp: 4, movement: 1, art: blobArt },
  bush: { name: "Bush", cost: 1, atk: 2, hp: 1, movement: 2, art: bushArt },
  zombie: {
    name: "Zombie",
    cost: 1,
    atk: 2,
    hp: 2,
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
    text: "+1 mana crystal while in play",
    art: wizardArt,
  },
  mountdog: {
    name: "Mount Dog",
    cost: 4,
    atk: 4,
    hp: 2,
    movement: 3,
    art: mountdogArt,
  },
  lion: { name: "Lion", cost: 5, atk: 5, hp: 3, movement: 3, art: lionArt },
  hydra: { name: "Hydra", cost: 5, atk: 3, hp: 12, movement: 1, art: hydraArt },
} satisfies Record<string, Card>;

/** Identifies a kind of card, not a copy of one — see `CardInstance`. */
export type CardId = keyof typeof CARDS;

export const CARD_IDS = Object.keys(CARDS) as CardId[];

/** The boss's life total. Raids spend it instead of milling a deck. */
export const BOSS_HP = 12;

/** Odds of each telegraphed boss action once the safe runway ends. */
export const BOSS_ACTION_WEIGHTS = {
  summon: 0.5,
  volley: 0.35,
  fireball: 0.15,
};

/** Boss turns hard-forced to "summon" — a safe runway before volleys and
 *  fireballs enter the roll, so the player can build a board first. */
export const BOSS_SAFE_TURNS = 3;

/** Damage a volley deals to the frontmost player minion in each lane. */
export const VOLLEY_DAMAGE = 1;

/** Cards a volley mills from the player's deck per empty lane. */
export const VOLLEY_MILL = 1;

/** Cards a fireball mills from the player's deck. */
export const FIREBALL_MILL = 2;

/** Cards offered at the between-battles draft; pick one or pass. */
export const DRAFT_CHOICES = 3;

/** Cards the between-battles remove step lets you cut from the run deck; cut up
 *  to this many, or none. Pairs with the add step — add up to 2, then trim. */
export const REMOVE_LIMIT = 2;

/** Placeholder: cycles the pool to fill the deck. Real decklists are still open. */
export const STARTING_DECK: CardId[] = Array.from(
  { length: DECK_SIZE },
  (_, i) => CARD_IDS[i % CARD_IDS.length],
);
