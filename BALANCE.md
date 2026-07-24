# Balance

Single capture point for every balance idea, tension, and mechanic worry.
Nothing gets debated twice: it lives here, tagged, until it's tranché.

## Current state (2026-07-23)

Core is playable: draft works, the 3 battles exist (**not balanced**), all 15
characters exist but are **vanilla — flavor is the gap**.

So the balance work is now a **card-identity problem**, not a raw-numbers one.
Discipline: find the *smallest* keyword set that makes 15 characters feel
distinct — not every keyword below.

- Most of the 15 get identity from **stat spread** (glass cannon / wall / fast
  skirmisher — free, we have stats + movement) + the **2 existing keywords**
  (Breach, Blood price).
- Reserve the splashy ideas (#6 bomb, #7 junk-seed, #8 accelerator) for 3–4
  **signature** cards only. Keeps the cross-product tiny.
- Battle balancing (the 3 decks, #10) is now live — settle by playtest.

Open structural question **#9** (win-all/lose-all) still comes first: it changes
what "flavor" even needs to do across a run.

## The one filter

Every item is judged against the north-star from [DESIGN.md](DESIGN.md):

> **Do you get stronger, or do you live longer?**

If an idea doesn't sharpen that tension → `cut` or `park`. No debate needed.

## How things get tranché

- **grill** — structural / contradictory calls (add-remove a keyword, change the
  loop). We stress-test one at a time, commit, never reopen.
- **playtest** — any number. All numbers live in `src/balance.ts`, so a
  disagreement is ~free to settle: change the value, play a game, data wins.
  Hard cap: ~5 min of arguing a number before we just test it.
- **north-star** — if it fails the filter above, it dies here.

## Tags

- `[contradiction]` — a real decision; two options can't coexist. → grill
- `[todo]` — known-needed, not built yet. A task, not a debate. → queue
- `[bug-seen]` — problem observed in an actual playtest. → fix
- `[bug-theory]` — problem we suspect but haven't seen. → park until a playtest proves it

Status column: `open` · `grilling` · `tranché` · `parked` · `cut`

## Backlog

| # | Idea / concern | Tag | Tranché by | Status | Notes |
| - | -------------- | --- | ---------- | ------ | ----- |
| 1 | High-movement minions are auto-include — always the first draft pick | `bug-seen` | playtest | open | Dominant stat flattens the north-star choice. Test in `balance.ts`: price movement in mana, cap it, or trade it against ATK/HP. |
| 2 | Keyword: extra damage to the deck on connect | `todo` | — | cut | **Duplicate of Breach** (DESIGN.md). Already covered. |
| 3 | Keyword: sacrifice cards to play a stronger card | `contradiction` | grill | open | Overlaps **Blood price**. Only open decision: sacrifice from **hand or deck**? Different feel — decide, don't hold both. |
| 4 | Keyword: seed junk cards into your deck/hand → survivability | `todo` | playtest | open | Pure north-star play (live longer). Mirror-image of Blood price → the two together sharpen the tension. Decide deck-vs-hand placement. |
| 5 | New card type: spells (some carrying sacrifice effects) | `contradiction` | grill | park | **Biggest scope call.** A whole new card type explodes the cross-product DESIGN.md deliberately avoids. Grill: is a spell type worth its jam cost? |
| 6 | Strong card that seeds a mediocre card into the enemy deck | `todo` | playtest | open | Signature-card candidate.  Careful: enemy deck = enemy life. Adding a card makes them **live longer** — the downside is real. Interesting economy hook. |
| 7 | Card that plants a "bomb" in the enemy deck | `todo` | playtest | open | Signature-card candidate.  Fires when drawn/milled. Interacts with mill order — needs the core mill loop stable first. |
| 8 | Board accelerator; global speed ramps as the game advances | `todo` | grill | open | Signature-card candidate.  On-theme (Countdown) but may be **redundant with the mana ramp + baseline mill**. Grill vs playtest depending on overlap. |
| 9 | Win-all / lose-all each battle → no attrition stakes → fun risk | `contradiction` | playtest → grill | parked | **Contradicts the acted "deck reset / no soft-lock" decision (DESIGN.md).** Deferred until engine is done. Etienne isn't convinced the problem exists → grill is premature; it sharpens a position, it can't manufacture evidence. Unblock = shared playtest data first, then grill anti-soft-lock vs run-level attrition. Open sub-problem: no clear idea yet how to port Slay-the-Spire HP-attrition into a deck-is-life model. |
| 10 | Enemy decks should be thematic (mirror & random both feel flat) | `todo` | playtest | open | Aligns with the 3 authored AI decks already planned. Known hard tradeoff: thematic vs balanced — resolve empirically per deck. **Potentially subsumed by the #9 boss pivot below (no enemy deck at all).** |

---

## #9 — Exploration: boss fight + attrition

> Status: exploratory, not adopted. Deferred until engine done + shared playtest.
> Etienne unconvinced the underlying problem exists (see backlog #9).

**Two correlated but SEPARATE decisions — develop together, decide in sequence:**

- **Decision A — adopt the boss pivot?** Decidable on logic + the one-session
  mirror experiment. Strong, near-independent. Do NOT bundle it with B.
- **Decision B — add carried-over-deck attrition on top?** Contested (Etienne),
  decidable only by playtest feel. **Gated on A**: the boss's fireball is already
  in-battle attrition, so you can't judge whether B is *also* needed until the
  boss exists. Sequence: ship/prove A → feel the fireball × 3-boss arc → then
  decide B.

Bundling them lets the contested B sink the adoptable A. Keep them apart.

### The pivot: fight a boss, not a mirror

Stop fighting an AI with its own deck. Fight a **monster** that telegraphs one
**announced action per turn** (Slay-the-Spire style). The monster has **HP**;
you must drop it to zero **before your own deck runs out**. Two visible clocks
racing: boss HP down vs your deck down.

**Boss actions (rotating, telegraphed):**

- Summon a creature onto the board.
- **Arrow volley** — 2 dmg to the first unit of each lane; 2 dmg to us if the
  lane is empty.
- **Fireball** — hits our deck directly, burns 2 cards.
- **Buff** — raise its own damage, or its units' damage.

**Player economy shift:** start with **more energy** than today → in the action
from turn 1, it's a race to kill it. 1-mana units are already strong (good HP,
easy to play) so the early board is live immediately.

### Why this is strong (what it solves for free)

- **Kills #10 outright** — no enemy deck to balance, no mirror, no random.
  Difficulty is authored entirely into boss actions/HP. Thematic *and* tunable.
- **Sharpens the north-star** — "stronger vs longer" becomes literal: race the
  boss down (stronger) or outlast its deck-burn (longer).
- **Preserves the Countdown theme** — your deck is still the clock; the boss just
  gives it a face to race.

### The two mechanics are SEPARABLE (key point)

1. **The boss fight** — self-contained, solves #10, adoptable on its own.
2. **Permanent card burn** — cards from our deck that **burn forever** on certain
   combat events. This is the *run-level attrition* piece. **Etienne dislikes
   this one specifically.**

Don't let #2 sink #1. The boss pivot can ship even if permanent-burn never does.

### The crux (this is almost certainly Etienne's real objection)

Permanent burn = attrition = **it reintroduces the soft-lock risk that
deck-reset was designed to remove** (DESIGN.md: "a bad battle can never
soft-lock a run"). That's the exact wall #9 always ran into. So permanent-burn
needs a soft-lock floor to survive — e.g. burn only *within* a battle, or the
between-battle draft always refills, or a hard minimum deck size.

### Answered from dev (2026-07-24)

**The structural case for the boss — an argument, not a feeling.** At parity the
symmetric mirror is *mathematically player-losing*: if the AI played exactly like
us, all units trade and it wins because **we mill first** (we're on the
countdown). The game only stands today because the AI is dumb → too easy. A tuned
AI winning via such a simple, always-accessible line still isn't fun. The boss
pivot removes symmetry entirely, so both the mill-first disadvantage *and* the
dumb-AI crutch vanish; difficulty becomes authored. **This needs no "fun"
playtest to land — it's a logic flaw in the current model.**

→ **Deadlock-ender (one session):** force the AI (or two humans) to play the
mirror *optimally*. If the mill-first player reliably loses, the current model is
proven broken independent of balance. That's the evidence that converts Etienne —
a single test, not a long playtest.

**Attrition — reframed.** What's wanted is the StS carried-HP feel: a resource
that degrades *between* battles; finishing near-dead = likely doomed next fight.
In deck-is-life, the clean analog is **not** event-based "burn forever" (random,
punishing, hard to draft around). It's: **the deck no longer fully resets between
battles — it carries over, and the draft is the "heal."**

- Systematic (you draft around it), not random.
- Built-in anti-soft-lock floor: the draft can guarantee a minimum deck size.
- Etienne's objection may be to *random permanent loss*, not to *carried
  attrition* per se — pitch it in this form and the disagreement may dissolve.

### Still open

- Exact anti-soft-lock floor for carried-over decks (min size? guaranteed draft?).
- Does fireball (in-battle burn) × 3 escalating bosses already carry enough arc,
  or is carried-over-deck attrition also needed on top?

---

## #9 — Boss brainstorm synthesis (2026-07-24)

Merged from a 4-lens brainstorm (identities · race/tension · actions/telegraph ·
red-team). Red-team read `src/balance.ts` + DESIGN.md.

### ⚠️ Two findings that change the pitch

1. **The in-battle boss does NOT deliver "stronger vs longer" — it inverts it.**
   With a boss that has HP and no deck, *outlasting wins nothing*; you can only
   win by dealing damage. Turtle is a not-lose line, not a win line. What the
   boss actually delivers is a **fast-vs-safe tempo tension** (race and eat the
   volley/fireball, vs grind safe and risk decking). Real and good — but not the
   north-star. → **Reframe honestly.** Keep the true stronger-vs-longer choice in
   the **run/draft layer (Decision B)**, don't sell it on the in-battle boss.
2. **The boss can't defend 4 lanes with one action/turn.** Go-wide flood always
   leaks ≥3 lanes → boss structurally can't win. → Fix: **volley hits the whole
   lane (or front two units)**, not just the first; **low starting mana**.

### MVP boss (ship this first)

- **Channels:** lane-attack + summon-and-march spine (reuses minion code),
  sprinkle direct-deck as the scary "empty-lane punish."
- **~5-6 actions** covering every counterplay question: **Charge-Up** (2-turn
  wind-up, +vulnerable window — top ROI), **Skewer** (single-lane heavy),
  **Arrow Volley** (AoE-fixed per finding #2), **Summon + March**,
  **Self-Buff/enrage**, + one deck-attacker (Junk Seed or a *fixed* Fireball).
- **Telegraph contract:** show next action at end of turn; never resolve a
  damaging action the turn it's revealed; big actions get 2-turn wind-up.
- **Boss action selection: RNG accepted for the MVP** (dev call 2026-07-24,
  overriding the red-team's fixed-rotation rec). Still **telegraph one turn
  ahead** so the player reacts. Watch the unwinnable-opening risk (fireball-heavy
  start) — mitigate with a low-threat "safe runway" on turns 1-3.
- **Escalating buff every N turns** = guaranteed clock → kills stalls, walls,
  and the infinite draw.
- **Dual-clock shared-axis UI** (boss HP from the right, deck from the left, gap
  in the middle) + a **low-HP "last stand"** finisher for a guaranteed climax.
- **Boss HP set by brackets, not feel:** a do-nothing deck must still beat boss 1;
  an optimal-racer deck must not kill boss 3 before ~turn 6.

### 3-boss arc (identities) — each attacks a different clock

- **Boss 1 · Hourglass Warden** — punishes the BOARD (empty lanes mill you).
  Teaches "hold lanes." Cheap. HP ~16-20, forgiving.
- **Boss 2 · The Glutton / Feed** — punishes the SPEND (milling beyond baseline
  via Breach/Blood price feeds/heals the boss). Your bombs become double-edged.
  Cheap-moderate (one counter on the mill pipeline; cap the feed so it can't
  stall the race).
- **Boss 3 · Zero Hour** — punishes TIME (a visible counter ticks down alone;
  0 = you lose). Pure burst sprint, on-the-nose GMTK climax. Timer is cheap;
  phase transitions are the expensive part — cut to single-phase if time dies.
- **Cheap thematic swap — Mirror-Ender:** damage to the boss also mills your
  deck, unless the kill comes from Breach. One hook, recycles the current AI,
  very on-theme. Strong promote candidate.

### Guardrails — priority stack (from red-team)

1. **Go-wide defense** (finding #2): AoE/front-two volley + low starting mana.
2. ~~Fixed telegraphed rotation~~ **RNG accepted (dev call)** — still telegraph
   one turn ahead; keep a safe-runway (low-threat turns 1-3) to blunt
   unwinnable openings.
3. **Escalating boss buff** = guaranteed lethality clock (kills walls + draws).
4. **Honest framing** (finding #1): north-star lives in draft/run, not the boss.
5. **`MAX_MANA` → 5** (reconcile `balance.ts` with DESIGN.md's "~5").
6. **De-auto-include:** the chump-in-every-lane (2-HP volley-eater) and Lion
   (best damage-per-card racer) — both fixed by the AoE volley + movement
   pricing already tracked in backlog **#1**.
7. **Deck-size floor (≥12) and hard cap (15)** *before* shipping junk-seed (#4)
   or bomb-in-deck (#7): junk that grows the deck = infinite stall; on-mill
   triggers on your own deck = the boss's fireball helping you. Cap + floor
   neutralize both.

### Contradictions between lenses (resolved)

- North-star: lenses 1-2 assumed the boss carries stronger-vs-longer; red-team
  proved it can't. **Resolved → reframe (finding #1).**
- Fireball as sketched has no counterplay (lens 3 & 4 agree) → give it a board
  condition or make it the occasional gut-punch, not an every-turn action.
- Auto-includes (chump, Lion) route straight back to backlog **#1** — the boss
  pivot doesn't remove that problem, it re-expresses it.

### Cut-if-time-dies

Boss 3 phase transitions (→ single-phase timer), The Rot / junk-polluter boss,
lane-collapse / terrain boss, precise rate-modeling. The MVP set above already
delivers the full counterplay spread for little build cost.

### Playtest MVP — no new art, minimal diff

**Goal of the playtest:** answer *one* question — does racing a telegraphed boss
feel better than the mirror? This is a FEEL test, not a balance test; accept it's
rough. Grounded in the current code (`src/state.ts`).

**Key realisation — the damage-to-boss mechanic already exists.** `raid()`
(state.ts:178) already mills the enemy deck by a connecting minion's ATK, and the
enemy loses on deck-out (`resolveTurn`, state.ts:255). So "enemy deck = boss HP"
is already coded. The pivot just needs the enemy to stop playing a symmetric deck
and start telegraphing actions.

**MVP-lite (≈half a day, 0 new art):**
1. Boss HP = a new `hp` field on the enemy Player (cleaner than reusing
   `deck.length`, which the boss self-drains by drawing). `raid()` on the boss
   reduces `hp` instead of milling — one branch in an existing function.
2. Replace `chooseSummon` (state.ts:275) with a **fixed telegraphed rotation**
   cycled by turn number; boss summons existing cards via `play()` (existing art).
3. Telegraph = one text line ("Next: …") — one field on `GameState`, one render
   line. No art.
4. Damage to boss = `raid()` unchanged. Boss board threat (its minions walking at
   you) = reused as-is.

**MVP-plus (only if lite is promising):** add **Volley** (AoE per finding #2) and
**Fireball** as rotation entries — each reuses the `deck.slice(n)` one-liner from
`raid()` to mill the *player*. Set `MAX_MANA = 5`, low starting mana. This is the
balance test.

**Honesty flags:**
- **Buff — MVP++ only, as action-magnitude escalation** (dev call 2026-07-24):
  buff raises the boss's OWN action numbers (volley 2→3, fireball 2→3), NOT minion
  stats — dodges the `CARDS`-not-instance override problem and stays cheap. A
  minion-stat buff stays cut. Tiers: lite (feel) → plus (volley+fireball+mana) →
  plus-plus (buff on volley/fireball).

---

## #9 — MVP review (2026-07-24, 3-agent audit: coherence · difficulty · gaps)

### 🔴 Three things that change the plan

**1. Lock the boss resource model — it's currently self-contradictory.** The spec
says "separate `hp`, boss doesn't draw" AND "boss summons via `play()`" — but
`play()` needs a hand + mana + a deck to draw from. They can't both be true. AND
the old deck-out win/loss path is left intact: `raid` never checks `hp <= 0` (so
dropping the boss to 0 currently does *nothing*), while `resolveTurn` still hands
a win when the boss's deck empties — which **revives the turtle/outlast line that
finding #1 says is impossible**. → **Decision:** boss = `hp` only, **no
deck/hand/draw**; actions are **free and mana-less**; summon pulls from a
hard-coded `CardId` list; skip `startTurn` for the boss. Add a `winner` check on
`hp <= 0` inside `raid`; suppress the deck-out loss branch for the boss seat.

**2. Re-budget the clock — the 8-11 turn window collapses as specified.** The
"1-2 mill/turn → 6-11 turns" math counted only the player's *own* draws. Real
combined rate in "plus" = self-draw (up to 2) + fireball (2) + volley/raids = 4+/
turn. And the starting library is `15 − HAND_SIZE = 10`, not 15. → deck-out ~turn
2-3, far under target. Meanwhile first damage to the boss can't land before
~turn 4 (a minion must walk all `LANE_CELLS = 4` cells to `raid`). So **"a
do-nothing deck beats boss 1 at 16-20 HP" is geometrically impossible.** →
**Decision:** budget the clock with ALL mill sources + the real 10-card library;
keep fireball occasional (not every-turn RNG); set boss HP against the traversal
delay (~turn-4 first hit), and drop/relax the do-nothing bracket.

**3. The "lite" build is a foregone stomp AND confounds its own test.** Lite =
instant go-wide player units + 4 lanes + a **summon-only** boss (no AoE, one
action/turn) → the boss structurally can't defend (finding #2's own logic) → a
player walkover, and with no damaging boss action there's **no race to feel**.
Worse, lite bundles three big changes at once (boss pivot + draw-on-demand +
instant units), so a "feels better?" result can't be pinned to boss-vs-mirror —
violating the doc's own "keep variables separate" rule (A/B). → **Decision:** the
real minimum playtest needs a **damaging boss threat (a minimal AoE volley) in
the first build** — "lite" and "plus" partly merge. And **isolate the variable**:
test the boss pivot on the *current* economy first, then layer draw-on-demand as a
separate change.

### 🟢 Implementation verdict (reassuring)

Effort: **lite ≈ 3-4 half-days, +plus ≈ 2-3, +plus-plus ≈ 1** → a two-person 40h
jam lands lite+plus comfortably; plus-plus is the *least* risky tier. Risk is
concentrated in **two spots only**, not the many small edits:
- **Boss-death detection** mid-`resolveTurn` (fires during the player's fold, a
  different time than the existing start-of-turn deck-out loss — the two branches
  must not stomp each other).
- **Rewriting the async enemy driver** in `App.tsx handleEndTurn` (today a
  hand-rolled sequence, no reusable dispatcher).
Genuinely cheap (pure reuse): voluntary-draw UI **already half-exists**
(`Deck.tsx` takes `onDraw`; just export a `drawVoluntary`), summoning-sickness
asymmetry = **1 line**, fireball = a true `deck.slice` one-liner, buff = one
`bossPower` int read by two functions. Deceptively cheap: **volley is NOT a
`clash` reuse** (it's a new sourceless AoE) and there's **no animation channel**
for a sourceless AoE → ship "plus" with **no VFX** (text telegraph + instant
state change).

### Doc self-contradictions to reconcile

- **Mana:** "high/5 flat" (pitch, economy) vs "low/modest" (red-team). → Pick
  **option (b): start 3 + existing ramp, `MAX_MANA = 5`**. Reconciles both
  ("more than today's 1", still low) — set the cap *before* any economy playtest.
- **North-star (correct my own overclaim):** draw-on-demand does NOT "carry the
  north-star" — against an HP boss you still can't *win* by living longer. It's an
  intra-battle **fast-vs-safe tempo** knob. Keep true stronger-vs-longer in the
  run/draft layer (Decision B), consistent with finding #1.
- **Fireball** is specified 3 ways (every-turn / conditional / plain entry). →
  Make it **rare + excluded from the turns 1-3 safe runway** (a deck-hit has no
  board counterplay, so telegraphing it gives no agency — keep it a gut-punch,
  not a staple).
- **Escalating buff ≠ guaranteed clock under RNG** (a boss that keeps rolling
  Summon gains nothing to scale). If a hard lethality clock is wanted, make the
  tick a flat direct mill, not an action-magnitude buff.
- **Stale constants:** DESIGN.md says "3 lanes", code is `LANES = 4` (the
  go-wide/volley math depends on this) → fix DESIGN.md. `HAND_SIZE = 5` vs spec's
  "~4". "Draw = mills your deck" is loose — voluntary draw *keeps* the card
  (life-for-cards draw), it's not a burn/mill.

### Cheap defaults for the unspecified rules (take these, tune in-session)

- **Boss turn slot:** boss turn = resolve previously-telegraphed action → step
  boss minions → roll + show next telegraph. Reveal end of boss turn, resolve
  next boss turn.
- **Tie (boss 0 HP same turn player would deck out):** player wins (lethal is an
  active play; it beats the passive start-of-turn deck-out check).
- **Volley targeting:** frontmost *player* unit per lane takes 2; a lane with no
  player unit mills the player 2; no friendly fire on boss summons.
- **Voluntary draw:** life-for-cards only (no mana cost), cap 1/turn via
  `drewThisTurn`, allowed turn 1, button disabled on empty deck / already used.
- **Boss board damage:** keep BOTH marching summons (raid) AND actions — it's the
  intended pressure; tune via boss HP, not by removing a path.
- **Hand cap:** none for MVP (matches code); set `HAND_SIZE = 4`, rely on the
  1/turn draw cap to keep it near-empty.
- **Telegraph:** pre-roll + store one action in a `GameState` field; **cut
  multi-turn wind-ups from MVP** (single-turn only); hard-force turns 1-3 to
  non-damaging actions (safe runway overrides the RNG roll); illegal telegraph →
  fizzle ("boss falters").
- **Scope:** single boss, single battle, win/lose screen only. No 3-boss arc, no
  between-battle flow, no carryover (Decision B stays gated).
- **First numbers:** boss 1 HP = a low value set against ~turn-4 first-hit (start
  ~10-12, not 18); tune after game 1.
- Use a **separate `hp` field**, not `deck.length`, or the boss sabotages itself
  ~1/turn by drawing.

### Player economy (2026-07-24) — draw-on-demand carries the north-star

The proposal: high flat mana to act from turn 1; a small hand (~4) that empties
fast (≈2 plays/turn); **draw as many cards as you want, but each draw mills your
own deck = spends your life**; burn life for more options / board impact.

**Why it matters:** this is the fix for finding #1. The boss can't carry
"stronger vs longer" (outlasting wins nothing against an HP boss). But putting
draw-on-demand on the player makes *every draw* the stronger-vs-longer choice —
more impact now vs a longer clock. The north-star moves into a verb the player
touches every turn. This is the missing half of the pivot.

**Mana — three sub-options:**
- (a) **5 flat** — most "in the action turn 1", but **amplifies go-wide**
  (findings #2/#5): 5 mana turn 1 = a body in all 4 lanes, boss can't answer.
  Only viable *with* the AoE volley fix. Prefer start 3-4, not 5.
- (b) **start 3, ramp** — closest to current code (`startTurn` already ramps
  maxMana +1/round). Gentler opening, least blowout. Safest.
- (c) **3 flat + mana-generating units** — a separate engine + a new draft axis.
  **Scope — defer**, not for the first playtest.

**In the MVP:** draw-on-demand is the thing worth testing (it's the north-star
carrier), and it's ~free in code — `drawCard()` already exists (state.ts:105);
expose it as a player action + a button. Ship it in MVP-lite.

**For the red-team before finalising:**
- When does voluntary draw to deck=0 lose? Proposal: you *may* empty voluntarily
  (your all-in); you only lose on the *forced* draw into an empty deck
  (existing rule, resolveTurn:255). Self-emptying = suicidal next turn unless you
  win — that's the tension.
- ~~Degenerate line: draw the whole deck, then dump a huge board.~~ **RESOLVED:**
  cap voluntary draw to **1 per turn** (1 auto + 1 voluntary = max 2/turn). Kills
  the turn-1 front-load; caps burn at +1 life/turn → effective mill 1-2/turn →
  ~6-11 turn fights, which matches the red-team's 8-11 target. Turns a one-shot
  all-in into a recurring per-turn choice, and — since you play ~2/turn and
  auto-draw 1 — the voluntary draw becomes near-mandatory, so the clock runs
  faster than baseline by default (free intra-battle attrition).
  Trade-off: loses the big "burn 5 for a spike" fantasy. If playtest shows +1/turn
  is too weak, raise the cap to 2 or switch to escalating cost (1st extra draw =
  mill 1, 2nd = mill 2…). Start at 1. Code: a `drewThisTurn` flag reset in
  `startTurn`.

**Note vs Decision B:** this delivers the *within-battle* stronger-vs-longer
tension, but NOT the run-level "finish at 1 HP, doomed next fight" carry-over.
Complementary to B, not a replacement — but it may lower the need for B.

### Asymmetric summoning sickness (2026-07-24)

Remove the "sleep" (summoning sickness) from the **player's** units; keep it on
the **boss's** summons.

- **Why coherent:** `summoned`/`wake` (state.ts) existed to keep the *symmetric
  mirror* tempo-fair. The boss fight is asymmetric, so that reason is gone.
- **One change fixes two complaints:** the sleep both slowed the player's actions
  AND made the summoned unit squat the entry cell (blocking redeploy next turn via
  `canPlay`). If player units act the turn they arrive, they vacate the entry cell
  immediately → lane clog disappears for free. No second fix needed.
- **Keep it on the boss:** the summon delay IS the counterplay window ("summon +
  march, connects in N turns") — lets the player react to the telegraph.
- **⚠️ Amplifies go-wide / turn-1 blowout** (findings #2/#5): instant-acting units
  + flat mana make the race even more player-favored. Must ship *with* the boss
  defense fixes (AoE volley, bracketed boss HP, modest starting mana).
- **Code:** condition `summoned` on owner in `play`/`stepMinion` — player `false`
  (instant), boss `true` (sleeps). Small.
