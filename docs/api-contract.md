# API contract (v0.1)

For the frontend. This page, the zod schemas in `src/schemas/` and the JSON files in `contract/examples/` say the same thing; tests keep them in step. If they ever disagree, the schemas win and this page gets fixed.

- **Machine-readable shapes:** `contract/schemas.json` (JSON Schema for every endpoint).
- **Status (Nov 14):** shapes are final for the Must endpoints. The server answers `/api/health` today; the other endpoints go live as they are built. Until then, use the example files as mock data.

- **Base URL:** `http://localhost:8787`. JSON in, JSON out. CORS is open for `localhost` origins.
- **No login.** One user (Sara, `subjectId: "sara"`).
- **Offline:** nothing here needs the internet.
- **Example files:** every request and response below exists as a file in `contract/examples/`. Build against those before the server is ready.
- **Full shapes:** `docs/blueprint/03-data-model.md`.

## Rules for every response

- A status is never colour alone: `status` is `{ level, label, iconKey }`. Use `label` as text and `iconKey` to pick an icon.
- Every card has `disclaimer: "Decision support, not a diagnosis."` Show it.
- Errors: `{ "error": { "code": "invalid_input" | "not_found" | "not_built", "message": "...", "issues": [] } }` with status 400, 404 or 501.

## Must endpoints

| Method and path | Purpose |
|---|---|
| `GET /api/health` | `{ "ok": true }` |
| `GET /api/mission` | Mission day, delay to Earth, crew list |
| `GET /api/today` | Home screen: today's check-in, latest blood pressure, the card to show |
| `GET /api/checkin/protocol` | Settings for the tap test |
| `POST /api/checkins` | Send the raw taps; get score, zone and card |
| `GET /api/trends?code=reaction-speed&days=30` | Chart points and Sara's personal band |
| `GET /api/measurements/bp/guide` | Steps, timers and symptom lists for the blood pressure check |
| `POST /api/measurements/bp` | Send readings; get category, zone, next action and card |
| `GET /api/emergency/procedures` | All emergency procedures in one bundle (cache it) |
| `GET /api/emergency/procedures/:id` | One procedure |

### `GET /api/checkin/protocol`

```json
{ "protocolId": "pvt-b-3min", "durationMs": 180000, "isiMinMs": 1000, "isiMaxMs": 4000,
  "feedbackMs": 1000, "lapseMs": 355, "falseStartMs": 100, "noResponseTimeoutMs": 30000 }
```

How to run the test:
1. For 3 minutes: wait a random time between `isiMinMs` and `isiMaxMs`, then show the target. Show the last reaction time during the first `feedbackMs` of that wait.
2. On a tap, record `rtMs` = whole milliseconds from the moment the target appeared.
3. A tap while no target is showing: record `{ "early": true, "rtMs": null }` and restart the wait.
4. No tap before `noResponseTimeoutMs`: record `{ "early": false, "rtMs": null }`.
5. Send every trial, in order. Don't compute scores; the server does.

### `POST /api/checkins`

Request:

```json
{ "protocolId": "pvt-b-3min", "startedAt": "2026-11-15T08:02:11+00:00", "sleepHours": 5.2,
  "trials": [ { "i": 0, "isiMs": 2140, "rtMs": 268, "early": false },
              { "i": 1, "isiMs": 1630, "rtMs": null, "early": true },
              { "i": 2, "isiMs": 3310, "rtMs": 412, "early": false } ] }
```

`sleepHours` is optional (0–16). Any field not listed here is rejected with a 400, including scores computed in the browser. The example is shortened to 3 trials; a real session has about 60. Response `201`:

```json
{ "id": "chk-sara-120", "subjectId": "sara", "missionDay": 120,
  "effectiveDateTime": "2026-11-15T08:02:11+00:00", "protocolId": "pvt-b-3min",
  "metrics": { "stimuli": 58, "validResponses": 57, "lapses": 9, "falseStarts": 2,
               "meanSpeed": 3.71, "medianRtMs": 262, "performanceScore": 81.7 },
  "sleepHours": 5.2, "qcFlags": [], "source": "live",
  "zone": { "code": "reaction-speed", "value": 3.71, "unit": "1/s", "z": -1.9, "zone": "act",
            "baseline": { "n": 14, "mean": 4.18, "sd": 0.25, "ready": true, "windowSessions": 14 },
            "status": { "level": "act", "label": "Below your normal", "iconKey": "alert" } },
  "card": { "id": "reaction-slow-short-sleep", "ruleId": "RT-SHORT-SLEEP", "severity": "act",
            "status": { "level": "act", "label": "Below your normal", "iconKey": "alert" },
            "title": "Slower than your normal after short sleep",
            "whatChanged": "…", "whyItMatters": "…", "whatToDo": ["…", "…"],
            "facts": { "zAbs": 1.9, "sleepHours": 5.2, "lapses": 9 },
            "sources": [ { "id": "jones-2022-iss-sleep", "title": "…", "url": "…" } ],
            "disclaimer": "Decision support, not a diagnosis." } }
```

