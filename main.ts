// Star Salvager's entry program (Node 22, standard library only): copies the
// game/ and screenshots/ of this repository to /output and writes the dossier
// the judge reads with the kit's vendored makefun-game library. Runs as-is:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Star Salvager: pilot a salvage barge through a drifting debris belt, scoop
// green salvage pods, and spend pulse charges to shatter incoming rocks.
// Three hull points, endless levels, seeded deterministic runs, WebAudio bleeps
// and zero asset files — every visual is drawn on canvas and every sound is
// synthesised, so the whole game is source the agent wrote.
//
// Layout:
//   game/index.html        the canvas shell
//   game/src/*.js          config, seeded rng, input, simulation, render, loop, sound
//   screenshots/           four PNG captures (title, play, end) from headless Chrome
//   test/sim.test.mjs      a headless autopilot smoke test of the simulation
//   serve.ts               `node serve.ts` then open http://localhost:8080

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's caps (reference/gate.json): the dossier must be what buildDossier
// writes from exactly these limits or the entry is refused.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
