import { describe, expect, it } from "vitest";
import {
  bossSummon,
  canAfford,
  canPlay,
  chooseBossAction,
  entryCell,
  fireball,
  initialState,
  play,
  resolveTurn,
  step,
  volley,
  type GameState,
  type Minion,
} from "./state.ts";
import {
  BOSS_HP,
  CARDS,
  FIREBALL_MILL,
  HAND_SIZE,
  LANE_CELLS,
  STARTING_DECK,
  VOLLEY_MILL,
} from "./balance.ts";

/** A two-player state with stocked decks but no minions, for building combat
 *  scenarios by hand. Decks are non-empty so passing the turn never triggers a
 *  deck-out loss; tests place exactly the minions they care about. */
function emptyState(): GameState {
  const stock = () =>
    Array.from({ length: 5 }, (_, i) => ({
      uid: 900 + i,
      card: "bush" as const,
    }));
  const player = () => ({ deck: stock(), hand: [], mana: 10, maxMana: 10 });
  return {
    players: [player(), player()],
    minions: [],
    activePlayerIndex: 0,
    nextUid: 910,
  };
}

function minion(
  over: Partial<Minion> & Pick<Minion, "card" | "owner">,
): Minion {
  return {
    uid: 1,
    lane: 0,
    cell: entryCell(over.owner),
    hp: CARDS[over.card].hp,
    summoned: false,
    ...over,
  };
}

describe("board geometry", () => {
  it("mirrors entry and step for the two seats", () => {
    expect(entryCell(0)).toBe(0);
    expect(entryCell(1)).toBe(LANE_CELLS - 1);
    expect(step(0)).toBe(1);
    expect(step(1)).toBe(-1);
  });
});

describe("initialState", () => {
  it("deals seat 0 and seats the boss with hp instead of cards", () => {
    const state = initialState();
    expect(state.players).toHaveLength(2);
    // Seat 1 is the boss: no cards, just a life total.
    expect(state.players[1].hand).toHaveLength(0);
    expect(state.players[1].deck).toHaveLength(0);
    expect(state.players[1].hp).toBe(BOSS_HP);
    // Seat 0 opened its turn, drawing one card for the turn: hand grows by one,
    // deck shrinks by one, and mana is granted.
    expect(state.players[0].hand).toHaveLength(HAND_SIZE + 1);
    expect(state.players[0].deck).toHaveLength(
      STARTING_DECK.length - HAND_SIZE - 1,
    );
    expect(state.players[0].mana).toBe(1);
    expect(state.activePlayerIndex).toBe(0);
    expect(state.winner).toBeUndefined();
  });

  it("gives every card copy a unique uid", () => {
    const state = initialState();
    const uids = state.players.flatMap((p) =>
      [...p.hand, ...p.deck].map((c) => c.uid),
    );
    expect(new Set(uids).size).toBe(uids.length);
  });
});

describe("canPlay / canAfford", () => {
  it("blocks playing on the opponent's turn or a blocked entry cell", () => {
    const state = emptyState();
    expect(canPlay(state, 0, 0)).toBe(true);
    expect(canPlay(state, 0, 1)).toBe(false); // not the active player
    const blocked = { ...state, minions: [minion({ card: "bush", owner: 0 })] };
    expect(canPlay(blocked, 0, 0)).toBe(false); // entry cell occupied
  });

  it("checks mana against the card cost", () => {
    const state = emptyState();
    state.players[0].mana = 2;
    expect(canAfford(state, 0, "bush")).toBe(true); // cost 1
    expect(canAfford(state, 0, "lion")).toBe(false); // cost 5
  });
});

