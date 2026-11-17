// Deterministic pseudo-random generator: a seeded xorshift so every run of the
// same seed draws the identical starfield, spawns and drifts. Screenshots and
// state snapshots stay reproducible across sessions.
export class Rng {
  constructor(seed) {
    this.seed = seed >>> 0 || 1;
  }

  // xorshift32, returns an unsigned 32-bit integer
  next() {
    let x = this.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0;
    return this.seed;
  }

  // uniform float in [0, 1)
  float() {
    return this.next() / 4294967296;
  }

  // uniform float in [lo, hi)
  range(lo, hi) {
    return lo + this.float() * (hi - lo);
  }

  // uniform integer in [lo, hi] inclusive
  int(lo, hi) {
    return lo + Math.floor(this.float() * (hi - lo + 1));
  }

  pick(list) {
    return list[this.int(0, list.length - 1)];
  }
}
