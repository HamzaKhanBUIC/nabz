# M3: Action card

Feature F05. Owner: Claude (`src/core/cards.ts`). Card wording: lane B (`content/cards.json`).

## What it does

Turns rule inputs into one card: what changed, why it matters, what to do. A fixed table decides; the first matching rule wins. No model is involved.

## Inputs

```ts
type ReactionInput = { zone: Zone; z: number | null; lapses: number; falseStarts: number;
                       qcFlags: string[]; sleepHours: number | null; consecutiveActDays: number };
type BpRuleInput   = { category: BpCategory; systolic: number; diastolic: number;
                       severeSymptoms: string[]; lowSymptoms: string[];
                       isRetest: boolean; sustainedHigh: boolean; z: number | null };
```

## Rule tables (priority order; first match wins)

After a blood pressure measurement:

| # | ruleId | When | Card | Severity | Next action |
|---|---|---|---|---|---|
| 1 | `BP-SEVERE-SYMPTOMS` | severe and any severe symptom | `bp-severe-symptoms` | urgent | alert_crew |
| 2 | `BP-LOW-SYMPTOMS` | low and any low symptom | `bp-low-symptoms` | urgent | alert_crew |
| 3 | `BP-SEVERE-CONFIRMED` | severe, no symptoms, is a retest | `bp-severe-confirmed` | act | alert_crew |
| 4 | `BP-SEVERE-RETEST` | severe, no symptoms, first measurement | `bp-severe-retest` | act | retest after 300 s |
| 5 | `BP-SUSTAINED-HIGH` | last 3 measurements, on different days, all ≥ 140/90 | `bp-sustained-high` | act | none |
| 6 | `BP-STAGE2` | stage 2 | `bp-high` | watch | none |
| 7 | `BP-LOW` | low, no symptoms | `bp-low` | watch | none |
| 8 | `BP-OFF-NORMAL` | \|z\| ≥ 1.5 | `bp-off-normal` | watch | none |
| 9 | `BP-ABOVE-IDEAL` | elevated or stage 1 | `bp-above-ideal` | info | none |
| 10 | `BP-OK` | otherwise | `bp-normal` | in_zone | none |

After a reaction check-in:

| # | ruleId | When | Card | Severity |
|---|---|---|---|---|
| 1 | `RT-RETAKE` | any quality flag | `checkin-retake` | info |
| 2 | `RT-BUILDING` | zone `building` | `baseline-building` | info |
| 3 | `RT-PERSISTENT` | zone `act` and this is the 3rd `act` check-in in a row | `reaction-slow-persistent` | act |
| 4 | `RT-SHORT-SLEEP` | zone `act` and `sleepHours` ≤ 6 | `reaction-slow-short-sleep` | act |
| 5 | `RT-SLOW` | zone `act` | `reaction-slow` | act |
| 6 | `RT-WATCH` | zone `watch` | `reaction-watch` | watch |
| 7 | `RT-OK` | otherwise | `all-normal` | in_zone |

`GET /api/today` returns the most severe of today's cards as `card` and all of them as `cards`.

## Templates (`content/cards.json`)

Each template has `id`, `title`, `whatChanged`, `whyItMatters`, `whatToDo[]`, `sourceIds[]`, optional `links`. Text may use only these placeholders, filled from `facts`: `{zAbs}`, `{sleepHours}`, `{lapses}`, `{days}`, `{systolic}`, `{diastolic}`, `{retestMinutes}`.

- `whyItMatters` states a finding from a cited source. `whatToDo` is decision support (rest, re-check, tell a crewmate, defer precision work), never a diagnosis or a drug dose.
- Every card ends up with `facts`, `ruleId`, `sources` and the disclaimer. Those four are what the AI coach reads later.

## Output

`selectCard(input, templates): Card`. A missing template or an unfilled placeholder throws at start-up, not at request time.

## Tests (`tests/unit/cards.test.ts`)

- One test per rule at its boundary, plus one where a higher rule must win (severe with symptoms beats sustained).
- Sleep 6.0 fires `RT-SHORT-SLEEP`; 6.1 falls to `RT-SLOW`. Two `act` days don't fire `RT-PERSISTENT`; three do.
- Every template: all placeholders resolve, at least one source, disclaimer present, `whatToDo` not empty.
- Every rule's card id exists in `content/cards.json`.

## Out of scope

Combining several signals into one score, free-text advice, anything written by a model.