describe("play", () => {
  it("summons a minion and spends its mana", () => {
    const base = emptyState();
    base.players[0].hand = [{ uid: 7, card: "lion" }];
    base.players[0].mana = 5;
    const next = play(base, 0, 7, 2);
    expect(next.players[0].hand).toHaveLength(0);
    expect(next.players[0].mana).toBe(0); // 5 - lion cost 5
    expect(next.minions).toHaveLength(1);
    expect(next.minions[0]).toMatchObject({
      uid: 7,
      lane: 2,
      cell: entryCell(0),
      hp: CARDS.lion.hp,
      summoned: true,
    });
  });

  it("is a no-op when the card is unaffordable", () => {
    const base = emptyState();
    base.players[0].hand = [{ uid: 7, card: "lion" }];
    base.players[0].mana = 1;
    expect(play(base, 0, 7, 0)).toBe(base);
  });
});

describe("resolveTurn", () => {
  it("holds a freshly summoned minion, then walks it next turn", () => {
    const state: GameState = {
      ...emptyState(),
      minions: [minion({ uid: 1, card: "bush", owner: 0, summoned: true })],
    };
    // Seat 0's turn resolves: the summoned minion wakes but does not move.
    const woken = resolveTurn(state).state;
    expect(woken.minions[0].cell).toBe(0);
    expect(woken.minions[0].summoned).toBe(false);
    // Back to seat 0: now it walks bush's movement (2) forward.
    const walked = resolveTurn({ ...woken, activePlayerIndex: 0 }).state;
    expect(walked.minions[0].cell).toBe(CARDS.bush.movement);
  });

  it("clashes two facing minions, dealing attack as damage", () => {
    const state: GameState = {
      ...emptyState(),
      minions: [
        minion({ uid: 1, card: "lion", owner: 0, lane: 0, cell: 2 }), // atk 5
        minion({ uid: 2, card: "wizard", owner: 1, lane: 0, cell: 3 }), // hp 4
      ],
    };
    const { state: after, fighters } = resolveTurn(state);
    // Lion (5 atk) kills wizard (4 hp); lion survives with hp - wizard atk.
    const survivor = after.minions.find((m) => m.uid === 1);
    expect(after.minions.find((m) => m.uid === 2)).toBeUndefined();
    expect(survivor?.hp).toBe(CARDS.lion.hp - CARDS.wizard.atk);
    expect(fighters.map((f) => f.uid).sort()).toEqual([1, 2]);
  });

  it("spends the boss's hp on a raid instead of milling", () => {
    const state: GameState = {
      ...emptyState(),
      minions: [
        minion({ uid: 1, card: "lion", owner: 0, cell: LANE_CELLS - 1 }),
      ],
    };
    state.players[1] = { deck: [], hand: [], mana: 0, maxMana: 0, hp: 10 };
    const { state: after } = resolveTurn(state);
    expect(after.players[1].hp).toBe(10 - CARDS.lion.atk);
    expect(after.winner).toBeUndefined();
    expect(after.minions).toHaveLength(0);
  });

  it("wins for the player when a raid empties the boss's hp, even mid-deck-out", () => {
    const state: GameState = {
      ...emptyState(),
      minions: [
        minion({ uid: 1, card: "lion", owner: 0, cell: LANE_CELLS - 1 }),
      ],
    };
    state.players[1] = { deck: [], hand: [], mana: 0, maxMana: 0, hp: 3 };
    // The player's own deck is dry: the lethal raid still outranks any
    // deck-out, so the tie goes to the player.
    state.players[0].deck = [];
    expect(resolveTurn(state).state.winner).toBe(0);
  });

  it("never decks the boss out", () => {
    const state = emptyState();
    state.players[1] = { deck: [], hand: [], mana: 0, maxMana: 0, hp: 10 };
    const { state: after } = resolveTurn(state);
    expect(after.winner).toBeUndefined();
    expect(after.activePlayerIndex).toBe(1);
  });

  it("raids the enemy deck when a minion reaches their face", () => {
    const enemyDeck = STARTING_DECK.map((card, i) => ({ uid: 100 + i, card }));
    const state: GameState = {
      ...emptyState(),
      minions: [
        minion({
          uid: 1,
          card: "lion",
          owner: 0,
          lane: 0,
          cell: LANE_CELLS - 1,
        }),
      ],
    };
    state.players[1].deck = enemyDeck;
    const { state: after } = resolveTurn(state);
    // Lion mills atk (5) cards, then leaves the board; the enemy also draws 1
    // as their turn begins, so the deck shrinks by 5 + 1.
    expect(after.players[1].deck).toHaveLength(
      enemyDeck.length - CARDS.lion.atk - 1,
    );
    expect(after.minions).toHaveLength(0);
  });
});

