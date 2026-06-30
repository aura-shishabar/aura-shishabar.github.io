// src/sound.js — real recorded page-flip sound.
// Source: Mixkit "Page turn single" (Mixkit Free License — commercial use, no attribution).
const SRC = new URL('../assets/page-flip.mp3?v=5', import.meta.url).href;

// Warm the HTTP cache so the first flip plays instantly.
try {
  const pre = new Audio(SRC);
  pre.preload = 'auto';
  pre.load();
} catch (e) {
  /* ignore */
}

let muted = false;
export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

export function playFlip() {
  if (muted) return;
  try {
    const a = new Audio(SRC);
    a.volume = 0.55;
    a.play().catch(() => { /* browsers block audio until the first user gesture — fine */ });
  } catch (e) {
    /* audio unavailable — ignore */
  }
}
