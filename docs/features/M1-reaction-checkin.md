# M1: Reaction check-in ("tap when green")

Feature F03. Owner: Claude. Code: `src/core/pvt.ts`, `src/core/qc.ts`. Shapes and constants: `docs/blueprint/03-data-model.md`.

## What it does

Sara takes a 3-minute reaction test (PVT-B). The browser times each tap and sends the raw trials. The server scores them. Nothing the client computes is trusted.

## Protocol (served by `GET /api/checkin/protocol`, so the frontend hardcodes nothing)

- 3 minutes. After each response, the next target appears after a random 1–4 s; the first 1 s of that gap shows the reaction time as feedback.
- A tap before the target appears is recorded as `{early: true, rtMs: null}` and the gap restarts.
- No tap within `noResponseTimeoutMs` is recorded as `{early: false, rtMs: null}`.
- Every trial is sent, in order. `rtMs` is whole milliseconds from target onset.
- Timing advice for the frontend: show the target inside `requestAnimationFrame`, read `event.timeStamp` on `pointerdown` or `keydown`, same device and input every day.

## Scoring (`scorePvt(trials): PvtMetrics`)

| Quantity | Definition |
|---|---|
| `falseStarts` | trials with `early` + trials with `rtMs < 100` |
| `stimuli` | trials with `early: false` and not (`rtMs < 100`) |
| `lapses` | of those, `rtMs === null` or `rtMs >= 355` |
| `validResponses` | of those, `rtMs !== null` |
| `meanSpeed` | mean of `1000 / rtMs` over `stimuli`; a `null` uses `noResponseTimeoutMs` |
| `medianRtMs` | median `rtMs` over `validResponses`; `null` if none |
| `performanceScore` | `100 × (1 − (lapses + falseStarts) / (stimuli + falseStarts))` |

`meanSpeed` (responses per second) is the metric the zone uses. Mean reaction time is not used for decisions.

## Known-answer test (hand-computed)

Trials: one `early`; then `rtMs` = 200, 250, 250, 300, 400, `null`, 90, 240.

- `falseStarts` = 2 (the early tap and the 90)
- `stimuli` = 7, `lapses` = 2 (400 and `null`), `validResponses` = 6
- `meanSpeed` = (5 + 4 + 4 + 3.33333 + 2.5 + 0.03333 + 4.16667) / 7 = **3.2905**
- `medianRtMs` = **250**
- `performanceScore` = 100 × (1 − 4/9) = **55.56**

## Quality checks (`checkSession(input): string[]`)

| Flag | When |
|---|---|
| `too_few_stimuli` | fewer than 20 stimuli |
| `duration_out_of_range` | sum of gaps and reaction times outside 150–210 s |
| `isi_out_of_range` | any `isiMs` outside 1 000–4 000 (50 ms tolerance) |
| `implausibly_fast` | median reaction time under 120 ms |

A flagged session is stored with its flags, gets zone `not_scored`, stays out of the baseline, and returns card `checkin-retake`.

## Tests (`tests/unit/pvt.test.ts`)

- The known-answer session above, to 4 decimals.
- Boundaries: 354 is not a lapse, 355 is; 99 is a false start, 100 is not.
- Empty trials, all-early trials, all-`null` trials: no crash, no `NaN`.
- Each quality flag fires at its limit and not just inside it.

## Out of scope

Pre-test mood or workload ratings (only optional `sleepHours`), other test lengths, device calibration.
