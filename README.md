# Star Salvager

A fast little arcade salvager: pilot a barge through a debris belt, scoop
green salvage pods, and spend pulse charges to shatter incoming rocks.
Three hull points, endless scaling levels, deterministic seeded runs.

## Controls

- Arrow keys / WASD — steer and thrust
- Space — fire pulse blast (clears nearby debris, +points per wreck)
- M — toggle sound
- Enter or click — start / restart

## Run it

Static ES modules, no build step:

    node ../serve.ts  # or any static file server
    # then open http://localhost:PORT/game/

Or just open `game/index.html` through any static server.

## Structure

- `game/index.html` — canvas shell
- `game/src/config.js` — all tuning constants
- `game/src/rng.js` — seeded xorshift RNG (deterministic runs)
- `game/src/input.js` — keyboard + pointer
- `game/src/world.js` — pure simulation (ship, pods, debris, pulse)
- `game/src/render.js` — canvas drawing
- `game/src/main.js` — fixed-timestep loop + `?shot=` capture hooks
- `game/src/sound.js` — WebAudio bleep synth (zero assets)

## Capture hooks

`game/index.html?shot=title` (default), `?shot=play`, `?shot=end`, and
`?seed=N` give deterministic states for screenshots.
