import { HAND_SIZE, STARTING_DECK, type CardId } from "./balance.ts";

/** One specific copy of a card. `uid` identifies the copy and stays stable as
 *  it moves, so React can keep the same DOM node and animate it. `card` says
 *  which card it is; the stats live in `CARDS`, not here. */
export type CardInstance = { uid: number; card: CardId };

export type GameState = {
  deck: CardInstance[];
  hand: CardInstance[];
};

export function initialState(): GameState {
  const cards = STARTING_DECK.map((card, uid) => ({ uid, card }));
  return {
    hand: cards.slice(0, HAND_SIZE),
    deck: cards.slice(HAND_SIZE),
  };
}

/** Moves the top card into hand. Drawing is the countdown — the deck is the
 *  life total, so every draw spends one. A no-op on an empty deck; running out
 *  is a loss, which is not modelled yet. */
export function draw(state: GameState): GameState {
  const [top, ...rest] = state.deck;
  if (!top) return state;
  return { deck: rest, hand: [...state.hand, top] };
}
