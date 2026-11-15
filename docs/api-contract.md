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

Five self ids: `bleeding`, `burn`, `eye`, `allergic-reaction`, `near-fainting`. Four crewmate ids (`?for=crewmate`): `crewmate-collapse`, `crewmate-cpr`, `crewmate-seizure`, `crewmate-low-blood-sugar`. Fetch once at start-up and keep a copy; re-fetch when `version` changes. Emergency mode must open without a round trip.

### `GET /api/today`

```json
{ "missionDay": 120, "checkin": null, "bp": null, "card": null, "cards": [], "nextDue": "2026-11-15T08:00:00+00:00" }
```

`checkin` and `bp` are today's entries, or `null` if not done yet. `card` is the most severe of today's cards, or `null` when nothing has been done today. `nextDue` shows the earliest upcoming or overdue check-in/BP reminder timestamp (`null` if reminders are disabled).

### `GET /api/mission`

```json
{ "name": "…", "profile": "mars-transit", "launchDate": "2026-07-19", "missionDay": 120,
  "commsDelay": { "oneWayMinMinutes": 3, "oneWayMaxMinutes": 22 },
  "crew": [ { "id": "sara", "name": "Sara", "role": "Commander" } ] }
```

## Should endpoints (`built`)

All six Should endpoints plus crewmate emergency procedures (`GET /api/emergency/procedures?for=crewmate`) are now live on `argon/work`.

| Method and path | Purpose |
|---|---|
| `GET /api/emergency/procedures?for=crewmate` | 4 microgravity crewmate procedures (`crewmate-collapse`, `crewmate-cpr`, `crewmate-seizure`, `crewmate-low-blood-sugar`), with optional `metronomeBpm` (`110`) |
| `POST /api/coach/ask` | Deterministic offline-first explanation of today's card with red-flag urgent banner and fixed no-source abstention |
| `GET /api/routines` | 3 offline recovery routines (`hands-microbreak`, `tension-winddown`, `bp-quiet-rest`) linked from `card.links.routineId` |
| `POST /api/share/preview` | Preview exact entries, cards, plain-text flight-surgeon summary, and Mars 3–22 min delay before sending |
| `POST /api/share` | Requires `confirm: true`; queues the confirmed package into `data/runtime/<subjectId>.json` outbox (`201`) |
| `GET /api/reminders` | Active reminder schedule (`checkin` + `bp`), due items, overdue flags, and earliest `nextDue` |
| `PUT /api/reminders` | Save `{ enabled, checkinTimeUtc, bpIntervalDays, bpTimeUtc }` and return updated schedule |

### `POST /api/coach/ask`

