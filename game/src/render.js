// Canvas renderer: draws the world, the HUD and every screen the loop can show.
// One drawWorld call per frame; the HUD is plain text so screenshots stay legible.
import { CONFIG } from './config.js';

const PALETTE = {
  space: '#0b0e1c',
  deepSpace: '#10142b',
  star: '#3d4470',
  hull: '#e8ecff',
  hullLine: '#2a3352',
  thrust: '#ffb347',
  pod: '#57e6a8',
  podRing: '#1d5c44',
  rock: '#8a5a44',
  rockDark: '#5d3b2e',
  danger: '#ff5d5d',
  accent: '#ffd75d',
  text: '#dfe6ff',
  dim: '#7d86ad',
  shield: '#5db9ff',
  blast: '#bfe3ff',
};

function drawShip(ctx, ship, time) {
  if (!ship.alive) return;
  const blink = ship.invincibleFor > 0 && Math.floor(time * 10) % 2 === 0;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.globalAlpha = blink ? 0.35 : 1;
  // the barge: a wedge with a cargo bay
  ctx.fillStyle = PALETTE.hull;
  ctx.strokeStyle = PALETTE.hullLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-10, 10);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.podRing;
  ctx.fillRect(-6, -3, 7, 6);
  // exhaust flare while thrusting is read from speed
  const speed = Math.hypot(ship.vx, ship.vy);
  if (speed > 40) {
    ctx.fillStyle = PALETTE.thrust;
    const flare = 6 + Math.sin(time * 30) * 3;
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.lineTo(-10 - flare, 0);
    ctx.lineTo(-10, -4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  if (ship.invincibleFor > 0) {
    ctx.strokeStyle = PALETTE.shield;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, CONFIG.ship.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawPod(ctx, pod) {
  const bob = Math.sin(pod.bob) * 2;
  const fade = pod.age > CONFIG.salvage.lifetimeSecs - 3 ? 0.35 + 0.65 * Math.abs(Math.sin(pod.age * 6)) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(pod.x, pod.y + bob);
  ctx.fillStyle = PALETTE.pod;
  ctx.strokeStyle = PALETTE.podRing;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, CONFIG.salvage.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.podRing;
  ctx.fillRect(-2, -5, 4, 10);
  ctx.restore();
}

function drawRock(ctx, rock) {
  ctx.save();
  ctx.translate(rock.x, rock.y);
  ctx.rotate(rock.angle);
  ctx.fillStyle = PALETTE.rock;
  ctx.strokeStyle = PALETTE.rockDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < rock.sides; i += 1) {
    const ang = (i / rock.sides) * Math.PI * 2;
    const wobble = 0.75 + ((i * 37 + rock.sides) % 10) / 20;
    const px = Math.cos(ang) * rock.radius * wobble;
    const py = Math.sin(ang) * rock.radius * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.rockDark;
  ctx.beginPath();
  ctx.arc(rock.radius * 0.3, -rock.radius * 0.2, rock.radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBlast(ctx, blast) {
  const t = blast.age / 0.45;
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.strokeStyle = PALETTE.blast;
  ctx.lineWidth = 6 - 4 * t;
  ctx.beginPath();
  ctx.arc(blast.x, blast.y, CONFIG.pulse.radius * t, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBackdrop(ctx, world) {
  const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
  grad.addColorStop(0, PALETTE.deepSpace);
  grad.addColorStop(1, PALETTE.space);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  ctx.fillStyle = PALETTE.star;
  for (const star of world.stars) {
    ctx.globalAlpha = 0.3 + star.depth;
    ctx.fillRect(star.x, star.y, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function centreText(ctx, text, y, font, color) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillText(text, CONFIG.width / 2, y);
}

function drawHud(ctx, world) {
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`SCORE ${world.score}`, 16, 26);
  ctx.fillText(`LVL ${world.level}`, 16, 48);
  ctx.fillStyle = world.lives <= 1 ? PALETTE.danger : PALETTE.text;
  ctx.fillText(`HULL ${'\u25C6'.repeat(Math.max(0, world.lives))}`, 16, 70);
  // pulse charges as small diamonds bottom-left
  ctx.fillStyle = PALETTE.accent;
  for (let i = 0; i < world.pulseCharges; i += 1) {
    ctx.save();
    ctx.translate(24 + i * 22, CONFIG.height - 22);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }
  if (world.pulseCharges < CONFIG.pulse.maxCharges) {
    const pct = world.pulseRecharge / CONFIG.pulse.rechargeSecs;
    ctx.strokeStyle = PALETTE.accent;
    ctx.strokeRect(16, CONFIG.height - 14, 80, 6);
    ctx.fillRect(16, CONFIG.height - 14, 80 * pct, 6);
  }
  if (world.messageFor > 0) {
    centreText(ctx, world.message, CONFIG.height / 2 - 90, 'bold 22px monospace', PALETTE.accent);
  }
}

function drawTitle(ctx) {
  centreText(ctx, 'STAR SALVAGER', CONFIG.height / 2 - 90, 'bold 44px monospace', PALETTE.hull);
  centreText(ctx, 'collect the green salvage pods', CONFIG.height / 2 - 40, '18px monospace', PALETTE.pod);
  centreText(ctx, 'dodge the debris field', CONFIG.height / 2 - 14, '18px monospace', PALETTE.danger);
  centreText(ctx, 'ARROWS / WASD steer  ·  SPACE pulse blast  ·  M mute', CONFIG.height / 2 + 30, '15px monospace', PALETTE.dim);
  if (Math.floor(Date.now() / 600) % 2 === 0) {
    centreText(ctx, 'PRESS ENTER OR CLICK TO LAUNCH', CONFIG.height / 2 + 90, 'bold 20px monospace', PALETTE.accent);
  }
}

function drawGameOver(ctx, world) {
  centreText(ctx, 'BARGE LOST', CONFIG.height / 2 - 100, 'bold 40px monospace', PALETTE.danger);
  centreText(ctx, `final score ${world.score}`, CONFIG.height / 2 - 50, '24px monospace', PALETTE.text);
  centreText(ctx, `level reached ${world.level}  ·  pods salvaged ${world.collectedTotal || 0}`, CONFIG.height / 2 - 20, '16px monospace', PALETTE.dim);
  if (Math.floor(Date.now() / 600) % 2 === 0) {
    centreText(ctx, 'PRESS ENTER TO FLY AGAIN', CONFIG.height / 2 + 40, 'bold 18px monospace', PALETTE.accent);
  }
}

// one frame: backdrop, entities, hud, then the overlay screen if any
export function drawWorld(ctx, world) {
  drawBackdrop(ctx, world);
  for (const pod of world.salvage) drawPod(ctx, pod);
  for (const rock of world.debris) drawRock(ctx, rock);
  for (const blast of world.blasts) drawBlast(ctx, blast);
  if (world.state === 'playing') drawShip(ctx, world.ship, world.time);
  if (world.state === 'playing') drawHud(ctx, world);
  if (world.state === 'title') drawTitle(ctx);
  if (world.state === 'gameover') {
    drawHud(ctx, world);
    drawGameOver(ctx, world);
  }
}