Zones: `not_scored`, `building`, `in_zone`, `watch`, `act`. While `building`, `z` and the baseline mean are `null`; show "Learning your normal".
The numbers above are an illustration. Card wording ("…") comes from `content/cards.json`.

### `GET /api/trends`

Query: `code` = `reaction-speed` | `bp-systolic` | `bp-diastolic` | `sleep-hours`; `days` = 7–120 (default 30).

```json
{ "code": "reaction-speed", "unit": "1/s", "subjectId": "sara", "source": "simulated",
  "points": [ { "missionDay": 119, "effectiveDateTime": "2026-11-14T08:00:00+00:00", "value": 3.92,
                "z": -1.1, "zone": "watch", "baselineMean": 4.19, "baselineSd": 0.24 } ],
  "band": { "ready": true, "mean": 4.18, "sd": 0.25, "watchAt": 3.93, "actAt": 3.81 } }
```

Draw `band.mean` as the centre line and shade down to `watchAt` and `actAt`. A missed day has no point.

### `GET /api/measurements/bp/guide`

```json
{ "version": 1,
  "steps": [ { "id": "rest", "text": "Rest quietly for 5 minutes.", "timerSeconds": 300 } ],
  "severeSymptoms": [ { "id": "chest-pain", "label": "Chest pain" } ],
  "lowSymptoms": [ { "id": "fainting", "label": "Fainting" } ],
  "disclaimer": "Decision support, not a diagnosis.", "sources": [] }
```

### `POST /api/measurements/bp`

Request (1–3 readings; `symptoms` are ids from the guide; `retestOf` only on a retest):

```json
{ "takenAt": "2026-11-15T08:20:00+00:00",
  "readings": [ { "systolic": 184, "diastolic": 118 }, { "systolic": 186, "diastolic": 122 } ],
  "symptoms": [] }
```

Response `201`:

```json
{ "id": "bp-sara-120-1", "subjectId": "sara", "missionDay": 120,
  "effectiveDateTime": "2026-11-15T08:20:00+00:00",
  "readings": [ { "systolic": 184, "diastolic": 118 }, { "systolic": 186, "diastolic": 122 } ],
  "average": { "systolic": 185, "diastolic": 120 }, "category": "severe", "symptoms": [],
  "zone": { "code": "bp-systolic", "value": 185, "unit": "mmHg", "z": 17.32, "zone": "watch",
            "baseline": { "n": 14, "mean": 114, "sd": 4.1, "ready": true, "windowSessions": 14 },
            "status": { "level": "watch", "label": "Different from your normal", "iconKey": "eye" } },
  "nextAction": { "type": "retest", "afterSeconds": 300 },
  "card": { "id": "bp-severe-retest", "ruleId": "BP-SEVERE-RETEST", "severity": "act", "…": "…" },
  "source": "live" }
```

`nextAction.type`: `none` · `retest` (start a countdown of `afterSeconds`, then post again with `retestOf` set to this `id`) · `alert_crew` (show the alert screen now).
Categories: `low`, `normal`, `elevated`, `stage1`, `stage2`, `severe`.

### `GET /api/emergency/procedures`

```json
{ "version": 1,
  "procedures": [ { "id": "burn", "version": 1, "for": "self", "title": "Burn",
      "whenToUse": "…",
      "steps": [ { "id": "cool", "text": "…", "timerSeconds": 1200 } ],
      "redFlags": ["…"],
      "escalation": { "text": "…", "action": "alert_crew" },
      "disclaimer": "Decision support, not a diagnosis.",
      "sources": [ { "id": "aha-first-aid-2024", "title": "…", "url": "…" } ] } ] }
```

Five ids: `bleeding`, `burn`, `eye`, `allergic-reaction`, `near-fainting`. Fetch once at start-up and keep a copy; re-fetch when `version` changes. Emergency mode must open without a round trip.

### `GET /api/today`

```json
{ "missionDay": 120, "checkin": null, "bp": null, "card": null, "cards": [], "nextDue": null }
```

`checkin` and `bp` are today's entries, or `null` if not done yet. `card` is the most severe of today's cards, or `null` when nothing has been done today. `nextDue` stays `null` until the reminder feature is built.

### `GET /api/mission`

```json
{ "name": "…", "profile": "mars-transit", "launchDate": "2026-07-19", "missionDay": 120,
  "commsDelay": { "oneWayMinMinutes": 3, "oneWayMaxMinutes": 22 },
  "crew": [ { "id": "sara", "name": "Sara", "role": "Commander" } ] }
```

## Reserved endpoints (not built; they answer 501)

Leave room for these in the screens. Shapes will be added here when each is designed.

| Method and path | Feature |
|---|---|
| `GET /api/emergency/procedures?for=crewmate` | Emergency for a crewmate (returns an empty list, not 501) |
| `POST /api/coach/ask` | AI coach: a follow-up question about a card |
| `GET /api/routines` | Health routines |
| `POST /api/share/preview`, `POST /api/share` | Send to Earth |
| `GET /api/reminders`, `PUT /api/reminders` | Check-up reminder |

## Changes

Ask before building against anything not on this page. Every change is listed here with a date.
