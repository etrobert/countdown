import musicUrl from "./assets/music/countdown-2.mp3";

/** The battle track: one file holding twelve equal patterns, calm to frantic.
 *  Exactly one pattern loops at a time; jumping patterns is how the music
 *  tracks the game (see the music effect in App). */
export const PATTERN_COUNT = 12;

/** Seconds. The short fade is a crossfade masking the click of a mid-wave
 *  pattern jump; the long one is the end-of-battle exit. */
const JUMP_FADE = 0.02;
const END_FADE = 1;

/** The pattern currently looping, with enough bookkeeping to recover the
 *  playback phase — how far into the pattern we are — at any later time. */
type Loop = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  index: number;
  startedAt: number;
  startPhase: number;
};

let ctx: AudioContext | undefined;
let master: GainNode | undefined;
let buffer: AudioBuffer | undefined;
/** Seconds of decoder lead-in before the music's first sample — see `cuts`. */
let leadIn = 0;
let loop: Loop | undefined;
/** The pattern to start on once the track finishes decoding. */
let desired = 0;
let faded = false;

/** Builds the audio graph and decodes the track, then starts the loop. Kicked
 *  off lazily by the first `setMusicPattern`. The context may come up suspended
 *  under the browser's autoplay policy; any gesture resumes it, and the
 *  schedule laid out while suspended plays out from that moment. */
async function init(): Promise<void> {
  const context = new AudioContext();
  ctx = context;
  const gain = context.createGain();
  gain.connect(context.destination);
  master = gain;
  const resume = () => void context.resume();
  window.addEventListener("pointerdown", resume);
  window.addEventListener("keydown", resume);
  const response = await fetch(musicUrl);
  buffer = await context.decodeAudioData(await response.arrayBuffer());
  leadIn = findLeadIn(buffer);
  if (!faded) startLoop(desired, 0);
}

/** How far into the decoded buffer the music actually starts. The mp3 carries
 *  no Xing/LAME header, so decoders can't strip the encoder delay: the buffer
 *  opens on ~50ms of injected silence (and the same length of music is lost
 *  off the end). Measured at runtime rather than hard-coded so it holds under
 *  any browser's decoder. */
function findLeadIn(audio: AudioBuffer): number {
  const threshold = 0.001; // -60dBFS
  const channels = Array.from({ length: audio.numberOfChannels }, (_, c) =>
    audio.getChannelData(c),
  );
  for (let i = 0; i < audio.length; i++)
    for (const data of channels)
      if (Math.abs(data[i]) > threshold) return i / audio.sampleRate;
  return 0;
}

/** The bounds of a pattern's loop within the buffer. The export is exactly
 *  twelve patterns long, so the pattern length is duration / 12 and the grid
 *  starts at the first audible sample; the last pattern's end is clamped to
 *  the buffer, short by the tail the encoder delay pushed off the edge. */
function cuts(
  audio: AudioBuffer,
  index: number,
): { start: number; end: number; length: number } {
  const length = audio.duration / PATTERN_COUNT;
  const start = leadIn + index * length;
  const end = Math.min(start + length, audio.duration);
  return { start, end, length };
}

/** Starts the given pattern looping at `phase` seconds into it, crossfading
 *  out any previous loop. */
function startLoop(index: number, phase: number): void {
  if (!ctx || !master || !buffer) return;
  const { start, end } = cuts(buffer, index);
  const gain = ctx.createGain();
  gain.connect(master);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = start;
  source.loopEnd = end;
  source.connect(gain);
  const now = ctx.currentTime;
  if (loop) {
    loop.gain.gain.setValueAtTime(1, now);
    loop.gain.gain.linearRampToValueAtTime(0, now + JUMP_FADE);
    loop.source.stop(now + JUMP_FADE);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + JUMP_FADE);
  }
  // The phase modulo keeps the entry inside the loop region for the last
  // pattern, whose clamped end makes it slightly shorter than the grid.
  source.start(now, start + (phase % (end - start)));
  loop = { source, gain, index, startedAt: now, startPhase: phase };
}

/** Loops the given pattern (0-based). A change of pattern jumps in phase: the
 *  position within the old pattern carries into the new one, so the switch is
 *  instant but the beat never stumbles. Also (re)starts the music when none is
 *  playing — the first call, or the return from an end-of-battle fade. */
export function setMusicPattern(index: number): void {
  desired = index;
  if (!ctx) {
    void init();
    return;
  }
  if (!master || !buffer) return;
  if (faded) {
    faded = false;
    master.gain.cancelScheduledValues(0);
    master.gain.setValueAtTime(1, ctx.currentTime);
  }
  if (!loop) return startLoop(index, 0);
  if (loop.index === index) return;
  const { length } = cuts(buffer, index);
  const phase = (loop.startPhase + ctx.currentTime - loop.startedAt) % length;
  startLoop(index, phase);
}

/** Fades the music out over a second — the end-of-battle exit. The next
 *  `setMusicPattern` brings it back. */
export function fadeOutMusic(): void {
  if (faded) return;
  faded = true;
  if (!ctx || !master || !loop) {
    loop = undefined;
    return;
  }
  const now = ctx.currentTime;
  master.gain.setValueAtTime(1, now);
  master.gain.linearRampToValueAtTime(0, now + END_FADE);
  loop.source.stop(now + END_FADE);
  loop = undefined;
}
