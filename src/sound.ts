import piouSound from "./assets/sounds/piou.mp3";
import blobSound from "./assets/sounds/blob.mp3";
import bushSound from "./assets/sounds/bush.mp3";
import zombieSound from "./assets/sounds/zombie.mp3";
import skeletonSound from "./assets/sounds/skeleton.mp3";
import cubalibreSound from "./assets/sounds/cubalibre.mp3";
import wizardSound from "./assets/sounds/wizard.mp3";
import mountdogSound from "./assets/sounds/mountdog.mp3";
import lionSound from "./assets/sounds/lion.mp3";
import hydraSound from "./assets/sounds/hydraf.mp3";
import type { CardId } from "./balance.ts";

/** The clip each card plays as it lands on the board. Most cards have a
 *  same-named file; `saper` and `universman` have no match of their own, so
 *  they borrow the two remaining clips. */
const SUMMON_SOUNDS: Record<CardId, string> = {
  piou: piouSound,
  blob: blobSound,
  bush: bushSound,
  zombie: zombieSound,
  saper: skeletonSound,
  universman: cubalibreSound,
  wizard: wizardSound,
  mountdog: mountdogSound,
  lion: lionSound,
  hydra: hydraSound,
};

/** Plays a card's summon clip. A fresh `Audio` each call so rapid summons can
 *  overlap instead of cutting each other off; playback is fire-and-forget and
 *  the rejected promise (e.g. before the first user gesture) is swallowed. */
export function playSummonSound(card: CardId) {
  const audio = new Audio(SUMMON_SOUNDS[card]);
  void audio.play().catch(() => {});
}
