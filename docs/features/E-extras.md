# Extras (`E01`–`E06`): design

Decisions and reasons are in [ADR 0003](../adr/0003-extras.md). This file says what each feature does, its API, its screen, its tests, and its build order.

**Rule for all six:** the environment and the person's role change guidance only. Scores, zones, BP categories and emergency steps never change.

## Build order and lanes

| Phase | Work | Who | Depends on |
|---|---|---|---|
| 0 | Research briefs R9 (radiation data), R10 (environment values), R11 (hazard mapping) | Antigravity read-only workers, in parallel; Claude checks the results into `research/CHECKS.md` | — |
| 1 | E01 crew sessions and per-person store | Claude (security-sensitive) | — |
| 2a | E02 real astronaut data (API and screen) | Antigravity lane, own worktree | E01 merged (shared `app.ts` mount and frontend shell) |
| 2b | E03 hazards on screen | Antigravity lane, own worktree | E01 merged, R11 checked |
| 2c | E05 medical officer view | Claude | E01 merged |
| 3 | E06 environment profiles | Antigravity lane; Claude reviews the wording | R10 checked |
| 4 | E04 radiation tracker | Antigravity lane; Claude checks the data handling | R9 checked, E06 merged (rate per environment) |

Each lane ends with the gate, its own `verify` steps from `features.json`, a frontend lint and build, and a browser check with both apps running. Claude merges one lane at a time and re-exports the contract after each.

## E01: crew sessions and per-person data

**API**
- `GET /api/crew` (public): `[{ id, name, role }]`.
- `POST /api/session { crewId, code }` → `201 { token, crew: { id, name, role }, expiresAt }`.
  - A wrong code gets `401 { error: "invalid_code" }`.
  - A locked crew id gets `429 { error: "locked", retryAfterSeconds }`.
- `GET /api/session` returns who is signed in. `DELETE /api/session` logs out (`204`).
- Personal endpoints need `Authorization: Bearer <token>` and return `401 { error: "no_session" }` without it: `today`, `checkins`, `trends`, `measurements/bp` (POST), `coach/ask`, `share*`, `reminders`, `consent`.
- Still public: `health`, `mission`, `crew`, `checkin/protocol`, `measurements/bp/guide`, `emergency/*`, `routines`, `hazards`, `nasa/*`, `environment` (GET), `radiation`.

**Store:** `createStoreRegistry()` returns `get(subjectId)`, creating each store on first use. Sessions are an in-memory `Map<token, { subjectId, role, expiresAt }>`. Restarting the server clears every session (acceptable for an offline demo).

**Codes:** `data/crew/access.json` holds `{ crewId, salt, hash, params }` per crew member, with no plain code. The demo codes are listed in `README.md` under "Demo crew codes" (synthetic people only).

**Screen:** a sign-in screen where you pick your name and enter your code.
- An **Emergency** button stays visible on that screen, with no sign-in needed.
- The token is kept in `sessionStorage`.
- Any 401 from the API sends the user back to sign-in.
- The header shows who is signed in and has a "Switch crew member" action.

**Tests:**
- right code, wrong code, lockout after 5 wrong codes and its expiry with a pinned clock;
- personal endpoints return 401 without a token;
- Mateo's token sees Mateo's data, never Sara's;
- emergency endpoints work with no token;
- existing contract and golden tests pass through a login helper with unchanged numbers.

## E02: real astronaut data (OSD-569)

**API (public)**
- `GET /api/nasa/osd-569`: `{ study, citation, url, crew: ["C001".."C004"], analytes: [{ key, label, unit }], timepoints: ["L-92".."R+194"] }`.
- `GET /api/nasa/osd-569/trend?crew=C001&analyte=hemoglobin`: points with value, the lab range, the pre-launch baseline (mean, SD, n), z and zone for each post-return sample.
- It uses `buildNasaBloodTrend` from `src/store/nasa.ts`, and zod validates both query values against the lists.

**Screen:** "Real astronaut data".
- A crew picker and a measure picker.
- A chart showing the pre-launch personal band, the post-flight points and the lab range.
- A source line: "NASA OSDR OSD-569, SpaceX Inspiration4".
- One sentence: "The same engine that watches Sara, run on real astronauts."
- It is reachable from the dashboard and from the sign-in screen.

**Tests:** an API test checking known values against the CSV, and zod rejecting an unknown crew id or measure.

## E03: hazards on screen

**Content**
- `content/hazards.json`: `{ id, name, summary, url, hrpRiskIds, watches }` for the 5 NASA hazards.
- `content/cards.json`: every card gets `hazardIds: string[]` (at least 1) and `hrpRiskIds: number[]`. The values come only from CHECKS R11.

