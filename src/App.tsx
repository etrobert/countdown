import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import Board from "./Board.tsx";
import Card from "./Card.tsx";
import Deck from "./Deck.tsx";
import Draft from "./Draft.tsx";
import Hand from "./Hand.tsx";
import { CLASH_MS, type MinionAttack } from "./Minion.tsx";
import Mana from "./Mana.tsx";
import Remove from "./Remove.tsx";
import { CARDS, STARTING_DECK, type CardId } from "./balance.ts";
import { useDrag } from "./drag.ts";
import { cn } from "./lib/utils.ts";
import { playSummonSound } from "./sound.ts";
import {
  chooseSummon,
  initialState,
  play,
  resolveTurn,
  step,
  type GameState,
  type Minion,
} from "./state.ts";

// Seats. The local player's hand is face-up and draggable; the enemy's is a row
// of card backs. Only two seats today — the board is two-sided — but GameState
// holds a list, so adding more later is a layout problem, not a state one.
const YOU = 0;
const ENEMY = 1;

/** Applies a state update inside a View Transition when the browser supports
 *  one. Every card and minion carries a stable `view-transition-name` keyed by
 *  its uid, so the browser snapshots each one's old and new box and animates
 *  the difference — a drawn card slides from the deck into the hand, a played
 *  card from the hand onto the board, with no measurement code of our own.
 *  `flushSync` forces React to apply the update synchronously, which is the
 *  DOM change the transition captures. */
function withViewTransition(update: () => void) {
  if (!document.startViewTransition) return update();
  document.startViewTransition(() => flushSync(update));
}

/** A promise that resolves after `ms`, so turn beats can be spaced out with
 *  plain `await` instead of nested timeout callbacks. */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Turn each fighter into the bump it plays: everyone strikes the way it
 *  faces — clashers into each other, a milling raider into the deck at the
 *  enemy face. */
function attacksFor(fighters: Minion[]) {
  return new Map<number, MinionAttack>(
    fighters.map((m) => [m.uid, step(m.owner)]),
  );
}