Request: `{ "question": "Why is my reaction slower?", "cardId": "optional-card-or-rule-id" }` (`cardId` defaults to today's primary card). Response `200`:

```json
{ "cardId": "reaction-slow-short-sleep", "ruleId": "RT-SHORT-SLEEP", "answer": "…",
  "grounded": true, "citations": [ { "id": "jones-2022-iss-sleep", "title": "…", "url": "…" } ],
  "banner": { "level": "urgent", "label": "Alert a crewmate or medical officer now — do not wait for Earth.", "iconKey": "alert" },
  "suggestedQuestions": [ "Why is my reaction slower?", "Is this serious?", "What if it gets worse?", "Should I tell Earth?" ],
  "disclaimer": "Decision support, not a diagnosis.", "provider": "deterministic" }
```

`banner` is omitted unless red-flag symptoms (`chest pain`, `can't breathe`, `fainting`, etc.) appear or `card.severity === "urgent"`. Uncovered questions return `grounded: false`, `citations: []`, and `"I only answer from verified mission medical cards and don't have a verified source on that."`.

### `GET /api/routines`

Response `200`: `{ "version": 1, "routines": [ { "id": "hands-microbreak", "category": "hands", "title": "…", "summary": "…", "durationSeconds": 120, "steps": […], "disclaimer": "Decision support, not a diagnosis.", "sources": […] } ] }`.

### `POST /api/share/preview` and `POST /api/share`

Preview request (`POST /api/share/preview`): `{ "includeReaction": true, "includeSleep": true, "includeBp": true, "includeCards": true, "days": 3, "entryIds": ["optional"], "note": "optional" }`.
Send request (`POST /api/share`): same body plus `"confirm": true` (returns `201` `{ "id": "out-sara-120-1", "status": "queued", "queuedAt": "…", "confirmedByUser": true, "package": { … } }`).

### `GET /api/reminders` and `PUT /api/reminders`

Schedule body for `PUT /api/reminders`: `{ "enabled": true, "checkinTimeUtc": "08:00", "bpIntervalDays": 3, "bpTimeUtc": "08:30" }`.
Response `200`: `{ "version": 1, "schedule": { … }, "nextDue": "2026-11-15T08:00:00+00:00", "items": [ { "kind": "checkin", "label": "…", "dueAt": "…", "overdue": false, "reason": "…" } ] }`.

## Extra endpoints (E01, E02, E05; design in `docs/features/E-extras.md`)

### Signing in (E01)

Personal endpoints need `Authorization: Bearer <token>`:
- `GET /api/today`, `POST /api/checkins`, `GET /api/trends`, `POST /api/measurements/bp`;
- `POST /api/coach/ask`, `POST /api/share/preview`, `POST /api/share`;
- `GET/PUT /api/reminders`, `GET/PUT /api/consent`, `GET /api/session`.

Without a valid token they answer `401 { error: { code: "no_session" } }`. Everything else stays public, **including all emergency endpoints**: emergency never waits for sign-in.

| Call | Body / query | Answer |
|---|---|---|
| `GET /api/crew` | — | `{ crew: [{ id, name, role }] }`: who can sign in |
| `POST /api/session` | `{ crewId, code }` (code: 4–8 digits) | `201 { token, crew, expiresAt }` |
| | wrong code | `401 { error: { code: "invalid_code" } }` |
| | 5 wrong codes for one crew id | `429 { error: { code: "locked", retryAfterSeconds } }` for 60 s |
| `GET /api/session` | token | `{ crew, expiresAt }` |
| `DELETE /api/session` | token | `204`, and the token stops working |

- The session lasts 12 h, and restarting the server ends every session.
- Keep the token in `sessionStorage`.
- On any `401`, go back to the sign-in screen.
- Each person's data is separate: Mateo's token never sees Sara's data.

### Consent and the Medical Officer view (E05)

| Call | Who | Body | Answer |
|---|---|---|---|
| `GET /api/consent` | signed in | — | `{ shareWithMedicalOfficer, accessLog: [{ viewerId, viewerName, at }] }` |
| `PUT /api/consent` | signed in | `{ shareWithMedicalOfficer: boolean }` | same as `GET` |
| `GET /api/crew/overview` | Medical Officer only (others get `403 forbidden`) | — | `{ missionDay, crew: [{ id, name, role, shared, summary }] }` |

- `summary` is `null` unless that crewmate shared. When shared, it holds `{ missionDay, lastCheckinDay, reaction (Status), bpCategory, primaryCard: { id, title, severity }, nextDue }`. It never contains raw trials, readings, notes or coach questions.
- Every overview read adds `{ viewerId, viewerName, at }` to each shown crewmate's `accessLog`.
- Sharing is off by default.

### Real astronaut data (E02, public)

| Call | Query | Answer |
|---|---|---|
| `GET /api/nasa/osd-569` | — | `{ study: "OSD-569", title, url, citation, crew: ["C001".."C004"], analytes: [{ key, label, unit }], timepoints: [{ label, relativeDay }] }` |
| `GET /api/nasa/osd-569/trend` | `crew=C001&analyte=<key>` | a `Trend`, the same shape as `GET /api/trends` |

- `missionDay` is the day relative to launch: negative before launch, and after return counted from launch.
- `band` is the personal baseline from the pre-launch samples.
- `referenceRange` is the lab's normal range.
- An unknown crew id or analyte gets `400 invalid_input`.

## Changes

- **2026-11-14 (P2 Should pass):** Implemented `S01`–`S05` endpoints, added `metronomeBpm` to `ProcedureStep`, populated `Today.nextDue`, and updated `contract/schemas.json`.
- Ask before building against anything not on this page. Every change is listed here with a date.
