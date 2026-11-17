// The world model: player barge, salvage pods, debris and the pulse blast.
// Pure simulation, no rendering — render.js draws whatever this holds.
import { CONFIG } from './config.js';
import { Rng } from './rng.js';

export class World {
  constructor(seed) {
    this.rng = new Rng(seed);
    this.reset(seed);
  }

  reset(seed) {
    this.rng = new Rng(seed);
    this.ship = {
      x: CONFIG.width / 2,
      y: CONFIG.height / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2, // pointing up
      alive: true,
      invincibleFor: 0,
    };
    this.salvage = [];
    this.debris = [];
    this.blasts = [];
    this.score = 0;
    this.level = 1;
    this.lives = CONFIG.lives;
    this.state = 'title'; // title | playing | gameover
    this.time = 0;
    this.salvageTimer = 0.6;
    this.debrisTimer = 0.3;
    this.pulseCharges = CONFIG.pulse.maxCharges;
    this.pulseRecharge = 0;
    this.message = '';
    this.messageFor = 0;
    // a calm parallax starfield, drawn behind everything
    this.stars = [];
    for (let i = 0; i < CONFIG.starfieldCount; i += 1) {
      this.stars.push({
        x: this.rng.range(0, CONFIG.width),
        y: this.rng.range(0, CONFIG.height),
        depth: this.rng.range(0.15, 0.6),
      });
    }
  }

  flash(text, secs) {
    this.message = text;
    this.messageFor = secs;
  }

  // start a fresh run from the title or game-over screen
  startRun() {
    const seed = (this.rng.next() ^ 0x9e3779b9) >>> 0;
    const stars = this.stars;
    this.reset(seed);
    this.stars = stars;
    this.state = 'playing';
  }

  spawnSalvage() {
    if (this.salvage.length >= CONFIG.salvage.maxOnField) return;
    this.salvage.push({
      x: this.rng.range(40, CONFIG.width - 40),
      y: this.rng.range(40, CONFIG.height - 40),
      vx: this.rng.range(-18, 18),
      vy: this.rng.range(-18, 18),
      age: 0,
      bob: this.rng.range(0, Math.PI * 2),
    });
  }

  spawnDebris() {
    if (this.debris.length >= CONFIG.debris.maxOnField) return;
    const radius = this.rng.range(CONFIG.debris.minRadius, CONFIG.debris.maxRadius);
    // debris drifts in from one edge toward the play area
    const fromLeft = this.rng.float() < 0.5;
    const speed = this.rng.range(CONFIG.debris.minSpeed, CONFIG.debris.maxSpeed) * (1 + (this.level - 1) * 0.12);
    this.debris.push({
      x: fromLeft ? -radius : CONFIG.width + radius,
      y: this.rng.range(30, CONFIG.height - 30),
      vx: fromLeft ? speed : -speed,
      vy: this.rng.range(-24, 24),
      radius,
      spin: this.rng.range(-2, 2),
      angle: this.rng.range(0, Math.PI * 2),
      sides: this.rng.int(5, 8),
    });
  }

  firePulse() {
    if (this.pulseCharges <= 0 || this.state !== 'playing') return;
    this.pulseCharges -= 1;
    this.blasts.push({ x: this.ship.x, y: this.ship.y, age: 0, done: false });
    // every wreck the shockwave touches becomes salvage points
    let wrecked = 0;
    this.debris = this.debris.filter((rock) => {
      const dist = Math.hypot(rock.x - this.ship.x, rock.y - this.ship.y);
      if (dist < CONFIG.pulse.radius) {
        wrecked += 1;
        return false;
      }
      return true;
    });
    if (wrecked > 0) {
      this.score += wrecked * CONFIG.pulse.pointsPerWreck;
      this.flash(`pulse: +${wrecked * CONFIG.pulse.pointsPerWreck}`, 1.2);
    }
  }

  hitShip() {
    if (this.ship.invincibleFor > 0) return;
    this.lives -= 1;
    this.ship.invincibleFor = CONFIG.ship.invincibleSecs;
    // knock the ship back toward centre so it cannot sit inside a rock
    this.ship.vx *= -0.5;
    this.ship.vy *= -0.5;
    if (this.lives <= 0) {
      this.state = 'gameover';
    } else {
      this.flash(`hull hit! ${this.lives} left`, 1.4);
    }
  }

  update(dt, input) {
    this.time += dt;
    if (this.messageFor > 0) this.messageFor -= dt;
    this.updateStars(dt);

    if (this.state === 'title' || this.state === 'gameover') {
      if (input.hit(' ', 'enter') || input.mouse.clicked) this.startRun();
      return;
    }

    if (input.hit('m')) this.toggleMuteRequest = true;
    this.stepShip(dt, input);
    this.stepEntities(dt);
    this.checkCollisions();
    this.stepSpawns(dt);
    if (this.pulseCharges < CONFIG.pulse.maxCharges) {
      this.pulseRecharge += dt;
      if (this.pulseRecharge >= CONFIG.pulse.rechargeSecs) {
        this.pulseRecharge = 0;
        this.pulseCharges += 1;
      }
    }
    for (const blast of this.blasts) {
      blast.age += dt;
      if (blast.age > 0.45) blast.done = true;
    }
    this.blasts = this.blasts.filter((blast) => !blast.done);
  }

