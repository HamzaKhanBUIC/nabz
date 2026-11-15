# Wireframe vs API Contract Review

Review of the 9 desktop + responsive wireframe screenshots against [docs/api-contract.md](./api-contract.md), [src/schemas/](./../src/schemas/endpoints.ts), and [docs/adr/0002-should-features.md](./adr/0002-should-features.md) (**Must + Should features are live**; Extra/Later features remain out of scope for now).

---

## 1. Remove / Hide (Not Supported in Backend)

| UI element | Screen(s) | Why |
|---|---|---|
| Mood rating (`1–5` scale, `Mood 3 / 5`, Mood toggle/series) | Screens 1, 2, 3, 8 | Mood is not in the backend schema. `POST /api/checkins`, `GET /api/trends`, and `POST /api/share/preview` reject unknown fields with HTTP `400 invalid_input`. |
| Extra / Later features (Voice dictation/commands, wearable auto-sync, crew switcher, Inspiration4 lab blood-count chart, Earth/Moon mission switcher) | Any screen | Deferred to **Later** (`docs/blueprint/01-scope.md`). Do not add UI for these until Must + Should integration is complete. |

---

## 2. Edit Wireframes to Match Live Must + Should Backend Contract

| Screen | Wireframe currently shows | Required change to match `docs/api-contract.md` |
|---|---|---|
| Top bar (all screens) | `Earth delay ~18 min` (static text) | Render `Earth delay {oneWayMinMinutes}–{oneWayMaxMinutes} min` (`3–22 min`) from `GET /api/mission` (`commsDelay`). |
| Screen 1 (`Today`) & Screen 2 (`Reaction check-in`) | `Start check-in (2 min)` and `12 of 30 seconds` | Read `durationMs` from `GET /api/checkin/protocol` (`180000 ms` = **3 minutes**). Sessions under `150000 ms` or `< 20` stimuli are flagged by QC (`zone: "not_scored"`, card `checkin-retake`). Bind the reminder banner at bottom to `GET /api/today` `nextDue` (and allow customization via `GET/PUT /api/reminders`). |
| Screen 3 (`Normal zone`) | Tabs `Reaction · Sleep · Mood`; `"↓ Slower than usual"` | Replace `Mood` with BP so tabs map to `GET /api/trends?code=...`: `reaction-speed` (`1/s`), `bp-systolic` (`mmHg`), `bp-diastolic` (`mmHg`), `sleep-hours` (`h`). Bind status badge directly to `zone.status` (`level`, `label`, `iconKey`), e.g. `"Below your normal"`, `"Within your normal"`, `"Learning your normal"`, `"Not scored"`. Plot `band.mean`, `band.watchAt`, `band.actAt`. |
| Screen 4 (`Action card`) | `"Supports decisions, not a diagnosis."`, single `whatToDo` string, no sources, no routine action | Bind verbatim `card.disclaimer` (`"Decision support, not a diagnosis."`), render `card.whatToDo` as a bullet list (array), show `card.sources` (`title` + `url`), and show a `"Start routine"` button whenever `card.links.routineId` is set (fetching steps from `GET /api/routines`). |
| Screen 6 (`Emergency` — **Self & Crewmate live**) | `Chest pain`, `Collapsed, not responding`, `Trouble breathing`, `Something else` | Keep the left `Who is this for? Me / A crewmate` selector (`GET /api/emergency/procedures` for `self` and `?for=crewmate` for `crewmate`). Show the **5 `for: "self"` tiles**: `bleeding` (**Bleeding cut**), `burn` (**Burn**, `1200 s` timer), `eye` (**Eye injury or chemical splash**, `900 s` timer), `allergic-reaction` (**Allergic reaction**), `near-fainting` (**Dizzy or about to faint**); and the **4 `for: "crewmate"` tiles**: `crewmate-collapse` (**Collapsed or unresponsive crewmate**, `10 s` timer), `crewmate-cpr` (**Crewmate CPR in microgravity**, `120 s` timer + `110 bpm` compression metronome), `crewmate-seizure` (**Crewmate having a seizure**, `300 s` + `10 s` timers), `crewmate-low-blood-sugar` (**Suspected low blood sugar**, `900 s` timer). Always render `steps[]`, `caution`, `redFlags[]`, `escalation.text`, `sources[]`, and `disclaimer`. |
| Screen 7 (`Coach` — **live**) | Chat UI + suggested pills without citations/urgent banner | Keep chat, today's card context, and `suggestedQuestions` (`POST /api/coach/ask`). Render `citations` links beneath grounded replies, show a prominent urgent alert banner whenever `banner` is present (`banner.label`), and keep the disclaimer + medical officer notice. |
| Screen 8 (`Send to Earth` — **live**) | Toggle `Mood` alongside Reaction, Sleep, BP | Replace `Mood` toggle with `Action cards` (`includeReaction`, `includeSleep`, `includeBp`, `includeCards`, plus optional `days` and `note`). Always preview via `POST /api/share/preview` first and queue only after clicking `"Send summary"` (`POST /api/share` with `confirm: true`). Show `commsDelay.delayNotice`. |

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
