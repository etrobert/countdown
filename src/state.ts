import { shuffle } from "es-toolkit";
import {
  BOSS_ACTION_WEIGHTS,
  BOSS_HP,
  BOSS_SAFE_TURNS,
  CARD_IDS,
  CARDS,
  FIREBALL_MILL,
  HAND_SIZE,
  LANES,
  LANE_CELLS,
  MAX_MANA,
  STARTING_DECK,
  STARTING_MANA,
  VOLLEY_DAMAGE,
  VOLLEY_MILL,
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
 *  `mana` is what is left to spend this turn; `maxMana` is the natural ceiling
 *  it refills to at the start of each of the player's turns, and grows by one
 *  every round — STARTING_MANA on round 1, one more each round after — up to
 *  MAX_MANA.
 *  Wizards on the board raise the ceiling above `maxMana` — see
 *  `effectiveMaxMana`. */
export type Player = {
  deck: CardInstance[];
  hand: CardInstance[];
  mana: number;
  maxMana: number;
  /** Whether the once-per-turn voluntary draw has been used — see
   *  `drawVoluntary`. Cleared when the turn comes back around. */
  drewThisTurn?: boolean;
  /** The boss's life total — present only on the boss seat, which is what
   *  makes a seat the boss (see `isBoss`). The boss has no deck, hand, or
   *  mana; raids spend its hp instead of milling. */
  hp?: number;
  /** The boss's summon budget: its whole turn economy in place of mana. Grows
   *  by one at the start of each boss turn — mirroring the player's mana ramp —
   *  with no ceiling, so it doubles as the boss turn number. */
  power?: number;
};

/** Whether a seat is the boss: it has hp instead of a deck for a life total. */
export function isBoss(player: Player): player is Player & { hp: number } {
  return player.hp !== undefined;
}

/** What the boss will do on its coming turn, revealed a turn ahead so the
 *  player can play around it. */
export type BossAction = "summon" | "volley" | "fireball";

export type GameState = {
  /** Every player in the battle, in seating order. Two today; the array leaves
   *  the door open to a three-or-more-way free-for-all later. */
  players: Player[];
  minions: Minion[];
  /** Seat index of the player whose turn it is. */
  activePlayerIndex: number;
  /** Seat index of the player who has won, once the battle is over — absent
   *  while it is still live. A deck player loses the moment they are forced to
   *  draw from an empty deck at the start of their turn (see `resolveTurn`);
   *  the boss loses when a raid empties its hp (see `raid`). Either way the
   *  other seat wins. */
  winner?: number;
  /** The boss action telegraphed for its coming turn — see `chooseBossAction`. */
  telegraph?: BossAction;
  /** The next unused minion uid. Starts past every dealt card, so
   *  boss-summoned minions can never collide with cards from a deck. */
  nextUid: number;
};

/** Deals a starting hand and deck from a fresh shuffle of the decklist,
 *  numbering copies from `firstUid` so no two players' cards collide — a uid
 *  has to be unique across the whole board. */
function deal(deckList: CardId[], firstUid: number): Player {
  const cards = shuffle(deckList).map((card, i) => ({
    uid: firstUid + i,
    card,
  }));
  return {
    hand: cards.slice(0, HAND_SIZE),
    deck: cards.slice(HAND_SIZE),
    // No mana yet: the first turn grants it, via startTurn — whose +1 lands
    // the opening ceiling on STARTING_MANA.
    mana: 0,
    maxMana: STARTING_MANA - 1,
  };
}

/** The wizard's aura: one bonus mana crystal per wizard a player has on the
 *  board. Derived from the board on every read, so a crystal appears the moment
 *  a wizard is summoned and vanishes the moment it leaves. */
export function manaBonus(state: GameState, playerIndex: number): number {
  return state.minions.filter(
    (m) => m.owner === playerIndex && m.card === "wizard",
  ).length;
}

/** The mana ceiling a player actually plays with: the natural ceiling plus the
 *  wizard bonus. The bonus sits on top of MAX_MANA — only natural growth is
 *  capped — so wizards still pay off late-game. */
export function effectiveMaxMana(
  state: GameState,
  playerIndex: number,
): number {
  return state.players[playerIndex].maxMana + manaBonus(state, playerIndex);
}

/** Begins a player's turn: raises their natural mana ceiling by one — up to
 *  MAX_MANA — refills mana to that ceiling plus the wizard bonus, and draws
 *  for the turn. A wizard summoned mid-turn shows
 *  its crystal empty until this refill fills it. */
function startTurn(player: Player, bonus: number): Player {
  const maxMana = Math.min(player.maxMana + 1, MAX_MANA);
  return drawCard({
    ...player,
    maxMana,
    mana: maxMana + bonus,
    drewThisTurn: false,
  });
}

/** Begins the boss's turn — its side of `startTurn`: power grows by one and
 *  nothing is drawn or refilled, since power is the boss's whole economy. */
function empower(player: Player): Player {
  return { ...player, power: (player.power ?? 0) + 1 };
}

/** `yourDeck` is seat 0's decklist for this battle — the run deck, which grows
 *  at each draft. Seat 1 is the boss: no cards, just a life total. */
export function initialState(yourDeck: CardId[] = STARTING_DECK): GameState {
  return {
    // Seat 0 moves first, so it takes its opening turn — and its first mana —
    // right away.
    players: [
      startTurn(deal(yourDeck, 0), 0),
      { deck: [], hand: [], mana: 0, maxMana: 0, hp: BOSS_HP, power: 0 },
    ],
    minions: [],
    activePlayerIndex: 0,
    // Boss turn 1 sits inside the safe runway, so the pre-rolled telegraph is
    // always a summon.
    telegraph: "summon",
    nextUid: yourDeck.length,
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
 *  deck is the life total, so every draw spends one. Deck-out is detected in
 *  `resolveTurn` before the turn's draw ever happens, so the empty-deck no-op
 *  here is a defensive guard, not the loss rule. */
function drawCard(player: Player): Player {
  const [top, ...rest] = player.deck;
  if (!top) return player;
  return { ...player, deck: rest, hand: [...player.hand, top] };
}

/** Draws one extra card of the player's own choosing — trading life for
 *  options, since the deck is the life total and every draw spends one. Once
 *  per turn, on top of the turn's draw; a no-op off-turn, once the battle is
 *  over, or from an empty deck. Drawing the last card is allowed — the loss
 *  then lands at the next turn's forced draw, per the usual deck-out rule. */
export function drawVoluntary(
  state: GameState,
  playerIndex: number,
): GameState {
  const player = state.players[playerIndex];
  if (
    state.winner !== undefined ||
    state.activePlayerIndex !== playerIndex ||
    player.drewThisTurn ||
    player.deck.length === 0
  )
    return state;
  return withPlayer(state, playerIndex, {
    ...drawCard(player),
    drewThisTurn: true,
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

/** A card arrives on its owner's entry cell, so a lane is only playable while
 *  the battle is live, for that player on their own turn, and while that cell
 *  is free — a drag started just before the final beat cannot land a card in a
 *  finished game. This is about the battle, the turn and the board, not the
 *  card — whether the player can afford a given card is `canAfford`. */
export function canPlay(
  state: GameState,
  lane: number,
  playerIndex: number,
): boolean {
  return (
    state.winner === undefined &&
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

/** Walks a minion forward to the given cell. */
function advance(state: GameState, minion: Minion, cell: number): GameState {
  return {
    ...state,
    minions: state.minions.map((m) =>
      m.uid === minion.uid ? { ...m, cell } : m,
    ),
  };
}

/** A minion at the enemy's face attacks their life total — hp for the boss,
 *  milled cards for a deck player, either way its attack's worth — then leaves
 *  the board, its charge spent. The blow that empties the boss's hp wins the
 *  battle on the spot. */
function raid(state: GameState, minion: Minion): GameState {
  const opponent = (minion.owner + 1) % state.players.length;
  const target = state.players[opponent];
  const atk = CARDS[minion.card].atk;
  const hit = isBoss(target)
    ? { ...target, hp: target.hp - atk }
    : { ...target, deck: target.deck.slice(atk) };
  return {
    ...withPlayer(state, opponent, hit),
    minions: state.minions.filter((m) => m.uid !== minion.uid),
    ...(isBoss(hit) && hit.hp <= 0 && { winner: minion.owner }),
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
 *  wake if it was just summoned, raid the enemy deck at their face, walk up to
 *  its movement in open cells, or clash with an enemy blocking the way. A
 *  friendly ahead just holds it up. A no-op if the minion already left the
 *  board earlier this turn. The clash/raid cases also report the fighters,
 *  snapshotted as they stood so the resolved-away ones can still be animated. */
function stepMinion(state: GameState, uid: number): StepResult {
  const minion = state.minions.find((m) => m.uid === uid);
  if (!minion) return { state };
  if (minion.summoned) return { state: wake(state, minion) };
  const ahead = minion.cell + step(minion.owner);
  if (ahead < 0 || ahead >= LANE_CELLS)
    return { state: raid(state, minion), fighters: [minion] };
  const other = minionAt(state, minion.lane, ahead);
  if (!other) {
    // Walk forward one cell per movement point, stopping short of the first
    // occupied cell and at the lane's last cell — raiding and clashing only
    // happen on a turn where the obstacle stands directly ahead at the start.
    let cell = ahead;
    for (let left = CARDS[minion.card].movement - 1; left > 0; left--) {
      const next = cell + step(minion.owner);
      if (next < 0 || next >= LANE_CELLS) break;
      if (minionAt(state, minion.lane, next)) break;
      cell = next;
    }
    return { state: advance(state, minion, cell) };
  }
  if (other.owner !== minion.owner)
    return { state: clash(state, minion, other), fighters: [minion, other] };
  return { state };
}

/** Ends the active player's turn: each of that player's minions takes its step
 *  (see `stepMinion`) folded over the state, then the turn passes to the next
 *  seat, who gets their mana — or, for the boss, power — for the turn. Fronts
 *  step first — the minion furthest along its direction of travel before the
 *  ones behind it — so a packed column shuffles forward as one. The new active
 *  player draws for the turn in `startTurn`. Returns the resolved state alongside the minions that
 *  struck a blow, in resolve order, so a caller can animate the blows first.
 *  A no-op once the battle is over. */
export function resolveTurn(state: GameState): {
  state: GameState;
  fighters: Minion[];
} {
  if (state.winner !== undefined) return { state, fighters: [] };
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
  // A wizard that left the board this turn takes its crystal with it: clamp
  // every player's leftover mana to the ceiling they still command.
  advanced = {
    ...advanced,
    players: advanced.players.map((p, i) => ({
      ...p,
      mana: Math.min(p.mana, effectiveMaxMana(advanced, i)),
    })),
  };
  // A winner decided mid-fold — a raid that felled the boss — ends the battle
  // before the turn ever passes, so it outranks the deck-out check below.
  if (advanced.winner !== undefined) return { state: advanced, fighters };
  const activePlayerIndex = (active + 1) % state.players.length;
  // Rule (b), deck-out on draw: the incoming player draws for the turn in
  // startTurn. An empty deck at that point is a failed forced draw — they
  // survived at zero but cannot draw, so they lose and the next seat wins.
  // The boss never draws, so it cannot deck out.
  const incoming = advanced.players[activePlayerIndex];
  if (!isBoss(incoming) && incoming.deck.length === 0) {
    const winner = (activePlayerIndex + 1) % state.players.length;
    return { state: { ...advanced, activePlayerIndex, winner }, fighters };
  }
  const players = advanced.players.map((p, i) =>
    i !== activePlayerIndex
      ? p
      : isBoss(p)
        ? empower(p)
        : startTurn(p, manaBonus(advanced, i)),
  );
  return { state: { ...advanced, activePlayerIndex, players }, fighters };
}

/** Picks a uniformly random element of a non-empty array. */
function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
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

/** Rolls the telegraph for the boss's next turn, one turn ahead — while the
 *  boss's power is T the roll decides turn T+1, so the player always sees the
 *  action coming. The first BOSS_SAFE_TURNS boss turns are hard-forced to
 *  "summon"; after the runway the action is drawn by BOSS_ACTION_WEIGHTS. */
export function chooseBossAction(state: GameState): BossAction {
  const boss = state.players.find(isBoss);
  if ((boss?.power ?? 0) + 1 <= BOSS_SAFE_TURNS) return "summon";
  const roll = Math.random();
  if (roll < BOSS_ACTION_WEIGHTS.summon) return "summon";
  if (roll < BOSS_ACTION_WEIGHTS.summon + BOSS_ACTION_WEIGHTS.volley)
    return "volley";
  return "fireball";
}

/** The boss's summon action: a budget equal to its current power, spent on
 *  uniformly random affordable cards — conjured from the whole pool, since the
 *  boss holds no hand — dropped into uniformly random open lanes until no card
 *  is affordable or no entry cell is free. Boss minions keep summoning
 *  sickness. A blocked-out or powerless boss simply fizzles: no re-roll. Also
 *  returns the cards summoned, in order, so the caller can sound them. */
export function bossSummon(state: GameState): {
  state: GameState;
  summoned: CardId[];
} {
  const bossIndex = state.players.findIndex(isBoss);
  const summoned: CardId[] = [];
  let budget = state.players[bossIndex].power ?? 0;
  let next = state;
  for (;;) {
    const affordable = CARD_IDS.filter((c) => CARDS[c].cost <= budget);
    const openLanes = Array.from({ length: LANES }, (_, lane) => lane).filter(
      (lane) => canPlay(next, lane, bossIndex),
    );
    if (affordable.length === 0 || openLanes.length === 0) break;
    const card = pick(affordable);
    budget -= CARDS[card].cost;
    summoned.push(card);
    next = {
      ...next,
      nextUid: next.nextUid + 1,
      minions: [
        ...next.minions,
        {
          uid: next.nextUid,
          card,
          owner: bossIndex,
          lane: pick(openLanes),
          cell: entryCell(bossIndex),
          hp: CARDS[card].hp,
          summoned: true,
        },
      ],
    };
  }
  return { state: next, summoned };
}

/** The boss's volley action: in each lane, the frontmost player minion — the
 *  one furthest along its walk — takes VOLLEY_DAMAGE and dies at 0 hp; a lane
 *  with no player minion lets the shot through to mill VOLLEY_MILL from the
 *  player's deck instead. Boss minions are never hit. Any deck-out this brings
 *  on is caught by the usual check in `resolveTurn`. */
export function volley(state: GameState): GameState {
  const fronts = Array.from({ length: LANES }, (_, lane) =>
    state.minions
      .filter((m) => m.owner === 0 && m.lane === lane)
      .reduce<
        Minion | undefined
      >((a, b) => (a && a.cell > b.cell ? a : b), undefined),
  );
  const hit = new Set(fronts.filter((m) => m !== undefined).map((m) => m.uid));
  const minions = state.minions
    .map((m) => (hit.has(m.uid) ? { ...m, hp: m.hp - VOLLEY_DAMAGE } : m))
    .filter((m) => m.hp > 0);
  const misses = fronts.filter((m) => m === undefined).length;
  const player = state.players[0];
  return {
    ...withPlayer(state, 0, {
      ...player,
      deck: player.deck.slice(misses * VOLLEY_MILL),
    }),
    minions,
  };
}

/** The boss's fireball action: mills FIREBALL_MILL straight off the player's
 *  deck, ignoring the board entirely. */
export function fireball(state: GameState): GameState {
  const player = state.players[0];
  return withPlayer(state, 0, {
    ...player,
    deck: player.deck.slice(FIREBALL_MILL),
  });
}
