/** Attack-animation timings and distances, in one place. These are motion
 *  feel, not game balance, so they live here rather than in `balance.ts`.
 *
 *  The millisecond values mirror the keyframe splits in `style.css` — the
 *  keyframe holds the segment *ratios* (wind-up → strike → settle), and these
 *  set the wall-clock a segment lasts. Keep the two in sync: `CONTACT_MS` must
 *  land on the strike keyframe (55% of `CLASH_MS`), and `COMBAT_MS` must be at
 *  least the longest animation so nothing is cut off before it commits. */

/** Wind-up distance: 1/8 of an 80px cell, the little pull-back before the dash. */
export const RECOIL_PX = 10;

/** Forward dash of a clash, in px. Deliberately a touch past the cell seam so
 *  contact reads as contact despite the whitespace baked into each sketch — the
 *  one number to dial by eye if the bump lands short or overlaps too far. */
export const CLASH_LUNGE_PX = 40;

/** Full clash animation: ~130ms wind-up, ~90ms strike, ~180ms settle. */
export const CLASH_MS = 400;

/** How long the board is held, animating the blows, before the outcome
 *  (damage, deaths) commits. The longest animation. */
export const COMBAT_MS = CLASH_MS;

/** When the strike lands — the impact cue (a white flash) fires here. 55% of a
 *  clash, matching the strike keyframe in `style.css`. */
export const CONTACT_MS = Math.round(CLASH_MS * 0.55);