**API:** `GET /api/hazards`. Cards in every response carry `hazards: [{ id, name }]`.

**Screen:**
- A hazard chip on each action card, with label and icon (not colour alone), linking to the hazard.
- A "5 hazards" section showing each hazard, what Nabz watches for it, and NASA's page.

**Tests:**
- the content test fails if any card has no hazard or uses an unknown hazard id;
- the schema test covers the new card fields.

## E04: radiation dose tracker

**Decided 2026-11-15 (Hamza, option A after R9):** published rates, no raw RAD files. The raw MSL/RAD cruise data is about 5.5 GB of absorbed-dose tables with no Sv column, too big to ship offline (CHECKS R9).

**Data:** `RADIATION_RATE_MSV_PER_DAY` in `src/core/constants.ts`, all from George et al. 2024 Table 2 (one source, one solar period): ISS 0.68, lunar surface 0.81, Mars transit 1.58, Mars surface 0.65 mSv/day. The Mars transit note also shows Curiosity's measured 1.84 mSv/day (2011-12). Remote Earth has no verified rate, so it shows "Not tracked here".

**Core:** `estimateDose(rateKey, missionDay)` is pure. It returns the dose to date (rate × mission day), the percent of the 600 mSv career limit, whole days until the limit at this rate, and a status. **Changed from the first design:** there is no `projectedMissionMsv`, because no sourced mission length exists; `daysUntilLimit` replaces it.

**API (public, mission level):** `GET /api/radiation` returns `{ environment, missionDay, basis: "published-average", dailyRateMsv, doseToDateMsv, careerLimitMsv: 600, percentOfCareerLimit, daysUntilLimit, note, sources, status }`. `status` is `info` ("Under the career limit") unless the dose reaches 600 mSv (`act`, "At or over the career limit").

**Screen:** a dose card with a gauge against the career limit, the word "Estimate", the note and the sources. It never presents the number as Sara's personal dosimeter reading.

**Tests:** hand-computed doses for Mars transit, ISS and Moon; the limit crossing at day 380; "not tracked" for Remote Earth.

## E05: medical officer view

**API**
- `GET/PUT /api/consent { shareWithMedicalOfficer: boolean }` (signed-in person, own setting only; default `false`).
- `GET /api/crew/overview` (role must be `Medical officer`, otherwise 403). Per crewmate it returns:
  - always: `{ id, name, role, shared }`;
  - when `shared`: `{ lastCheckinDay, reactionStatus, bpCategory, primaryCard: { title, severity }, nextDue }`.
- Each read appends `{ viewerId, atIso }` to every shown crewmate's runtime `accessLog`.
- `GET /api/consent` also returns that person's access log.

**Screen:**
- A consent switch in each person's settings, showing who looked and when.
- A "Crew health" screen that only Elena sees, with one card per crewmate and "Not shared" where consent is off.

**Tests:**
- non-officers get 403;
- crewmates with consent off show no data;
- no raw trial or reading appears anywhere in the response (schema allow-list);
- the access log gets an entry on each read.

## E06: environment profiles

**Content:** `content/environments.json`, using only values from `research/CHECKS.md` (R5 checked by R10):

| Field | Meaning |
|---|---|
| `id`, `name` | `iss`, `moon`, `mars-transit`, `mars-surface`, `remote-earth` (only if R10 confirms its sources) |
| `oneWayDelay` | text plus seconds (min/max) |
| `blackoutNote` | e.g. conjunction, far side, ~12 h/sol with no line of sight |
| `timeToCare` | evacuation window, or "no evacuation" |
| `careLead` | who decides first (flight surgeon on the ground, or the crew medical officer) |
| `gravity`, `dayLengthHours` | context only |
| `radiationRateKey` | which E04 rate applies |
| `escalation` | the short wording the action card and emergency screens show for "who to contact" |

**API:** `GET /api/environment` (public) and `PUT /api/environment { id }` (Commander only). `GET /api/mission` includes the active environment; `GET /api/today` carries it through each act or urgent card's `escalation` line, which is added when the API answers and never stored. The active environment lives in `data/runtime/mission-state.json` (default `mars-transit`).

**Core:** `pickEscalation(card, environment)` is pure and selects the wording. It never changes `severity`, `zone` or `ruleId`.

**Screen:**
- An environment switch in settings.
- A context strip in the header: delay, gravity, time to care.
- The escalation line on action cards and emergency screens follows the environment.

**Tests:**
- the same check-in gives the same zone and card id in every environment, and only the escalation text differs;
- every environment value is covered by a content test against an allow-list of sourced fields.

## Out of scope

Wearable sensors, forecasting, voice, cloud AI, real authentication (passwords, accounts, encryption at rest). The pitch says plainly that crew codes are a demo access control, not production security.
