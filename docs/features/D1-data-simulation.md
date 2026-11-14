# D1: Sample data (simulated signals + real NASA file)

Features F02 (lane A) and F10 (Claude). Code: `tools/simulate/`. Output: `data/fixtures/`. Parameters and their sources: `data/README.md`.

## Two kinds of data, kept apart

| Kind | What | Where | Label in the API |
|---|---|---|---|
| Simulated | 120 days of daily signals for Sara and 3 crew | `data/fixtures/` | `source: "simulated"` |
| Real | Inspiration4 blood counts, 4 crew × 7 timepoints (OSD-569) | `data/nasa/` | `source: "nasa-osd-569"` |

The simulated data is shaped by published ISS findings. It is not NASA data and must never be described as such.

## Simulated signals

| Signal | Cadence | Anchors (all in `research/CHECKS.md`) |
|---|---|---|
| Sleep hours | nightly | ISS mean 6.09 ± 0.67 h (Barger 2014, #9) |
| Reaction test: raw trials | daily, about 5% of days missed | Rested PVT-B speed about 4.1–4.3 /s, median 1 lapse (R2 #11); ≤ 6 h sleep slows speed (R2 addendum) |
| Blood pressure: 2 readings | every 3rd day | Pre-flight 129/85 → in flight 121/76 by months 3–6 (Norsk 2015, #7) |
| Resting heart rate | daily | 65.5 ± 7.7 bpm between people; unchanged in flight (Quer 2020 #10, Norsk) |

Resting heart rate is generated for the Later features; no Must rule reads it.

## Model

For each daily value: `value(day) = personal mean + drift(day) + ar1(day) + sum of active event effects`.

- `ar1(day) = φ × ar1(day − 1) + noise`, so runs of days look related.
- `drift`: blood pressure settles to its in-flight level over the first 30 days; reaction speed and heart rate have none.
- No time-of-day term: the check-in happens at the same time each morning (published circadian sizes were not verified).
- Reaction trials: draw each trial's speed around that day's target speed, convert to `rtMs`; add lapses and false starts at that day's rates; stop at 180 s.

## Events (written to `meta.events` as ground truth)

| id | Mission days | Effect | Basis |
|---|---|---|---|
| `short-sleep-week` | 35–41 | Sleep 4.5–5.5 h; speed falls day by day | Van Dongen 2003 (R6 #10) |
| `illness` | 62–70 | Resting heart rate +7 bpm, starting 4 days before the worst day | Mishra 2020 (#13) |
| `high-workload` | 105–108 | 1–2 nights under 5 h; slower reactions | R6 #13 (medium confidence) |
| `short-sleep-before-120` | nights before 119 and 120 | Sleep under 6 h; day 120 lands in `act` | Jones 2022 (R2 addendum) |

Each crew member gets their own means and one event of their own.

## Honesty table (`data/README.md` must contain it)

Every generator parameter is listed as **sourced** (with its CHECKS row) or **assumption** (with one line of reasoning). Known assumptions: day-to-day SD of reaction speed and blood pressure, `φ`, the size of the sleep effect per lost hour, trial-level spread. R2 and R6 both record that these have no published within-person value.

## Determinism

- One seeded generator (mulberry32 + Box–Muller); a separate stream per subject and per signal, derived from the master seed. No `Math.random()`, no clock.
- Stable key order, whole milliseconds, one decimal for hours, `\n` line endings.
- `npm run simulate` writes the files. `npm run simulate -- --check` regenerates in memory and fails if anything differs.
- Output validates against `src/schemas/`. `meta` holds `seed`, `generatorVersion`, `events`.

## Tests

- `tests/unit/simulate.test.ts` (lane A): schema-valid; two runs identical; a different seed differs; 120 days per subject; rested-period means inside the anchor ranges above; every event present in `meta`.
- `tests/golden/hero-flow.test.ts` (Claude, F09): scoring the fixture puts day 120 in `act` with rule `RT-SHORT-SLEEP`, and the peak of `short-sleep-week` in `act`. If it doesn't, Claude adjusts the event size in the generator config and records the change in `data/README.md`.
- `tests/golden/nasa-i4.test.ts` (Claude, F10): the CSV parses to 4 subjects × 7 timepoints; pre-launch samples form each baseline (`minSessions: 3`); the known out-of-range value (C002 hematocrit 34.7 at R+82, range 35–45) is reported below its reference range.

## Out of scope

Environment signals (CO2, radiation), within-day sampling, calibration against PhysioNet or OpenNeuro datasets.
