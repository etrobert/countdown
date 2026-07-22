import { CARDS, HAND_SIZE, STARTING_DECK, type CardId } from "./balance.ts";

/** One specific copy of a card. `uid` identifies the copy and stays stable as
 *  it moves, so React can keep the same DOM node and animate it. `card` says
 *  which card it is; the stats live in `CARDS`, not here. */
export type CardInstance = { uid: number; card: CardId };

/** A card that has been played onto the board. Keeps its `uid` from the hand.
 *  `hp` is current health, the one stat that diverges from the printed card. */
export type Minion = CardInstance & {
  lane: number;
  cell: number;
  hp: number;
};

export type GameState = {
  deck: CardInstance[];
  hand: CardInstance[];
  minions: Minion[];
};

export function initialState(): GameState {
  const cards = STARTING_DECK.map((card, uid) => ({ uid, card }));
  return {
    hand: cards.slice(0, HAND_SIZE),
    deck: cards.slice(HAND_SIZE),
    minions: [],
  };
}

/** Moves the top card into hand. Drawing is the countdown — the deck is the
 *  life total, so every draw spends one. A no-op on an empty deck; running out
 *  is a loss, which is not modelled yet. */
export function draw(state: GameState): GameState {
  const [top, ...rest] = state.deck;
  if (!top) return state;
  return { ...state, deck: rest, hand: [...state.hand, top] };
}

export function minionAt(state: GameState, lane: number, cell: number) {
  return state.minions.find((m) => m.lane === lane && m.cell === cell);
}

/** A card arrives at cell 0, so a lane is only playable while that cell is
 *  free. Mana is not modelled yet, so cost is not checked. */
export function canPlay(state: GameState, lane: number): boolean {
  return !minionAt(state, lane, 0);
}

/** Plays a card from hand into a lane, summoning it at your end of that lane. */
export function play(state: GameState, uid: number, lane: number): GameState {
  const instance = state.hand.find((c) => c.uid === uid);
  if (!instance || !canPlay(state, lane)) return state;
  return {
    ...state,
    hand: state.hand.filter((c) => c.uid !== uid),
    minions: [
      ...state.minions,
      { ...instance, lane, cell: 0, hp: CARDS[instance.card].hp },
    ],
  };
}
