# Simulated Crew Health Fixtures

These files contain **120 days of synthetic, seeded health data** for Sara (Commander) and three fellow crew members (`mateo`, `elena`, `kenji`) on a simulated Mars transit mission (`launchDate: 2026-07-19`, day 120 = `2026-11-15`).

**Important:** This is simulated data shaped by published ISS and clinical findings. It is **not** NASA data and must never be described as NASA data. (Real NASA Inspiration4 blood counts live separately in `data/nasa/`.)

## Reproducing and verifying

- Master seed: `20261115` (`generatorVersion: "1.0.0"`)
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
| Day-to-day innovation SDs | speed 0.16–0.17 /s, sleep 0.25–0.28 h, BP 1.5/1.1 mmHg, HR 1.4 bpm | **Assumption** | `research/R2` and `R6` note intra-individual daily SDs are unverified; scaled for realistic 14-day baselines |
| `sleepLossSpeedPenaltyPerHour` | 0.48 1/s per hour < 6.0 h | **Assumption** | Calibrated so Sara's short-sleep week and day-120 short sleep land cleanly in `act` (z <= -1.5) |
| `cumulativeSleepDebtFactor` | 0.65 | **Assumption** | Carryover across consecutive nights < 6 h so day 119 hits `watch` and day 120 hits `act` |
| BP 30-day settling drift | Linear decay from +8/+9 mmHg on day 1 to 0 after day 30 | **Assumption** | Smoothly models headward fluid shift adaptation over the first 30 flight days |
| BP measurement cadence & within-session noise | Every 3rd day, 2 readings, ±1.5/1.2 mmHg | **Assumption** | Matches 2-reading protocol while keeping 40 measurements per crew member across 120 days |
| Missed check-in rate | ~5% outside protected windows | **Assumption** | Models occasional skipped morning check-ins without breaking baseline build or hero events |
| Trial-level RT spread | normal(0, 0.35) around target non-lapse speed | **Assumption** | Produces realistic within-session RT distributions while honoring exact session `meanSpeed` |
