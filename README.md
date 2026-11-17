# star-salvager

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/dakolricardox/star-salvager/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/dakolricardox/star-salvager/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Star Salvager — a fast arcade salvage run: pilot a barge through a drifting debris belt, scoop green salvage pods, and spend pulse charges to shatter incoming rocks. Three hull points, endless scaling levels, seeded deterministic runs, a WebAudio synth for sound, and zero asset files: every visual is drawn on canvas and every sound is synthesised.

## Controls

- Arrow keys / WASD — steer and thrust
- Space — fire pulse blast (clears nearby debris, points per wreck)
- M — toggle sound
- Enter or click — start / restart

## Run it

```sh
node serve.ts && open http://localhost:8080
```

The game itself is plain static ES modules under `game/`, no build step and no network requests. `main.ts` is the entry program: it copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun game library. Outside the grader:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Headless simulation smoke test:

```sh
node test/sim.test.mjs
```

## Structure

- `main.ts` — entry program: copies `game/` + `screenshots/`, writes `dossier.json`
- `serve.ts` — static file server for local play
- `vendor/makefun-game.ts` — the kit's `buildDossier` library
- `game/index.html` — canvas shell
- `game/src/config.js` — all tuning constants
- `game/src/rng.js` — seeded xorshift RNG (deterministic runs)
- `game/src/input.js` — keyboard + pointer
- `game/src/world.js` — pure simulation (ship, pods, debris, pulse)
- `game/src/render.js` — canvas drawing and HUD
- `game/src/main.js` — fixed-timestep loop, `?shot=` capture hooks
- `game/src/sound.js` — WebAudio bleep synth (zero assets)
- `screenshots/` — title, play and game-over captures
- `test/sim.test.mjs` — autopilot simulation test

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
