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
 *  `hp` is current health, the one stat that diverges from the printed card.
 *  `owner` is the seat that played it — it only advances on that player's turn.
 *  `summoned` marks a minion played this turn: it sits still on the turn it
 *  arrives and only starts walking on its owner's next turn. */
export type Minion = CardInstance & {
  owner: number;
  lane: number;
  cell: number;
  hp: number;
  summoned: boolean;
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

/** The cell a player's minions enter on. The board is two-sided: seat 0 is on
 *  the left and walks rightward from cell 0, everyone else is on the right and
 *  walks leftward from the far cell. */
export function entryCell(playerIndex: number): number {
  return playerIndex === 0 ? 0 : LANE_CELLS - 1;
}

/** The direction, in cells per step, a player's minions walk toward the enemy
 *  end. Mirrors `entryCell`: seat 0 enters at cell 0 and advances rightward
 *  (+1), everyone else enters at the far cell and advances leftward (-1). */
export function step(playerIndex: number): number {
  return playerIndex === 0 ? 1 : -1;
}

/** A card arrives on its owner's entry cell, so a lane is only playable for
 *  that player while that cell is free. Mana is not modelled yet, so cost is
 *  not checked. */
export function canPlay(
  state: GameState,
  lane: number,
  playerIndex: number,
): boolean {
  return !minionAt(state, lane, entryCell(playerIndex));
}

/** Ends the active player's turn. First advances that player's minions one cell
 *  toward the enemy end — rightward for seat 0, leftward for everyone else, per
 *  `step` (fronts first, so a column shuffles forward without colliding; blocked
 *  by any minion in the cell ahead), then hands the turn to the next seat.
 *  A minion summoned this turn holds its ground: it clears its `summoned` mark
 *  here instead of moving, so it first walks on its owner's next turn.
 *  Drawing stays a manual action for now. */
export function endTurn(state: GameState): GameState {
  const minions = state.minions.map((m) => ({ ...m }));
  const active = state.activePlayerIndex;
  const dir = step(active);
  for (let lane = 0; lane < LANES; lane++) {
    minions
      .filter((m) => m.lane === lane && m.owner === active)
      // Fronts first: the minion furthest along its direction of travel moves
      // before the ones behind it, so a packed column steps forward as one.
      .sort((a, b) => (b.cell - a.cell) * dir)
      .forEach((m) => {
        // Just summoned: sit still this turn, then start walking from the next.
        if (m.summoned) {
          m.summoned = false;
          return;
        }
        const ahead = m.cell + dir;
        const blocked = minions.some(
          (o) => o.lane === lane && o.cell === ahead,
        );
        if (ahead >= 0 && ahead < LANE_CELLS && !blocked) m.cell = ahead;
      });
  }
  const activePlayerIndex = (active + 1) % state.players.length;
  return { ...state, minions, activePlayerIndex };
}

/** Picks a uniformly random element of a non-empty array. */
function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** The enemy's summon for one turn: play a random card from hand into a random
 *  open lane. A placeholder for a real heuristic — a no-op when the hand is
 *  empty or every entry cell is blocked. */
export function summonMinion(
  state: GameState,
  playerIndex: number,
): GameState {
  const hand = state.players[playerIndex].hand;
  const openLanes = Array.from({ length: LANES }, (_, lane) => lane).filter(
    (lane) => canPlay(state, lane, playerIndex),
  );
  if (hand.length === 0 || openLanes.length === 0) return state;

  return play(state, playerIndex, pick(hand).uid, pick(openLanes));
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
  if (!instance || !canPlay(state, lane, playerIndex)) return state;
  const next = withPlayer(state, playerIndex, {
    ...player,
    hand: player.hand.filter((c) => c.uid !== uid),
  });
  return {
    ...next,
    minions: [
      ...next.minions,
      {
        ...instance,
        owner: playerIndex,
        lane,
        cell: entryCell(playerIndex),
        hp: CARDS[instance.card].hp,
        summoned: true,
      },
    ],
  };
}
