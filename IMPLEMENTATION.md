# Countdown — Boss-fight MVP: implementation plan

Single source of truth for building the boss-pivot prototype. Rationale and the
full brainstorm live in [BALANCE.md](BALANCE.md) §#9; this file is what an
implementer (human or agent) follows. Goal: a **playable build to playtest
boss-vs-mirror within a few hours**, split into small independently-testable
commits.

---

## 0. The pivot in one paragraph

Replace the symmetric AI-with-a-deck with a **boss**: it has HP and telegraphs one
action per turn. The player wins by dropping boss HP to 0 before their own deck
runs out. Two clocks race: boss HP ↓ vs player deck ↓. Damage to the boss already
exists (`raid()` in `state.ts:178`); the work is giving the enemy an HP pool +
telegraphed actions instead of a mirror deck.

## 1. Locked decisions (validated 2026-07-24)

1. **Boss resource model:** the boss has **`hp` only** — no deck, no hand, no
   draw, no mana. Its actions are **free**. Summon pulls from a **hard-coded card
   list**, not a hand. `startTurn` is never called on the boss.
2. **Win/lose:** player wins when boss `hp <= 0` (checked inside `raid`). The
   existing deck-out loss (`resolveTurn:255`) applies to the **player only** — it
   must be suppressed for the boss seat (a boss with no deck must not "deck out").
3. **Clock re-budget:** take **less damage** and **lower boss HP** than the
   brainstorm's 16-20. First player hit can't land before ~turn 4 (a minion walks
   all `LANE_CELLS = 4` cells). Start boss HP low (~10-12) and keep boss milling
   gentle so fights last ~8-11 turns.
4. **Isolate the variable:** **Build 1 (Phase 1) ships the boss pivot on the
   CURRENT economy** (current mana ramp, `HAND_SIZE = 5`, symmetric summoning
   sickness). This keeps the playtest a clean boss-vs-mirror comparison. The
   economy overhaul (draw-on-demand, instant units, mana tweak) is **Phase 2**, a
   separate layer.
5. **A damaging boss threat ships in Build 1** (a minimal AoE volley) — without it
   the boss can't defend 4 lanes and there's no race to feel.

## 2. Scope

**In (Phase 1 — the testable build):** single boss, single battle; boss `hp`;
telegraphed action rotation = **summon + AoE volley + occasional fireball**; win
on boss `hp <= 0`; boss-HP readout + one-line telegraph text; existing win/lose
scrim reused.

**Phase 2 (economy layer, separate build):** `MAX_MANA = 5`, start mana 3,
`HAND_SIZE = 4`; draw-on-demand (1 auto + 1 voluntary/turn, life-for-cards);
asymmetric summoning sickness (player instant, boss keeps it).

**Phase 3 (optional):** buff as action-magnitude escalation (volley/fireball
2→3), escalation tick.

**Out (do not build):** 3-boss arc, between-battle flow, deck carryover
(Decision B), multi-turn telegraph wind-ups, any new art, AoE VFX/animation,
minion-stat buffs.

## 3. Mechanics spec (precise — take these defaults, tune in-session)

- **Boss turn order:** (1) resolve the previously-telegraphed action, (2) step
  boss minions (existing loop), (3) roll + display the next telegraph. Reveal at
  end of boss turn, resolve on the boss's next turn (never resolve the turn it's
  shown).
- **Safe runway:** turns 1-3 **hard-force** a non-damaging action (summon only),
  overriding the RNG roll — blunts unwinnable openings.
- **Action selection:** RNG over the action pool (uniform to start), pre-rolled
  and stored in one `GameState` field. If a rolled action is illegal (e.g. summon
  with every lane blocked) → **fizzle** ("boss falters"), don't re-roll.
- **Volley (AoE):** frontmost **player** unit in each lane takes 2; a lane with
  **no player unit** mills the player 2. No friendly fire on boss summons.
- **Fireball:** mills the player 2. **Rare**, and excluded from the safe runway (a
  deck hit has no board counterplay, so keep it a gut-punch, not a staple).
- **Summon:** create a boss-owned minion from a hard-coded `CardId` (reuse the
  minion-creation half of `play()`, skip hand/mana). Boss minions **keep**
  summoning sickness and still march + `raid` the player's deck as today.
- **Tie** (boss hits 0 the same turn the player would deck out): **player wins**
  (lethal is an active play; it beats the passive start-of-turn deck-out check).
- **Starting numbers:** boss HP **10-12**, volley 2, fireball 2 (rare). Adjust
  after game 1 — numbers are ~free to settle.

