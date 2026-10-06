# AI navigation validation

Same 1,000 seeded six-boat races before and after tuning; 952 were outside the 48-race tuning set. All courses, randomized starts, one to three laps, wind 6–20 knots, and moving puffs.

| Metric | Before | After | Change |
|---|---:|---:|---:|
| Boat contact incidents | 7,352 | 1,129 | 84.6% fewer |
| Mark/committee contacts | 980 | 426 | 56.5% fewer |
| Port-tack collision faults | 4,654 | 365 | 92.2% fewer |
| Races with all six finished | 997 | 1000 | +3 |
| Unfinished boats at time limit | 3 | 0 | Eliminated in this batch |

The automated reference skipper won 126 races. It uses Weekend Warrior or Spider skill and is not a human-performance model. Competitor skill settings, physical propulsion/drag, pointing limits, and legal scoring are unchanged. Exact optimal-sheet selection is computed faster, with 5,800 exhaustive-search equivalence cases.

Contact metrics include the countdown and continue until all six finish, beyond the playable fifth-finisher cutoff. A passed batch does not guarantee zero collisions or no stalls with an unpredictable human. Longest continuous contact period was 3.7 seconds (before: 3.45).

The chosen settings were selected from eight navigation-only candidates. Raw per-race metrics, tuning results, and seeds are in this folder. Use the replay command in README-AI.md / AI-TESTING.md to inspect a seed.
