// Game loop: fixed-timestep simulation, requestAnimationFrame rendering,
// state snapshots for screenshots and a ?shot= query hook for scripted captures.
import { CONFIG } from './config.js';
import { Input } from './input.js';
import { World } from './world.js';
import { drawWorld } from './render.js';
import { setMuted, isMuted, sfx } from './sound.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const world = new World(1);
const input = new Input(canvas);

// mute toggle read from the world's request flag each frame
let muteFlash = 0;
let lastMuted = false;

const STEP = 1 / 60;
let accumulator = 0;
let last = performance.now();

function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  accumulator += elapsed;
  while (accumulator >= STEP) {
    const prevState = world.state;
    const prevScore = world.score;
    world.update(STEP, input);
    if (world.toggleMuteRequest) {
      world.toggleMuteRequest = false;
      setMuted(!isMuted());
      muteFlash = 1.0;
    }
    if (world.state !== prevState && world.state === 'playing') sfx.start();
    if (world.state === 'gameover' && prevState !== 'gameover') sfx.gameOver();
    if (world.levelUpFlash > 1.4) sfx.levelUp();
    if (world.score > prevScore && world.score % 10 === 0) sfx.pickup(world.score);
    if (world.blasts.length > 0 && world.blasts[world.blasts.length - 1].age < STEP * 2) sfx.blast();
    accumulator -= STEP;
  }
  if (muteFlash > 0) muteFlash -= elapsed;
  drawWorld(ctx, world);
  if (muteFlash > 0) {
    ctx.font = '14px monospace';
    ctx.fillStyle = '#ffd75d';
    ctx.textAlign = 'right';
    ctx.fillText(isMuted() ? 'SOUND OFF' : 'SOUND ON', CONFIG.width - 16, CONFIG.height - 16);
  }
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Screenshot hook: ?shot=title|play|end jumps the world to that moment so the
// maker can capture each screen deterministically. seed= picks the run's seed.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = params.get('seed');
if (seedParam !== null) {
  const seed = parseInt(seedParam, 10) || 1;
  world.reset(seed);
}
if (shot === 'play') {
  world.startRun();
  // fast-forward a few seconds so the field shows pods, rocks and mid-game score
  for (let i = 0; i < 60 * 9; i += 1) {
    world.update(STEP, { hit: () => false, held: () => false });
  }
  // nudge the ship toward the centre with some motion for the shot
  world.ship.vx = 60;
  world.ship.vy = -30;
} else if (shot === 'end') {
  world.startRun();
  for (let i = 0; i < 60 * 6; i += 1) {
    world.update(STEP, { hit: () => false, held: () => false });
  }
  world.lives = 1;
  world.ship.invincibleFor = 0;
  world.debris.push({ x: world.ship.x, y: world.ship.y, vx: 0, vy: 0, radius: 20, spin: 0, angle: 0, sides: 6 });
  world.update(STEP, { hit: () => false, held: () => false });
}

// expose for the deterministic capture script
window.__world = world;
window.__config = CONFIG;
