// WebAudio bleeps: a tiny synth so the game carries sound with zero asset files.
// Every effect is a short oscillator envelope; no network fetch, no samples.
let ctx = null;
let muted = false;

function audioCtx() {
  if (ctx === null) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor === undefined) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

// one enveloped tone: freq, duration, type, volume, slide
function tone(freq, secs, type, vol, slideTo) {
  if (muted) return;
  const ac = audioCtx();
  if (ac === null) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), ac.currentTime + secs);
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + secs);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + secs + 0.02);
}

export const sfx = {
  pickup(points) {
    tone(520 + points, 0.14, 'square', 0.05, 900 + points);
  },
  crash() {
    tone(180, 0.35, 'sawtooth', 0.09, 50);
  },
  blast() {
    tone(300, 0.4, 'triangle', 0.1, 60);
  },
  levelUp() {
    tone(440, 0.12, 'square', 0.06, 660);
    setTimeout(() => tone(660, 0.16, 'square', 0.06, 880), 110);
  },
  gameOver() {
    tone(320, 0.5, 'sawtooth', 0.08, 70);
    setTimeout(() => tone(160, 0.7, 'sawtooth', 0.08, 40), 300);
  },
  start() {
    tone(440, 0.1, 'square', 0.05, 550);
    setTimeout(() => tone(660, 0.12, 'square', 0.05, 880), 90);
  },
};
