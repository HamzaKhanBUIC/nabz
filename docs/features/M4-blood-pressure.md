# M4: Guided blood pressure measurement

Feature F06. Owner: Claude (`src/core/bp.ts`). Guide text: lane B (`content/bp-guide.json`).

## What it does

Walks Sara through taking her blood pressure, then averages the readings, names the category, compares the result with her own normal, and says what to do next.

## Guide (`GET /api/measurements/bp/guide`)

Steps with optional timers. Wording follows the home-measurement steps confirmed in `research/CHECKS.md` (R3 addendum, CDC):

1. Nothing to eat or drink, and no caffeine, smoking or exercise, in the last 30 minutes.
2. Empty your bladder.
3. Put the cuff on your bare upper arm, snug but not tight.
4. Anchor yourself so you can stay still and relaxed. *(microgravity adaptation of "feet flat, back supported"; marked `adaptation: true`)*
5. Rest quietly for 5 minutes. `timerSeconds: 300`
6. Keep the cuff at chest height. Stay silent while it inflates.
7. Take reading 1.
8. Wait 1 minute, then take reading 2. `timerSeconds: 60`

The guide also carries the two symptom checklists the frontend shows before submitting (`severeSymptoms`, `lowSymptoms`).

## Evaluation (`evaluateBp(input, history): BpMeasurement`)

1. **Average** systolic and diastolic over the readings, rounded to whole mmHg.
2. **Category**, checked in this order on the average:

| Category | Rule |
|---|---|
| `severe` | systolic > 180 or diastolic > 120 |
| `stage2` | systolic ≥ 140 or diastolic ≥ 90 |
| `low` | systolic < 90 or diastolic < 60 |
| `stage1` | systolic 130–139 or diastolic 80–89 |
| `elevated` | systolic 120–129 and diastolic < 80 |
| `normal` | systolic < 120 and diastolic < 80 |

3. **Personal zone** on systolic with the M2 fold (two-sided). \|z\| ≥ 1.5 gives `watch`; z never gives `act`.
4. **Sustained high:** this and the previous two measurements, all on different mission days, all ≥ 140/90.
5. **Card and next action** from the M3 blood pressure table.

`retestOf` links a second measurement to the first. A retest that is still severe fires `BP-SEVERE-CONFIRMED`.

## Why her own normal matters here

On the ISS, 24-hour blood pressure runs about 8/9 mmHg lower than before flight (Norsk 2015, CHECKS #7). A reading that looks fine on the chart can be high for Sara in flight. `bp-off-normal` says so.

## Tests (`tests/unit/bp.test.ts`)

- Boundaries on the average: 119/79 normal · 120/79 elevated · 129/80 stage 1 · 130/79 stage 1 · 139/89 stage 1 · 140/89 stage 2 · 139/90 stage 2 · 180/120 stage 2 · 181/120 severe · 180/121 severe · 90/60 normal · 89/60 low · 90/59 low.
- Two readings 121/79 and 118/78 average to 120/79 (rounding half up) → elevated.
- Severe + "chest pain" → urgent, `alert_crew`. Severe, no symptoms, first → `retest`, 300 s. Same with `retestOf` → confirmed.
- Low + "fainting" → urgent. Low, no symptoms → `watch`.
- Three stage 2 measurements on three days → sustained. Two on the same day don't count twice.
- An unknown symptom string is rejected by the schema.

## Out of scope

Reading the cuff device, cuff-size advice, medication, any diagnosis wording.
