import {
  CARDS,
  DECK_SIZE,
  HAND_SIZE,
  LANES,
  LANE_CELLS,
  STARTING_DECK,
  type CardId,
} from "./balance.ts";

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

/** One player's private cards. The deck is their life total, the hand is what
 *  they can act on. Every player shares the board, so minions live on
 *  GameState, not here. */
export type Player = {
  deck: CardInstance[];
  hand: CardInstance[];
};

export type GameState = {
  /** Every player in the battle, in seating order. Two today; the array leaves
   *  the door open to a three-or-more-way free-for-all later. */
  players: Player[];
  minions: Minion[];
  /** Seat index of the player whose turn it is. */
  activePlayerIndex: number;
  /** Full rounds elapsed, counting from 1. Ticks up each time the turn wraps
   *  back to seat 0, so both players share a turn number — this is what will
   *  drive mana later (mana = min(turn, cap)). */
  turn: number;
};

/** Deals a starting hand and deck, numbering copies from `firstUid` so no two
 *  players' cards collide — a uid has to be unique across the whole board. */
function deal(firstUid: number): Player {
  const cards = STARTING_DECK.map((card, i) => ({ uid: firstUid + i, card }));
  return { hand: cards.slice(0, HAND_SIZE), deck: cards.slice(HAND_SIZE) };
}

export function initialState(): GameState {
  return {
    players: [deal(0), deal(DECK_SIZE)],
    minions: [],
    activePlayerIndex: 0,
    turn: 1,
  };
}

/** Swaps one player, leaving the rest of the seating untouched. */
function withPlayer(
  state: GameState,
  playerIndex: number,
  player: Player,
): GameState {
  return {
    ...state,
    players: state.players.map((p, i) => (i === playerIndex ? player : p)),
  };
}

/** Moves the top card into a player's hand. Drawing is the countdown — the
 *  deck is the life total, so every draw spends one. A no-op on an empty deck;
 *  running out is a loss, which is not modelled yet. */
export function draw(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex];
  const [top, ...rest] = player.deck;
  if (!top) return state;
  return withPlayer(state, playerIndex, {
    deck: rest,
    hand: [...player.hand, top],
  });
}

export function minionAt(state: GameState, lane: number, cell: number) {
  return state.minions.find((m) => m.lane === lane && m.cell === cell);
}

/** A card arrives at cell 0, so a lane is only playable while that cell is
 *  free. Mana is not modelled yet, so cost is not checked. */
export function canPlay(state: GameState, lane: number): boolean {
  return !minionAt(state, lane, 0);
}

/** Ends the active player's turn. First advances every minion one cell toward
 *  the far end (fronts first, so a column shuffles forward without colliding),
 *  then hands the turn to the next seat. The turn number ticks up when the
 *  hand-off wraps back to seat 0. Drawing stays a manual action for now. */
export function endTurn(state: GameState): GameState {
  const minions = state.minions.map((m) => ({ ...m }));
  for (let lane = 0; lane < LANES; lane++) {
    minions
      .filter((m) => m.lane === lane)
      .sort((a, b) => b.cell - a.cell)
      .forEach((m) => {
        const ahead = m.cell + 1;
        const blocked = minions.some(
          (o) => o.lane === lane && o.cell === ahead,
        );
        if (ahead < LANE_CELLS && !blocked) m.cell = ahead;
      });
  }
  const activePlayerIndex =
    (state.activePlayerIndex + 1) % state.players.length;
  const turn = activePlayerIndex === 0 ? state.turn + 1 : state.turn;
  return { ...state, minions, activePlayerIndex, turn };
}

/** Plays a card from a player's hand into a lane, summoning it at their end of
 *  that lane. */
export function play(
  state: GameState,
  playerIndex: number,
  uid: number,
  lane: number,
): GameState {
  const player = state.players[playerIndex];
  const instance = player.hand.find((c) => c.uid === uid);
  if (!instance || !canPlay(state, lane)) return state;
  const next = withPlayer(state, playerIndex, {
    ...player,
    hand: player.hand.filter((c) => c.uid !== uid),
  });
  return {
    ...next,
    minions: [
      ...next.minions,
      { ...instance, lane, cell: 0, hp: CARDS[instance.card].hp },
    ],
  };
}
