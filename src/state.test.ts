import { describe, expect, it } from "vitest";
import {
  canAfford,
  canPlay,
  entryCell,
  initialState,
  play,
  resolveTurn,
  step,
  type GameState,
  type Minion,
} from "./state.ts";
import { CARDS, HAND_SIZE, LANE_CELLS, STARTING_DECK } from "./balance.ts";

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
  it("deals a hand and takes seat 0's opening turn", () => {
    const state = initialState();
    expect(state.players).toHaveLength(2);
    // Seat 1 is dealt but idle: a clean starting hand.
    expect(state.players[1].hand).toHaveLength(HAND_SIZE);
    expect(state.players[1].deck).toHaveLength(
      STARTING_DECK.length - HAND_SIZE,
    );
    // Seat 0 opened its turn, drawing one card for the turn: hand grows by one,
    // deck shrinks by one, and mana is granted; seat 1 still waits at zero.
    expect(state.players[0].hand).toHaveLength(HAND_SIZE + 1);
    expect(state.players[0].deck).toHaveLength(
      STARTING_DECK.length - HAND_SIZE - 1,
    );
    expect(state.players[0].mana).toBe(1);
    expect(state.players[1].mana).toBe(0);
    expect(state.activePlayerIndex).toBe(0);
    expect(state.winner).toBeUndefined();
  });

  it("gives every card copy a unique uid across both players", () => {
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
