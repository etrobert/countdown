import {
  CARDS,
  DECK_SIZE,
  HAND_SIZE,
  LANES,
  LANE_CELLS,
  MAX_MANA,
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
 *  GameState, not here.
 *  `mana` is what is left to spend this turn; `maxMana` is the ceiling it
 *  refills to at the start of each of the player's turns, and grows by one every
 *  round — 1 on round 1, 2 on round 2, and so on — up to MAX_MANA. */
export type Player = {
  deck: CardInstance[];
  hand: CardInstance[];
  mana: number;
  maxMana: number;
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
  return {
    hand: cards.slice(0, HAND_SIZE),
    deck: cards.slice(HAND_SIZE),
    // No mana yet: the first turn grants it, via startTurn.
    mana: 0,
    maxMana: 0,
  };
}

/** Begins a player's turn: raises their mana ceiling by one — so it tracks the
 *  round number, up to MAX_MANA — refills mana to that ceiling, and draws for
 *  the turn. */
function startTurn(player: Player): Player {
  const maxMana = Math.min(player.maxMana + 1, MAX_MANA);
  return drawCard({ ...player, maxMana, mana: maxMana });
}

export function initialState(): GameState {
  return {
    // Seat 0 moves first, so it takes its opening turn — and its first mana —
    // right away. Everyone else waits for resolveTurn to bring their turn
    // around.
    players: [startTurn(deal(0)), deal(DECK_SIZE)],
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
function drawCard(player: Player): Player {
  const [top, ...rest] = player.deck;
  if (!top) return player;
  return { ...player, deck: rest, hand: [...player.hand, top] };
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
 *  that player on their own turn and while that cell is free. This is about
 *  the turn and the board, not the card — whether the player can afford a
 *  given card is `canAfford`. */
export function canPlay(
  state: GameState,
  lane: number,
  playerIndex: number,
): boolean {
  return (
    state.activePlayerIndex === playerIndex &&
    !minionAt(state, lane, entryCell(playerIndex))
  );
}

/** Whether a player has the mana left this turn to play a given card. */
export function canAfford(
  state: GameState,
  playerIndex: number,
  card: CardId,
): boolean {
  return state.players[playerIndex].mana >= CARDS[card].cost;
}

/** Clears a minion's `summoned` mark: it held its ground this turn and walks
 *  from the next one on. */
function wake(state: GameState, minion: Minion): GameState {
  return {
    ...state,
    minions: state.minions.map((m) =>
      m.uid === minion.uid ? { ...m, summoned: false } : m,
    ),
  };
}

/** Walks a minion forward into the open cell ahead. */
function advance(state: GameState, minion: Minion, cell: number): GameState {
  return {
    ...state,
    minions: state.minions.map((m) =>
      m.uid === minion.uid ? { ...m, cell } : m,
    ),
  };
}

/** A minion at the enemy's face attacks their deck — milling cards equal to its
 *  attack — then leaves the board, its charge spent. */
function raid(state: GameState, minion: Minion): GameState {
  const opponent = (minion.owner + 1) % state.players.length;
  const players = state.players.map((p, i) =>
    i === opponent ? { ...p, deck: p.deck.slice(CARDS[minion.card].atk) } : p,
  );
  return {
    ...state,
    players,
    minions: state.minions.filter((m) => m.uid !== minion.uid),
  };
}

/** Two enemy minions trade blows by their attack; either one dropped to 0 hp
 *  dies and leaves the board. */
function clash(state: GameState, a: Minion, b: Minion): GameState {
  const damaged = state.minions.map((m) => {
    if (m.uid === a.uid) return { ...m, hp: m.hp - CARDS[b.card].atk };
    if (m.uid === b.uid) return { ...m, hp: m.hp - CARDS[a.card].atk };
    return m;
  });
  return { ...state, minions: damaged.filter((m) => m.hp > 0) };
}

/** The state after one minion's step, plus the minions that struck a blow
 *  making it — both clashers for a clash, the raider for a mill. Movement and
 *  waking involve no fighters. */
type StepResult = { state: GameState; fighters?: Minion[] };

/** Resolves one minion's action for the turn, dispatching on what lies ahead:
 *  wake if it was just summoned, raid the enemy deck at their face, walk into an
 *  open cell, or clash with an enemy blocking the way. A friendly ahead just
 *  holds it up. A no-op if the minion already left the board earlier this turn.
 *  The clash/raid cases also report the fighters, snapshotted as they stood so
 *  the resolved-away ones can still be animated. */
function stepMinion(state: GameState, uid: number): StepResult {
  const minion = state.minions.find((m) => m.uid === uid);
  if (!minion) return { state };
  if (minion.summoned) return { state: wake(state, minion) };
  const ahead = minion.cell + step(minion.owner);
  if (ahead < 0 || ahead >= LANE_CELLS)
    return { state: raid(state, minion), fighters: [minion] };
  const other = minionAt(state, minion.lane, ahead);
  if (!other) return { state: advance(state, minion, ahead) };
  if (other.owner !== minion.owner)
    return { state: clash(state, minion, other), fighters: [minion, other] };
  return { state };
}

/** Ends the active player's turn: each of that player's minions takes its step
 *  (see `stepMinion`) folded over the state, then the turn passes to the next
 *  seat, who gets their mana for the turn. Fronts step first — the minion
 *  furthest along its direction of travel before the ones behind it — so a
 *  packed column shuffles forward as one. The new active player draws for the
 *  turn in `startTurn`. Returns the resolved state alongside the minions that
 *  struck a blow, in resolve order, so a caller can animate the blows first. */
export function resolveTurn(state: GameState): {
  state: GameState;
  fighters: Minion[];
} {
  const active = state.activePlayerIndex;
  const order = state.minions
    .filter((m) => m.owner === active)
    .sort((a, b) => (b.cell - a.cell) * step(active))
    .map((m) => m.uid);
  const fighters: Minion[] = [];
  let advanced = state;
  for (const uid of order) {
    const result = stepMinion(advanced, uid);
    advanced = result.state;
    if (result.fighters) fighters.push(...result.fighters);
  }
  const activePlayerIndex = (active + 1) % state.players.length;
  const players = advanced.players.map((p, i) =>
    i === activePlayerIndex ? startTurn(p) : p,
  );
  return { state: { ...advanced, activePlayerIndex, players }, fighters };
}

/** Picks a uniformly random element of a non-empty array. */
function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** The enemy's summon decision for one turn: a random affordable card from hand
 *  and a random open lane, or null when nothing in hand can be paid for or every
 *  entry cell is blocked. Kept apart from `play` so the caller learns which card
 *  was chosen — e.g. to sound its summon clip — since `play` only hands back the
 *  next state. A placeholder for a real heuristic. */
export function chooseSummon(state: GameState, playerIndex: number) {
  const affordable = state.players[playerIndex].hand.filter((c) =>
    canAfford(state, playerIndex, c.card),
  );
  const openLanes = Array.from({ length: LANES }, (_, lane) => lane).filter(
    (lane) => canPlay(state, lane, playerIndex),
  );
  if (affordable.length === 0 || openLanes.length === 0) return null;

  const { uid, card } = pick(affordable);
  return { uid, card, lane: pick(openLanes) };
}

/** Plays a card from a player's hand into a lane, summoning it at their end of
 *  that lane and spending its mana cost. A no-op if the lane is blocked or the
 *  player cannot afford the card. */
export function play(
  state: GameState,
  playerIndex: number,
  uid: number,
  lane: number,
): GameState {
  const player = state.players[playerIndex];
  const instance = player.hand.find((c) => c.uid === uid);
  if (!instance || !canPlay(state, lane, playerIndex)) return state;
  if (!canAfford(state, playerIndex, instance.card)) return state;
  const next = withPlayer(state, playerIndex, {
    ...player,
    hand: player.hand.filter((c) => c.uid !== uid),
    mana: player.mana - CARDS[instance.card].cost,
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
