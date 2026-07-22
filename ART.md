# Countdown — art format

Format spec for the character drawings. One drawing per character serves **both**
roles: the token on the battlefield and the illustration on the card.

## Decisions

| #   | Decision       | Choice                                                                                     |
| --- | -------------- | ------------------------------------------------------------------------------------------ |
| 1   | Drawings/char  | **One**, reused as battlefield token and card art                                          |
| 2   | Frame          | **4:3 landscape**, one uniform cell for every character                                    |
| 3   | Card crop      | **None** — the source drawing _is_ the card vignette                                       |
| 4   | Support        | **One 18×30 cm sheet**, ~15 drawings in a 3×5 grid, **4:3 cell = 6 × 4.5 cm** (w×h)         |
| 5   | Capture        | **iPhone 15 Pro + uniform LED**, phone held parallel to the sheet (straight down)          |
| 6   | Scale          | **Compressed relative** — human 4×1, hydra 4.5×5.5 (h×w cm); ~2–3 height tiers, free width |
| 7   | Alignment      | **Common ground line**, everyone bottom-aligned                                            |
| 8   | View / facing  | **Profile**, all facing one direction; mirror via CSS `scaleX(-1)` for the enemy side      |
| 9   | Slicing        | **By eye** — manual crop, aspect ratio locked to 4:3                                        |

## Drawing guide

- Everyone in **profile**, facing the **same** direction. Avoid asymmetric detail
  (legible insignia, text) that reads wrong once mirrored — loose ink + `multiply`
  forgives the rest.
- All figures stand on **one common ground line**; height grows upward.
- **Compressed relative scale**: the size gap reads through **mass/width**, not
  height (human 1 cm wide → hydra 5.5 cm wide), so even the smallest token stays
  legible and no card vignette has dead headroom. Pick from ~2–3 height tiers
  (e.g. biped 4 / mid 4.25 / colossus 4.5 cm); width is free per silhouette.
- Leave whitespace around each figure so manual crops never collide.

## Capture & slicing

- Shoot the whole sheet once, phone **straight down**, under uniform LED.
- Resolution is a non-issue: even at 12 MP a 6 cm cell lands ~760 px wide — far
  above the ~360 px needed for a 2× display.
- Slice **by eye**: crop each drawing with the ratio **locked to 4:3**, else the
  cards won't share a frame.
- Rendered in-app with `mix-blend-mode: multiply` so the paper drops out.

## Deferred

Export size per sliced image (suggest ~**512 × 384 px**) — set once the card
component exists.
