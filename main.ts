// Trophy Atlas — the gta6-trophy-guide-01 entry program (Node 22, standard library only).
//
// What the entry is: an offline guide and tracker for the 55 PlayStation 5 trophies of
// Grand Theft Auto VI. The app itself is the plain static site in app/ (index.html,
// style.css, app.js and data/trophies.json — no build step, no network at run time):
// a checklist with progress saved in the browser, kind and earned filters, a spoiler
// shield for story trophies, a ten-stage roadmap to the platinum, and an original
// guide with cited sources for every single trophy.
//
// What this program does: the hand-in. It copies app/ and screenshots/ from beside
// this file into the output directory and writes dossier.json there with the vendored
// make.fun library (vendor/makefun-frontend.ts, left exactly as the kit ships it —
// the scorer rebuilds the dossier with its own copy and compares byte for byte).
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the site and its screenshots exactly as they sit in the repository, so the
// graded output is a pure function of the committed files (two runs, same bytes).
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// One line of run output so a local build is visibly done (stdout is not graded).
console.log(`Trophy Atlas handed in to ${out} (app/ + screenshots/ + dossier.json)`);
