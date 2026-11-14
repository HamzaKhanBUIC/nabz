# M2: Personal normal zone and trend

Feature F04. Owner: Claude. Code: `src/core/baseline.ts`, `src/core/zone.ts`.

## What it does

Compares each new value with Sara's own recent history, never with a population norm, and returns a zone. It also produces the series the chart draws: daily points plus her personal band.

## Baseline (`foldHistory(entries, options): ScoredEntry[]`)

Entries are processed oldest first. For each entry:

1. **Window:** the last 14 earlier valid entries (no quality flags); for two-sided blood pressure, off-normal `watch` outliers also stay out of later windows so a severe reading does not shift the normal band.
2. **Ready** when the window holds at least 5 entries and their SD is above 0.
3. **Baseline:** mean and sample SD (n − 1) of the window.
4. **z** = (value − mean) / SD. `null` when not ready.
5. **Zone** from z (below). The entry's zone decides whether later windows may include it.

`options` carries `windowSessions`, `minSessions` and `direction`, so the same function serves reaction speed, blood pressure and the NASA data (which has 3 pre-launch samples and uses `minSessions: 3`).

The fold is pure: same entries in, same result out. It never reads the clock.

## Zones

| Zone | Reaction speed (lower is worse) | Label | Icon |
|---|---|---|---|
| `not_scored` | session flagged | "Not scored" | `info` |
| `building` | baseline not ready | "Learning your normal" | `hourglass` |
| `in_zone` | z > −1.0 | "Within your normal" | `check` |
| `watch` | −1.5 < z ≤ −1.0 | "Slightly below your normal" | `eye` |
| `act` | z ≤ −1.5 | "Below your normal" | `alert` |

Faster than normal is `in_zone`. For blood pressure the comparison is two-sided and tops out at `watch` (see M4); categories, not z, drive `act` there.

## Trend (`buildTrend(code, scoredEntries, days): Trend`)

- `points`: one per entry in the last `days`, with `value`, `z`, `zone`, and the baseline mean and SD that applied on that day.
- `band`: today's baseline, with `watchAt` = mean − 1.0 × SD and `actAt` = mean − 1.5 × SD.
- Codes: `reaction-speed` (responses/s), `bp-systolic`, `bp-diastolic` (mmHg), `sleep-hours` (h, zone always `not_scored`).

## Tests (`tests/unit/baseline.test.ts`)

- 4 entries: `building`. 5 entries with spread: ready.
- Hand-computed case: window values 4.0, 4.1, 4.2, 4.3, 4.4 → mean 4.2, SD 0.15811. A new value of 3.9628 gives z = −1.5 → `act`; 3.9700 gives z = −1.4546 → `watch`; 4.0418 gives z = −1.0005 → `watch`; 4.0500 gives z = −0.9487 → `in_zone`.
- A flagged entry is not in the next entry's window; valid one-sided entries stay in the window so the baseline does not ratchet upward, while two-sided (`watch`) outliers stay out.
- All-equal window (SD 0): not ready, no division by zero.
- Missing days are fine: the window counts sessions, not calendar days.
- Trend returns the requested number of days and a band that matches the last baseline.

## Out of scope

Forecasting, seasonality, crew comparison, any upper flag for reaction speed.
