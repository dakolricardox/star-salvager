// Star Salvager: shared tuning constants for every system.
// All gameplay numbers live here so difficulty can be rebalanced in one place.
export const CONFIG = {
  // canvas + world layout
  width: 800,
  height: 600,
  starfieldCount: 90,

  // the drifting salvage barge the player pilots
  ship: {
    radius: 14,
    thrust: 240, // pixels per second of acceleration
    turnSpeed: 3.6, // radians per second
    drag: 0.55, // fraction of velocity lost per second
    maxSpeed: 320,
    invincibleSecs: 2.0, // grace after a hit
  },

  // salvage pods: the collectibles that score
  salvage: {
    radius: 9,
    spawnEverySecs: 1.4,
    maxOnField: 9,
    lifetimeSecs: 12, // uncollected pods decay and vanish
    basePoints: 10,
  },

  // debris: the hazards to dodge
  debris: {
    spawnEverySecs: 1.1,
    maxOnField: 14,
    minRadius: 10,
    maxRadius: 24,
    minSpeed: 40,
    maxSpeed: 130,
  },

  // pulse blast: the limited screen-clearing escape button
  pulse: {
    maxCharges: 2,
    rechargeSecs: 9,
    radius: 150,
    pointsPerWreck: 5,
  },

  lives: 3,
  levelUpEvery: 150, // points per level step
};