export default function App() {
  const [state, setState] = useState(initialState);
  // The run deck: your decklist for the current battle, growing by one at each
  // draft. Battles reset; this is the only thing that carries across them.
  const [runDeck, setRunDeck] = useState<CardId[]>(STARTING_DECK);
  // Which screen is up. "battle" is the game itself; after a win the two
  // between-battles steps run in order — "draft" (add a card) then "remove"
  // (trim the deck) — before the next battle.
  const [phase, setPhase] = useState<"battle" | "draft" | "remove">("battle");
  // While set, the board plays these blows (keyed by uid) and input is blocked;
  // the game state stays put until the animation ends and the outcome commits.
  const [attacks, setAttacks] = useState<Map<number, MinionAttack> | null>(
    null,
  );
  // Set when you try to drop a card you can't afford; passed to your mana bar
  // so it pulses red, and cleared once the pulse ends.
  const [manaFlash, setManaFlash] = useState(false);
  const { drag, dragUid, start } = useDrag(state, setState, YOU, () =>
    setManaFlash(true),
  );

  const you = state.players[YOU];
  const enemy = state.players[ENEMY];
  const yourTurn = state.activePlayerIndex === YOU;
  const busy = attacks !== null;
  // Once a seat decks out the battle is over. The state layer freezes itself —
  // canPlay and resolveTurn both no-op past this point — so `over` only feeds
  // what the player sees: the scrim and the End Turn button's disabled look.
  const over = state.winner !== undefined;
  const youWon = state.winner === YOU;

  // Resolve one player's turn from the given state and return the outcome. If
  // blows land, hold the board and play the bumps, then commit the outcome
  // inside a View Transition so movement and deaths morph; if none land, just
  // commit. The board doesn't change until the commit, so the held frame is
  // simply the current one with the bumps layered.
  async function playTurn(current: GameState): Promise<GameState> {
    const { state: resolved, fighters } = resolveTurn(current);
    const next = attacksFor(fighters);
    if (next.size > 0) {
      setAttacks(next);
      await sleep(CLASH_MS);
    }
    withViewTransition(() => {
      setAttacks(null);
      setState(resolved);
    });
    return resolved;
  }

  // End the human's turn, then drive the enemy's one beat at a time so the
  // player can follow along: your minions act, then a second later the enemy
  // summons, and a second after that its minions act back to you. Each beat is
  // computed from the previous one with the pure state functions — the
  // closure's `state` is only fresh at click time — which is also how the
  // enemy's pick surfaces here to sound its clip. Off-turn plays can't land
  // mid-sequence: `canPlay` rejects them once the first beat hands the turn
  // to the enemy, and the hand stops dragging while it isn't your turn.
  // A deck-out on the first beat ends the battle, so the enemy takes no turn.
  async function handleEndTurn() {
    const afterEnd = await playTurn(state);
    if (afterEnd.winner !== undefined) return;
    await sleep(1000);
    // Summon until nothing more can be played: chooseSummon returns null once
    // mana, hand, or open lanes run out, so the enemy spends its whole turn
    // rather than a single card. Each summon is its own beat — animate, sound,
    // pause — so the player can follow the board filling up.
    let afterSummon = afterEnd;
    for (
      let choice = chooseSummon(afterSummon, ENEMY);
      choice;
      choice = chooseSummon(afterSummon, ENEMY)
    ) {
      afterSummon = play(afterSummon, ENEMY, choice.uid, choice.lane);
      const summoned = afterSummon;
      withViewTransition(() => setState(summoned));
      playSummonSound(choice.card);
      await sleep(1000);
    }
    await playTurn(afterSummon);
  }

  // Space and F1 end the turn, mirroring the End Turn button: they fire only
  // when it's your turn and nothing is animating, over, or between battles —
  // the same guard the button's `disabled` uses. preventDefault stops the space
  // bar from scrolling and F1 from opening the browser's help.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== " " && event.key !== "F1") return;
      if (!yourTurn || busy || over || phase !== "battle") return;
      event.preventDefault();
      handleEndTurn();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // Re-registers each render so the handler closes over fresh state; the
    // listed deps are the values that gate whether the key does anything.
  }, [yourTurn, busy, over, phase, state]);

  // Leave the between-battles steps and start the next battle with the given
  // decklist — the deck left after adding and removing.
  function nextBattle(deck: CardId[]) {
    setRunDeck(deck);
    setState(initialState(deck));
    setPhase("battle");
  }

  // The draft adds the picked card straight to the run deck, then hands off to
  // the remove step; a pass carries the deck through unchanged. The remove step
  // trims the run deck as it stands after the add.
  if (phase === "draft")
    return (
      <Draft
        onPick={(card) => {
          setRunDeck([...runDeck, card]);
          setPhase("remove");
        }}
        onPass={() => setPhase("remove")}
      />
    );

  if (phase === "remove")
    return <Remove deck={runDeck} onConfirm={nextBattle} />;

  return (
    <main
      className={cn(
        "relative grid min-h-screen grid-rows-[auto_1fr_auto] justify-items-center bg-parchment text-ink",
        drag && "cursor-grabbing select-none",
      )}
    >
      <Hand cards={enemy.hand} faceDown />
      {/* Decks flank the board at the ends they defend: yours on the left,
          where your minions spawn and march right; the enemy's on the right.
          Each deck's mana bar sits just below its stack. */}
      <div className="flex items-center gap-8">
        <div className="grid justify-items-center gap-3">
          <Deck
            count={you.deck.length}
            topUid={you.deck[0]?.uid}
            className="relative"
          />
          <Mana
            state={state}
            playerIndex={YOU}
            flash={manaFlash}
            onFlashEnd={() => setManaFlash(false)}
          />
        </div>
        <Board
          minions={state.minions}
          attacks={attacks ?? undefined}
          dragging={drag !== null}
          dragLane={drag?.lane ?? null}
        />
        <div className="grid justify-items-center gap-3">
          <Deck
            count={enemy.deck.length}
            topUid={enemy.deck[0]?.uid}
            className="relative"
          />
          <Mana state={state} playerIndex={ENEMY} />
        </div>
      </div>
      <Hand
        cards={you.hand}
        dragging={dragUid}
        onDragStart={busy || !yourTurn ? undefined : start}
      />
      <div className="absolute right-10 bottom-28 text-right font-bold text-ink">
        {yourTurn ? "Your turn" : "Enemy turn"}
      </div>
      <button
        type="button"
        onClick={handleEndTurn}
        disabled={!yourTurn || busy || over}
        className={cn(
          "absolute right-10 bottom-12 rounded-md bg-ink px-4 py-2 font-bold text-parchment transition-transform duration-150",
          yourTurn && !busy && !over
            ? "cursor-pointer hover:-translate-y-1"
            : "cursor-not-allowed opacity-40",
        )}
      >
        End Turn
      </button>
      {drag && (
        // Follows the pointer and stays out of hit-testing so lanes underneath
        // register the hover and drop.
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rotate-0 scale-105"
          style={{ left: drag.x, top: drag.y }}
        >
          <Card card={CARDS[drag.instance.card]} />
        </div>
      )}
      {over && (
        // A scrim over the frozen board. A win leads on to the draft and the
        // next battle; a loss is terminal — reload to play again for now.
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-ink/60">
          <p className="font-bold text-6xl text-parchment">
            {youWon ? "You win" : "You lose"}
          </p>
          {youWon && (
            <button
              type="button"
              onClick={() => setPhase("draft")}
              className="cursor-pointer rounded-md bg-parchment px-4 py-2 font-bold text-ink transition-transform duration-150 hover:-translate-y-1"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </main>
  );
}
