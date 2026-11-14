# Wireframe vs API Contract Review

Review of the 9 desktop + responsive wireframe screenshots against [docs/api-contract.md](./api-contract.md), [src/schemas/](./../src/schemas/endpoints.ts), and [docs/blueprint/01-scope.md](./blueprint/01-scope.md).

---

## 1. Remove / Hide Now (Not in Must or Returns `501 not_built`)

| UI element | Screen(s) | Why |
|---|---|---|
| Mood rating (`1–5` scale, `Mood 3 / 5`, Mood toggle/series) | Screens 1, 2, 3, 8 | Mood is not in the backend schema. `POST /api/checkins` uses `z.strictObject` (`{ protocolId, startedAt, trials, sleepHours? }`) and rejects unknown fields with HTTP `400 invalid_input`. |
| `Coach` nav item, `"Ask the coach"` button, Screen 7 | All screens, 4, 7 | `POST /api/coach/ask` is a reserved Should slot (`S02`) returning `501 not_built`. Hide until S02 is implemented. |
| `Send to Earth` nav item, `"Send to Earth?"` button, Screen 8 | All screens, 4, 8 | `POST /api/share/preview` and `POST /api/share` are reserved Should slots (`S04`) returning `501 not_built`. Hide until S04 is implemented. |
| `"Reminder (Should): blood pressure due today"` banner | Screen 1 | `GET /api/today` returns `nextDue: null` and `/api/reminders` returns `501 not_built` (`S05`). Only show when `today.nextDue !== null`. |
| `"Who is this for? Me / A crewmate"` picker | Screen 6 | Must ships first-person (`for: "self"`) procedures only. `GET /api/emergency/procedures?for=crewmate` returns an empty list until `S01` is built. |

---

## 2. Edit to Match Backend Contract

| Screen | Wireframe currently shows | Required change to match `docs/api-contract.md` |
|---|---|---|
| Top bar (all screens) | `Earth delay ~18 min` (static text) | Render `Earth delay {oneWayMinMinutes}–{oneWayMaxMinutes} min` (`3–22 min`) from `GET /api/mission` (`commsDelay`). |
| Screen 1 (`Today`) & Screen 2 (`Reaction check-in`) | `Start check-in (2 min)` and `12 of 30 seconds` | Read `durationMs` from `GET /api/checkin/protocol` (`180000 ms` = **3 minutes**). Sessions under `150000 ms` or `< 20` stimuli are flagged by QC (`zone: "not_scored"`, card `checkin-retake`). |
| Screen 3 (`Normal zone`) | Tabs `Reaction · Sleep · Mood`; `"↓ Slower than usual"` | Replace `Mood` with BP so tabs map to `GET /api/trends?code=...`: `reaction-speed` (`1/s`), `bp-systolic` (`mmHg`), `bp-diastolic` (`mmHg`), `sleep-hours` (`h`). Bind status badge directly to `zone.status` (`level`, `label`, `iconKey`), e.g. `"Below your normal"`, `"Within your normal"`, `"Learning your normal"`, `"Not scored"`. Plot `band.mean`, `band.watchAt`, `band.actAt`. |
| Screen 4 (`Action card`) | `"Supports decisions, not a diagnosis."`, single `whatToDo` string, no sources | Bind verbatim `card.disclaimer` (`"Decision support, not a diagnosis."`), render `card.whatToDo` as a bullet list (array), and show `card.sources` (`title` + `url`). |
| Screen 6 (`Emergency`) | `Chest pain`, `Collapsed, not responding`, `Trouble breathing`, `Something else` | Replace tiles with the 5 verified `for: "self"` procedures from `GET /api/emergency/procedures`: `bleeding` (**Bleeding cut**), `burn` (**Thermal burn**), `eye` (**Eye injury or chemical splash**), `allergic-reaction` (**Allergic reaction**), `near-fainting` (**Dizzy or about to faint**). Render `steps[]`, optional `timerSeconds` countdowns (`1200 s` burn cool, `900 s` eye flush), `caution`, `redFlags[]`, `escalation.text`, `sources[]`, and `disclaimer`. |

---

## 3. Add Missing Functional Inputs

| Screen | Missing input / behavior | Why required by API |
|---|---|---|
| Screen 2 (`Reaction check-in`) | **Hours slept last night** (`sleepHours`, `0–16`, optional) | Drives rule `RT-SHORT-SLEEP` (*"Slower than your normal after short sleep"* when `z <= -1.5` and `sleepHours <= 6`). |
| Screen 5 (`Guided measurement`) | **1–3 BP reading inputs** (`systolic`, `diastolic`, optional `pulse`), **12 symptom checkboxes** (`guide.severeSymptoms` + `guide.lowSymptoms`), **countdown timers** (`300 s` seated rest, `60 s` wait before reading 2, `300 s` severe retest), and **next-action view** (`none` / `retest` with `retestOf` / `alert_crew`) | Without reading inputs and symptoms, the screen cannot submit to `POST /api/measurements/bp` or handle the 5-minute severe BP retest flow. |

---

## How the Reaction Check-in Must Run in the Frontend

1. Fetch config once from `GET /api/checkin/protocol` (`durationMs: 180000`, `isiMinMs: 1000`, `isiMaxMs: 4000`, `feedbackMs: 1000`, `lapseMs: 355`, `falseStartMs: 100`, `noResponseTimeoutMs: 30000`).
2. Record `startedAt` as an ISO-8601 string with timezone offset (`YYYY-MM-DDTHH:mm:ssZ` or `+00:00`).
3. Until elapsed session time reaches `durationMs` (`180000 ms`):
   - Choose integer wait `isiMs` uniformly in `[isiMinMs, isiMaxMs]`.
   - Schedule stimulus onset using `requestAnimationFrame` (`onset = frameTimestamp`).
   - Tap/Space before onset -> push `{ i, isiMs, rtMs: null, early: true }` and restart wait.
   - Tap/Space after onset and before `noResponseTimeoutMs` -> compute `rtMs = Math.max(1, Math.round(event.timeStamp - onset))` and push `{ i, isiMs, rtMs, early: false }`. Show `rtMs` feedback during the first `feedbackMs` (`1000 ms`) of the next `isiMs` wait.
   - Timeout with no tap before `noResponseTimeoutMs` -> push `{ i, isiMs, rtMs: null, early: false }`.
4. Submit **only** `{ protocolId: "pvt-b-3min", startedAt, sleepHours, trials }` to `POST /api/checkins`. Never compute or send scores from the browser.
