/**
 * Procedural celebratory / game SFX via Web Audio API (no external files).
 */

let ctx = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export async function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") await c.resume();
}

function tone(freq, duration, type = "sine", gain = 0.08, when = 0) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  const t = c.currentTime + when;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/** Sparkling fireworks-style chirps */
export function playFireworksSound() {
  unlockAudio();
  for (let i = 0; i < 8; i += 1) {
    const f = 400 + Math.random() * 900;
    tone(f, 0.18 + Math.random() * 0.15, "triangle", 0.05, i * 0.08);
    tone(f * 1.5, 0.12, "sine", 0.03, i * 0.08 + 0.04);
  }
}

export function playCorrect() {
  unlockAudio();
  tone(523.25, 0.12, "sine", 0.08);
  tone(659.25, 0.12, "sine", 0.08, 0.1);
  tone(783.99, 0.18, "sine", 0.08, 0.2);
}

export function playWrong() {
  unlockAudio();
  tone(220, 0.18, "sawtooth", 0.05);
  tone(180, 0.22, "sawtooth", 0.045, 0.12);
}

export function playTimeout() {
  unlockAudio();
  tone(300, 0.1, "square", 0.04);
  tone(250, 0.15, "square", 0.035, 0.1);
}

export function playCelebrate() {
  unlockAudio();
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(f, 0.25, "triangle", 0.07, i * 0.12));
  setTimeout(playFireworksSound, 200);
}

export function playClick() {
  unlockAudio();
  tone(660, 0.05, "sine", 0.04);
}
