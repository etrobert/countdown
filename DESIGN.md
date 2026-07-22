# Countdown — design

**GMTK Game Jam 2026. Theme: Countdown.**

> A deckbuilder where your deck is your life. Every draft asks one question: do
> you get stronger, or do you live longer?

## Core loop

Symmetrical lane auto-battler. Your deck is your life total — you mill 1 card
per turn as the baseline countdown, and enemy minions that reach your face mill
you faster. You lose when your deck runs out.

The economy: a card in your deck is 1 tick of _your_ clock. Played, it removes
ATK ticks from _theirs_. The whole game is whether you convert your countdown
into their countdown at a better rate than they do.

## Rules

|               |                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Structure     | 3 battles, draft between each. Deck fully resets every battle                                                             |
| Combat        | Turn-stepped, alternating. 3 lanes × 4 cells                                                                              |
| Minion fights | ATK/HP with persistent damage — blocked minions trade each turn, the survivor walks on wounded                            |
| Connecting    | Mills = ATK, and the minion dies                                                                                          |
| Cost          | Growing mana, turn N = N, capped around 5                                                                                 |
| Clock         | 15-card deck, draw 1 per turn                                                                                             |
| Draft         | Two independent optional steps: add up to 2, then remove up to 2                                                          |
| Cards         | 12–15 unique                                                                                                              |
| AI            | Greedy heuristic: most expensive affordable card, into the lane with the biggest unblocked threat, else the emptiest lane |

Deck reset means a bad battle can never soft-lock a run. Minions dying on
connect means no lane can bleed you forever.

Difficulty lives entirely in the AI's three authored decks, not in its logic.

## Keywords

- **Fast** — moves 2 cells per turn.
- **Breach X** — mills X extra on connect, on top of ATK.
- **Blood price X** — strong stats, but mill X of your own cards to play it.

Each hooks a different step (movement, connect, on-play) and none interact, so
there is no cross-product to test. Blood price is the one that makes the
countdown a resource you can choose to spend.

## Presentation

The deck renders as a physical stack of card backs that visibly shrinks. Milled
cards fly off and burn away.

One `--vitality` custom property (`deckSize / 15`) on a wrapper drives the rest:

- `filter: saturate(var(--vitality))` — your side pales as you die
- a scale pulse with `animation-duration: calc(var(--vitality) * 1.2s)` — the
  heartbeat races as the deck empties
- a radial-gradient vignette whose clear radius shrinks with vitality

The goal is to feel vital energy leaving the body, not to read a number.

## Tech

React + DOM/CSS. No canvas — cards are text-heavy, and DOM gives text layout and
hit-testing for free.

- All balance numbers live in one `balance.ts`.
- `base: './'` in the Vite config, or assets 404 on itch.io.
- A deliberately broken build goes up to itch on day 1 to prove the pipeline.

## Art

15 five-minute ink sketches, drawn on a single sheet, photographed once, sliced
in one pass. Rendered with `mix-blend-mode: multiply` so the paper drops out. No
animation.

## Process

Budget is ~20h each, two people.

Hour one, together: freeze the game-state shape and the card-data format. After
that the sim stays in one file that only one person has open at a time.

Cut order if behind: keywords → card count → 3rd battle → draft.

Checkpoint: if one full battle is not playable end-to-end by the end of day 2,
start cutting immediately.

## Open

Starting hand size. The cost curve across the card pool. The three enemy
decklists. Audio. Whether there is a run-summary screen. Touch support.