  toggleMute() {
    this.muteRequested = true;
  }

  updateStars(dt) {
    for (const star of this.stars) {
      star.y += star.depth * 14 * dt;
      if (star.y > CONFIG.height) {
        star.y -= CONFIG.height;
        star.x = this.rng.range(0, CONFIG.width);
      }
    }
  }

  stepShip(dt, input) {
    const ship = this.ship;
    if (ship.invincibleFor > 0) ship.invincibleFor -= dt;
    if (input.held('arrowleft', 'a')) ship.angle -= CONFIG.ship.turnSpeed * dt;
    if (input.held('arrowright', 'd')) ship.angle += CONFIG.ship.turnSpeed * dt;
    if (input.held('arrowup', 'w')) {
      ship.vx += Math.cos(ship.angle) * CONFIG.ship.thrust * dt;
      ship.vy += Math.sin(ship.angle) * CONFIG.ship.thrust * dt;
    }
    if (input.held('arrowdown', 's')) {
      ship.vx -= Math.cos(ship.angle) * CONFIG.ship.thrust * 0.6 * dt;
      ship.vy -= Math.sin(ship.angle) * CONFIG.ship.thrust * 0.6 * dt;
    }
    if (input.hit(' ')) this.firePulse();
    const dragFactor = Math.max(0, 1 - CONFIG.ship.drag * dt);
    ship.vx *= dragFactor;
    ship.vy *= dragFactor;
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > CONFIG.ship.maxSpeed) {
      ship.vx = (ship.vx / speed) * CONFIG.ship.maxSpeed;
      ship.vy = (ship.vy / speed) * CONFIG.ship.maxSpeed;
    }
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // wrap around the edges of the belt
    if (ship.x < 0) ship.x += CONFIG.width;
    if (ship.x > CONFIG.width) ship.x -= CONFIG.width;
    if (ship.y < 0) ship.y += CONFIG.height;
    if (ship.y > CONFIG.height) ship.y -= CONFIG.height;
  }

  stepEntities(dt) {
    for (const pod of this.salvage) {
      pod.x += pod.vx * dt;
      pod.y += pod.vy * dt;
      pod.age += dt;
      pod.bob += dt * 3;
      if (pod.x < 10 || pod.x > CONFIG.width - 10) pod.vx *= -1;
      if (pod.y < 10 || pod.y > CONFIG.height - 10) pod.vy *= -1;
    }
    this.salvage = this.salvage.filter((pod) => pod.age < CONFIG.salvage.lifetimeSecs);
    for (const rock of this.debris) {
      rock.x += rock.vx * dt;
      rock.y += rock.vy * dt;
      rock.angle += rock.spin * dt;
    }
    this.debris = this.debris.filter(
      (rock) => rock.x > -80 && rock.x < CONFIG.width + 80 && rock.y > -80 && rock.y < CONFIG.height + 80,
    );
  }

  stepSpawns(dt) {
    this.salvageTimer -= dt;
    if (this.salvageTimer <= 0) {
      this.salvageTimer = CONFIG.salvage.spawnEverySecs;
      this.spawnSalvage();
    }
    this.debrisTimer -= dt;
    if (this.debrisTimer <= 0) {
      this.debrisTimer = Math.max(0.35, CONFIG.debris.spawnEverySecs - (this.level - 1) * 0.08);
      this.spawnDebris();
    }
  }

  checkCollisions() {
    const ship = this.ship;
    for (let i = this.salvage.length - 1; i >= 0; i -= 1) {
      const pod = this.salvage[i];
      if (Math.hypot(pod.x - ship.x, pod.y - ship.y) < CONFIG.salvage.radius + CONFIG.ship.radius) {
        this.salvage.splice(i, 1);
        this.score += CONFIG.salvage.basePoints + this.level;
        this.collectedTotal = (this.collectedTotal || 0) + 1;
      }
    }
    const nextLevel = 1 + Math.floor(this.score / CONFIG.levelUpEvery);
    if (nextLevel > this.level) {
      this.level = nextLevel;
      this.levelUpFlash = 1.5;
    }
    if (this.levelUpFlash > 0) this.levelUpFlash -= 1 / 60;
    for (const rock of this.debris) {
      if (Math.hypot(rock.x - ship.x, rock.y - ship.y) < rock.radius + CONFIG.ship.radius * 0.8) {
        this.hitShip();
        break;
      }
    }
  }
}
