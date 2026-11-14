# Simulated Crew Health Fixtures

These files contain **120 days of synthetic, seeded health data** for Sara (Commander) and three fellow crew members (`mateo`, `elena`, `kenji`) on a simulated Mars transit mission (`launchDate: 2026-07-19`, day 120 = `2026-11-15`).

**Important:** This is simulated data shaped by published ISS and clinical findings. It is **not** NASA data and must never be described as NASA data. (Real NASA Inspiration4 blood counts live separately in `data/nasa/`.)

## Reproducing and verifying

- Master seed: `20261115` (`generatorVersion: "2.0.0"`)
- Regenerate fixtures: `npm run simulate`
- Verify byte-identical match against disk: `npm run simulate -- --check`

All randomness comes from a deterministic `mulberry32` PRNG + Box-Muller normal sampler in `tools/simulate/rng.ts`, with per-subject and per-signal sub-streams derived via FNV-1a hashing (`deriveSeed(masterSeed, "${subjectId}:${signal}")`).

## Honesty table

Every parameter in `tools/simulate/config.ts` and `tools/simulate/signals.ts` is either **sourced** from `research/CHECKS.md` (or `research/R*` where noted) or explicitly labeled as an **assumption**.

| Parameter | Value | Status | Source or reasoning |
|---|---|---|---|
| Mission profile & Mars one-way delay | `mars-transit`, 3–22 min | **Sourced** | `research/CHECKS.md` #15 |
| Reference profiles (`station`, `moon`) | 1 s / 1.3 s | **Sourced** | `research/CHECKS.md` #16 (Moon ~1.3 s), `research/R5` #1 (< 1 s ISS) |
| PVT-B session target duration | 180 000 ms (3 min) | **Sourced** | `research/CHECKS.md` R2 (Basner et al. 2011, PMC3197786) |
| PVT-B inter-stimulus interval (ISI) | 1 000–4 000 ms | **Sourced** | `research/CHECKS.md` R2 (1–4 s including 1 s feedback) |
| PVT-B lapse threshold | >= 355 ms | **Sourced** | `research/CHECKS.md` R2 (Basner et al. 2011) |
| PVT-B false start threshold | < 100 ms or early tap | **Sourced** | `research/CHECKS.md` R2 (Basner et al. 2011) |
| Rested PVT-B speed & lapses | ~4.1–4.3 /s, median 1 lapse | **Sourced** | `research/R2` #11 (PVT-3 healthy adult rested baseline) |
| Short sleep slowdown threshold | <= 6.0 h sleep | **Sourced** | `research/CHECKS.md` R2 addendum (Jones et al. 2022, PMC8919197) |
| Low PVT speed z-score threshold | z <= -1.5 SD | **Sourced** | `research/CHECKS.md` R2 addendum (Cognition ISS, PMC11614644) |
| In-flight sleep mean & spread | ~6.09 ± 0.67 h/night | **Sourced** | `research/CHECKS.md` #9 (Barger 2014) |
| Blood pressure drift in flight | Pre-flight ~129/85 -> in-flight ~121/76 (-8 / -9 mmHg) | **Sourced** | `research/CHECKS.md` #7 (Norsk 2015, ISS months 3–6) |
| Resting heart rate mean & spread | ~65.5 ± 7.7 bpm, unchanged in flight | **Sourced** | `research/CHECKS.md` #10 (Quer 2020) and #7 (Norsk 2015) |
| Illness RHR elevation kernel | +7 bpm starting 4 days pre-peak | **Sourced** | `research/CHECKS.md` #13 (Mishra 2020) |
| Short-sleep week (`short-sleep-week`) | Days 35–41, 4.5–5.5 h sleep, progressive slowing | **Sourced / Assumption** | `research/R6` #10 (Van Dongen 2003); exact day range and ramp size are simulation choices |
| High-workload event (`high-workload`) | Days 105–108, 2 nights < 5 h sleep | **Sourced / Assumption** | `research/R6` #13 (medium confidence); exact magnitude is a simulation choice |
| Subject personal means (sleep, speed, BP, RHR) | Sara 6.35 h / 4.22 /s / 118/75 / 63 bpm (+3 crew) | **Assumption** | Chosen inside the sourced ISS crew ranges so each crew member has a distinct normal |
| Day-to-day AR(1) persistence `phi` | sleep 0.45, speed 0.25, BP 0.45, HR 0.50 | **Assumption** | `research/R6` notes within-person day-to-day autocorrelation has no published ISS table; keeps multi-day runs realistic |
| Day-to-day innovation SDs | speed 0.16–0.17 /s, sleep 0.25–0.28 h, BP 4.0/3.0 mmHg, HR 1.4 bpm | **Assumption** | `research/R2` and `R6` note intra-individual daily SDs are unverified; scaled for realistic 14-day baselines |
| `sleepLossSpeedPenaltyPerHour` | 0.108 1/s per hour of accumulated sleep debt | **Assumption** | Anchored to Basner & Dinges 2011 (`research/R2` #15: 5 nights of 4 h lower PVT speed by `0.545 /s`; with `0.65` carry-over that builds `~5.05 h` debt, so `0.545 / 5.05 = 0.108`) |
| `cumulativeSleepDebtFactor` | 0.65 | **Assumption** | Share of yesterday's sleep debt carried into today |
| `restedLapsesPerSession` | 1.0 | **Sourced** | `research/R2` #11 (median 1 lapse on the 3-min PVT-B) |
| `lapsesPerSpeedDrop` | 14 | **Assumption** | Extra lapses added smoothly per `1/s` of lost reaction speed |
| BP 30-day settling drift | Linear decay from +8/+9 mmHg on day 1 to 0 after day 30 | **Assumption** | Smoothly models headward fluid shift adaptation over the first 30 flight days |
| BP measurement cadence & within-session noise | Every 3rd day, 2 readings, ±2.5/2.0 mmHg | **Assumption** | Matches 2-reading protocol while keeping 40 measurements per crew member across 120 days |
| Missed check-in rate | ~5% outside protected windows | **Assumption** | Models occasional skipped morning check-ins without breaking baseline build or hero events |
| Trial-level RT spread | normal(0, 0.35) around target non-lapse speed | **Assumption** | Produces realistic within-session RT distributions while honoring exact session `meanSpeed` |

## Changes

- **Generator 1.1.0 (Nov 14, orchestrator review):** blood pressure spread raised from 1.5/1.1 to 4.0/3.0 mmHg day to day (and 2.5/2.0 within a session), now named in `config.ts` as `bpNoiseMmHg`. The first version gave Sara a systolic SD of about 1.5 mmHg, so a reading 3 mmHg from her mean was flagged as "different from your normal". The new values give a day-to-day SD of about 5 mmHg (CV about 4%). This is still an **assumption**; R6 #4 only gives the 11% CV above which variability is linked to raised risk. Reaction, sleep and heart-rate streams use separate seeds and did not change.
- **Generator 2.0.0 (Nov 14, orchestrator review):** replaced the heuristic/circular check-in speed shaping with a pure forward model (`speedMean + ar - sleepLossSpeedPenaltyPerHour * sleepDebt`) that knows nothing about baselines, z-scores, or zones, removed non-event sleep censoring on days 109–118, set `shortSleepThresholdHours: 6.0`, `sleepLossSpeedPenaltyPerHour: 0.108`, `restedLapsesPerSession: 1.0`, and `lapsesPerSpeedDrop: 14`, and kept Sara's `short-sleep-before-120` event as two short nights (~4.2 h then ~3.2 h).
