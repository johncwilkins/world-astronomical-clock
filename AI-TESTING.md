# Regatta AI test lab

The boats use a rule-based controller. Offline races identify navigation failures and choose safer settings; playing the game does not retrain them.

## Run the repeatable benchmark

Use Node.js from the project root. No packages or model service are required.

```sh
node scripts/ai-lab.mjs --count 1000 --version current --out scripts/ai-reports/current-1000.json
node scripts/ai-lab.mjs --count 1000 --version baseline --out scripts/ai-reports/baseline-1000.json
```

The baseline controller is the version before the navigation update. Its optimal-sheet computation has an equivalent faster implementation, verified against the original integer search in `scripts/check-optimal-sheet.mjs`, to keep the experiment practical.

The benchmark uses the game's boat physics, wind field, buoy routes, legal start/finish scoring, wind shadows, and collision penalties at 20 steps per second (the game's maximum timestep is also 0.05 seconds). Four worker threads run independent races.

Each seed chooses one of six courses, one to three laps, wind from 6 to 20 knots, a wind bearing, a puff phase, and randomized starting positions/headings/speeds. Five named AI competitors race a sixth benchmark skipper with Weekend Warrior or Spider skill. This skipper is a reproducible reference, not a model of a human player.

Diagnostics continue until all six finish or the time limit expires, which is stricter than the playable race's fifth-finisher cutoff. Contact counts include the countdown and this extended period. Contacts separated by at least 0.9 seconds are counted as distinct incidents. Reports record late starts, collision faults, buoy contacts, finish order, and unfinished boats. Long periods without rounding a mark can be normal on long courses; they are logged separately from time-limit failures.

## Replay a troublesome race

```sh
node scripts/ai-lab.mjs --replay 226 --version current --out scripts/ai-reports/replay-226.json
```

Use the same `--seed` (default 73491) and `--dt` for exact reproduction. Replay JSON includes positions and navigation phases once per simulation second, plus the first 60 events. An index and seed are included in every report.

## Automatic tuning

```sh
node scripts/tune-ai.mjs
```

The search evaluates eight bounded combinations of look-ahead time, boat/mark clearance, collision-risk weight, and heading-change cost over the same 48 races. Its score heavily penalizes failures, contacts, prolonged contact, and delayed starts. It writes its selection and all candidate reports under `scripts/ai-reports`.

The search deliberately cannot alter propulsion, pointing limits, penalties, mark-registration rules, turn rates, or the competitors' skill/trim settings. Ace and Marquee remain the strongest sailors; Scope, Spider, and Weekend Warrior retain their differences. A training winner is reviewed and validated over the larger batch before its settings are copied into `AI_NAVIGATION` in `racers.js`.

This is controller tuning and regression testing, not a neural-network learner. A clean benchmark cannot guarantee zero collisions against an unpredictable human, and finishing time is not the tuning objective.