describe("boss actions", () => {
  /** emptyState with seat 1 turned into the boss at the given power, on its
   *  own turn — the posture every boss action resolves from. */
  function bossTurn(power: number): GameState {
    const state = emptyState();
    state.players[1] = {
      deck: [],
      hand: [],
      mana: 0,
      maxMana: 0,
      hp: 10,
      power,
    };
    return { ...state, activePlayerIndex: 1 };
  }

  it("pre-rolls a summon telegraph for the boss's first turn", () => {
    const state = initialState();
    expect(state.telegraph).toBe("summon");
    expect(state.players[1].power).toBe(0);
  });

  it("grows the boss's power when its turn comes around", () => {
    const state = emptyState();
    state.players[1] = {
      deck: [],
      hand: [],
      mana: 0,
      maxMana: 0,
      hp: 10,
      power: 0,
    };
    const { state: after } = resolveTurn(state);
    expect(after.players[1].power).toBe(1);
  });

  it("hard-forces summon through the safe runway", () => {
    // The roll while power is T decides turn T+1; turns 1-3 must all be
    // summons no matter what the RNG says.
    for (const power of [0, 1, 2])
      expect(chooseBossAction(bossTurn(power))).toBe("summon");
  });

  it("spends the whole summon budget on boss-owned minions", () => {
    const { state: after, summoned } = bossSummon(bossTurn(3));
    const cost = summoned.reduce((sum, card) => sum + CARDS[card].cost, 0);
    expect(cost).toBe(3);
    expect(after.minions.length).toBe(summoned.length);
    for (const m of after.minions) {
      expect(m.owner).toBe(1);
      expect(m.cell).toBe(entryCell(1));
      expect(m.summoned).toBe(true);
      expect(m.uid).toBeGreaterThanOrEqual(910);
    }
    expect(after.nextUid).toBe(910 + summoned.length);
  });

  it("fizzles a summon with no budget", () => {
    const state = bossTurn(0);
    const { state: after, summoned } = bossSummon(state);
    expect(summoned).toHaveLength(0);
    expect(after).toBe(state);
  });

  it("volleys the frontmost player minion per lane and mills empty lanes", () => {
    const state = bossTurn(1);
    state.minions = [
      // Lane 0: bush (1 hp) in front at cell 3 dies to the volley's 1 damage;
      // the zombie behind it is not the frontmost and is spared.
      minion({ uid: 1, card: "bush", owner: 0, lane: 0, cell: 3 }),
      minion({ uid: 2, card: "zombie", owner: 0, lane: 0, cell: 1 }),
      // Lane 1 holds only a boss minion: no friendly fire, and the lane still
      // counts as open for the mill.
      minion({ uid: 3, card: "blob", owner: 1, lane: 1, cell: 5 }),
    ];
    const after = volley(state);
    expect(after.minions.find((m) => m.uid === 1)).toBeUndefined();
    expect(after.minions.find((m) => m.uid === 2)?.hp).toBe(CARDS.zombie.hp);
    expect(after.minions.find((m) => m.uid === 3)?.hp).toBe(CARDS.blob.hp);
    // Lanes 1-3 have no player minion: each mills VOLLEY_MILL (1) card.
    expect(after.players[0].deck).toHaveLength(5 - 3 * VOLLEY_MILL);
  });

  it("fireballs straight into the player's deck", () => {
    const after = fireball(bossTurn(1));
    expect(after.players[0].deck).toHaveLength(5 - FIREBALL_MILL);
  });
});
