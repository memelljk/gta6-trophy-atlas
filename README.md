# Trophy Atlas — GTA VI Trophy Guide & Tracker

![make.fun competition](https://make.fun/badge/gta6-trophy-guide-01.svg)
![my rank](https://make.fun/badge/gta6-trophy-guide-01/memelljk/gta6-trophy-atlas/rank.svg)
![my reward](https://make.fun/badge/gta6-trophy-guide-01/memelljk/gta6-trophy-atlas/reward.svg)

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft Auto VI**, built for the make.fun competition [Build the best GTA 6 trophy guide](https://make.fun/c/gta6-trophy-guide-01).

## What it does

- **Full checklist of the 55 trophies** with the official name, description and grade exactly as PlayStation publishes them (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden until earned, each flagged).
- **An original guide for every trophy**, written for this atlas, saying what to do, where and how — and **citing its sources beside each guide** (GTABase, PlanetGTA6/Exophase, Output Lag, KeenGamer, EGamers). Where a trigger is still unconfirmed in launch-week reporting, the guide says so instead of inventing steps.
- **The one missable trophy, flagged hard:** Positive Mental Attitude and its Chapter 1 balcony meditation, which disappears when Chapter 1 ends — the detail view carries the full warning and when it can be missed.
- **A ten-stage roadmap to the platinum** built from the official descriptions: story chapters and named missions in order, character lines as they open, counted collectibles with their counts (250 stunts, 42 range golds, 18 meditations, 100 WAiNK scans…), a crime-and-money cleanup, and 100% completion last.
- **A real tracker:** tick trophies off and progress is saved in the browser (localStorage), with a progress bar and per-grade counts; **export** progress to a JSON file and **import** it back on any machine.
- **Filters** by kind (story, missable, collectibles, activities, online — the base list has no online trophies, and the app says so), by earned/unearned, plus text search.
- **Spoiler shield:** while it is on, story trophies show as “Hidden story trophy” — name and description stay hidden until you earn each one.
- **Fully offline:** static files only, no build step, no network requests at run time. The look is original CSS — no game artwork, logos or screenshots.

## Run it

Serve the `app/` folder with any static file server and open it in a browser, e.g.:

```
node serve.ts
```

then visit http://localhost:8080. (Node 22+ runs the included `serve.ts` directly; any other static server rooted at `app/` works just as well.)

## Hand it in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Screenshots

The four screenshots in `screenshots/` show the checklist with a cited guide open (cover), the roadmap to the platinum, the missable filter with the spoiler shield at work, and the tracker with saved progress and export/import.

## License

MIT — see `LICENSE`.