## 4. File-by-file plan (grounded in current code)

- `balance.ts` — Phase 1: add `BOSS_HP`, volley/fireball damage consts. Phase 2:
  `MAX_MANA` 10→5, `HAND_SIZE` 5→4, starting-mana const.
- `state.ts`:
  - `hp` (and Phase 2 `drewThisTurn`) on `Player`; seat 1 is the boss when `hp`
    is set.
  - `raid()` (`state.ts:178`) branches: boss target → `hp -= atk` **and set
    `winner` if `hp <= 0`**; player target → existing `deck.slice`.
  - `resolveTurn()` (`state.ts:255`): **skip the deck-out loss for the boss
    seat**; do not `startTurn` the boss.
  - New: `chooseBossAction()` (rotation + safe runway), `bossSummon()`,
    `volley()`, `fireball()`; `telegraph` field on `GameState`.
  - Phase 2: export `drawVoluntary()` (reuses `drawCard`, guards `drewThisTurn`,
    reset in `startTurn`); asymmetric `summoned` = (owner is boss) in `play()`
    (`state.ts:316`) / read in `stepMinion` (`state.ts:215`).
- `App.tsx` — **the enemy driver** (`handleEndTurn`, `App.tsx:101-115`): replace
  the `chooseSummon` call with the boss-action dispatch + telegraph advance.
  Phase 1 UI: swap the enemy `Deck` (`App.tsx:143-150`) for a boss-HP readout;
  add the telegraph text line (reuse the absolute-div pattern at `App.tsx:157`).
  Phase 2: pass `onDraw={drawVoluntary}` to the player `Deck` (`App.tsx:130`),
  disabled when `drewThisTurn` or deck empty.
- `Minion.tsx`, `Deck.tsx` — **no change** (Deck already accepts `onDraw`;
  the "zzz" already reads `minion.summoned`).

## 5. Commit plan (for splitting the work)

Each commit compiles and, where marked, is playable. Commits within a phase touch
mostly disjoint areas → **parallelisable across agents** (merge order as listed).

**Phase 1 — boss pivot (playable at the end):**
1. `feat(state): boss hp model` — `hp` on Player, `raid` branch + `hp<=0` winner
   check, suppress boss deck-out, no `startTurn` for boss.
2. `feat(state): boss actions + telegraph` — `chooseBossAction` (RNG + turns-1-3
   safe runway), `telegraph` field, `bossSummon` / `volley` / `fireball`.
3. `feat(app): boss turn driver` — rewrite the enemy beat in `handleEndTurn` to
   resolve the telegraphed action, step boss minions, roll the next telegraph.
   ⚠️ hardest spot #2.
4. `feat(app): boss HP + telegraph UI` — boss-HP readout, telegraph text line.
   **← playtest build 1 here.**

**Phase 2 — economy layer (separate playtest):**
5. `balance: mana curve` — `MAX_MANA=5`, start 3, `HAND_SIZE=4`.
6. `feat: draw-on-demand` — `drawVoluntary` + `drewThisTurn` + Deck `onDraw`
   wiring.
7. `feat: asymmetric summoning sickness` — player units instant, boss keeps it.

**Phase 3 — optional:**
8. `feat: boss escalation` — `bossPower` + buff action scaling volley/fireball.

## 6. The two hard spots (where the time goes)

1. **Boss-death detection mid-`resolveTurn`.** Boss `hp` hits 0 *during the
   player's minion fold* (`resolveTurn:246-250`), a different moment from the
   existing start-of-turn deck-out loss (`:255`). Add the check right after the
   fold; the two win/lose branches must not stomp each other (player-lethal wins
   ties).
2. **Rewriting the async enemy driver** in `App.tsx handleEndTurn` — today a
   hand-rolled sequence (`sleep`/`withViewTransition`/`playSummonSound`) with no
   reusable dispatcher. Keep the animation seams; swap the decision source.

Everything else is small: voluntary-draw UI half-exists, summoning-sickness
asymmetry is ~1 line, `fireball` is a `deck.slice` one-liner. **Deceptively
cheap:** `volley` is a *new* sourceless AoE (not a `clash` reuse) and has **no
animation channel** → ship it with **no VFX** (text telegraph + instant state
change).

## 7. Definition of done for the playtest

Build 1 is done when: the enemy is a boss with visible HP; each turn shows a
telegraphed next action; summon/volley/fireball resolve on their turn; player
minions reduce boss HP via `raid`; player wins at boss HP 0 and loses on their own
deck-out; runs on the current economy. Then: play one game, tune boss HP, and
answer the one question — **does racing the boss beat the mirror?**
