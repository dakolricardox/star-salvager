// Headless simulation smoke test: drives the World with a simple autopilot that
// steers toward the nearest salvage pod and dodges debris, then asserts the
// core loop advances score, levels and never throws.
import { World } from '../game/src/world.js';
import { CONFIG } from '../game/src/config.js';

const STEP = 1 / 60;
const world = new World(1337);

// fake input the world understands
function makeInput() {
  const state = { turn: 0, thrust: false, pulse: false, start: false };
  return {
    state,
    hit: (...keys) => keys.includes(' ') && state.pulse,
    held: (a, b) => {
      if ((a === 'arrowleft' || a === 'a') && state.turn < 0) return true;
      if ((a === 'arrowright' || a === 'd') && state.turn > 0) return true;
      if ((a === 'arrowup' || a === 'w') && state.thrust) return true;
      return false;
    },
    mouse: { x: 0, y: 0, clicked: false },
  };
}

const input = makeInput();
world.startRun();
[input.state.pulse, input.state.turn, input.state.thrust] = [false, 0, false];

let maxScore = 0;
let collected = 0;
let crashes = 0;
const frames = 60 * 90; // 90 simulated seconds

for (let i = 0; i < frames; i += 1) {
  const ship = world.ship;
  // steer toward nearest pod
  let target = null;
  let best = Infinity;
  for (const pod of world.salvage) {
    const d = Math.hypot(pod.x - ship.x, pod.y - ship.y);
    if (d < best) { best = d; target = pod; }
  }
  input.state.turn = 0;
  input.state.thrust = false;
  input.state.pulse = false;
  if (target) {
    const want = Math.atan2(target.y - ship.y, target.x - ship.x);
    let diff = ((want - ship.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    if (diff > 0.08) input.state.turn = 1;
    else if (diff < -0.08) input.state.turn = -1;
    input.state.thrust = true;
  }
  // panic pulse when a rock is close
  for (const rock of world.debris) {
    if (Math.hypot(rock.x - ship.x, rock.y - ship.y) < 55 && world.pulseCharges > 0) input.state.pulse = true;
  }
  const beforeScore = world.score;
  const beforeLives = world.lives;
  world.update(STEP, input);
  if (world.score > beforeScore) collected += 1;
  if (world.lives < beforeLives) crashes += 1;
  maxScore = Math.max(maxScore, world.score);
  if (world.state === 'gameover') {
    world.startRun();
    [input.state.pulse, input.state.turn, input.state.thrust] = [false, 0, false];
  }
}

// assertions
const checks = [
  ['score increased', maxScore > 0, `maxScore=${maxScore}`],
  ['levels advanced', world.level >= 1, `level=${world.level}`],
  ['no NaN position', Number.isFinite(world.ship.x) && Number.isFinite(world.ship.y), `${world.ship.x},${world.ship.y}`],
  ['pulse charges bounded', world.pulseCharges >= 0 && world.pulseCharges <= CONFIG.pulse.maxCharges, `charges=${world.pulseCharges}`],
  ['debris bounded', world.debris.length <= CONFIG.debris.maxOnField, `debris=${world.debris.length}`],
  ['salvage bounded', world.salvage.length <= CONFIG.salvage.maxOnField, `salvage=${world.salvage.length}`],
  ['ship stays in bounds', world.ship.x >= 0 && world.ship.x <= CONFIG.width && world.ship.y >= 0 && world.ship.y <= CONFIG.height, `${world.ship.x|0},${world.ship.y|0}`],
];
let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} (${detail})`);
  if (!ok) failed += 1;
}
console.log(`summary: frames=${frames} maxScore=${maxScore} pickups=${collected} crashes=${crashes} level=${world.level}`);
process.exit(failed > 0 ? 1 : 0);
