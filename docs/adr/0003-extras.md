# ADR 0003: Extras design pass (`E01`–`E06`) (2026-11-15)

Status: **proposed**, waiting for Hamza's approval. Nothing below is built.

## Context

Must (`F00`–`F12`) and Should (`S01`–`S05`) pass the gate and are merged, with the frontend connected to the API (PR #1, PR #3). A judge-style review found these gaps:

- **NASA data barely shows on screen.** Space Apps requires "at least one NASA data or resource" for a Global Award, and we meet that: OSD-569, the HRP hazards and risks, NASA-STD-3001, PVT-B. But in the app a judge sees only synthetic Sara. The real Inspiration4 blood counts (F10) have no endpoint.
- **NASA's 5 hazards are never named on screen, and radiation isn't covered at all.**
- **One user only.** The app cannot show that the personal baseline works per person, and the crew's Medical Officer has no role.
- **One environment only.** The R5 research on ISS, Moon and Mars, which answers the challenge's "different settings", is unused.

Hamza chose six additions and four architecture options (2026-11-15). This ADR records them.

## Decisions

1. **One rule above all: environments and roles change guidance, never health thresholds.** Personal-baseline math, zone cut-offs, BP categories and emergency first-aid steps stay identical for every person and every environment. R5 recommends the same, because partial-gravity norms are still an open NASA research gap.

2. **E01: crew sessions, checked by the server.**
   - **Roster:** the 4 crew in `data/fixtures/mission.json` (Sara, Commander; Mateo, Pilot; Elena, Medical Officer; Kenji, Engineer).
   - **Login and session:** `POST /api/session { crewId, code }` checks a scrypt hash with `timingSafeEqual` (`node:crypto`, in `src/store/` only). It returns a random 32-byte session token, kept in server memory with a 12 h lifetime. `DELETE /api/session` logs out.
   - **Codes:** demo codes for synthetic people, documented for judges. The hashes live in `data/crew/access.json`, and no plain code is stored there.
   - **Lockout:** 5 wrong codes for one crew id lock that id for 60 s (design choice).
   - **How calls are tied to a person:** personal endpoints read `Authorization: Bearer <token>` and run on that person's store. The client can never choose a `subjectId`.
   - **Emergency stays public.** Emergency procedures, the BP guide, the protocol, mission info, hazards, NASA data and the environment read are never behind login.
   - **Store:** a registry creates one `createStore({ subjectId })` per crew member on first use. Runtime files stay `data/runtime/<subjectId>.json`. `createStore` already takes `subjectId`, so `src/core/` is unchanged.
   - **Why not a crew id in the URL:** anyone could read anyone's data by editing the URL, so consent and the officer view would be for show.

3. **E02: a real astronaut data screen.**
   - **Endpoints:** `GET /api/nasa/osd-569` lists crew `C001`–`C004`, the measures with units, the time points, and the citation. `GET /api/nasa/osd-569/trend?crew=&analyte=` runs the existing `buildNasaBloodTrend`: pre-launch samples form the personal baseline (minimum 3), and post-return samples are scored against it and against the lab's reference range.
   - **Access:** public, because it is open NASA data.
   - **Not login profiles:** the Inspiration4 crew have 7 blood samples each and no daily data.

4. **E03: hazards on screen.**
   - **Hazard list:** `content/hazards.json` holds NASA's 5 hazards (id, name, a one-line summary in NASA's terms, URL, linked HRP risk ids, what CrewPulse watches).
   - **Card tags:** every card gains `hazardIds` and `hrpRiskIds`.
   - **Endpoint:** `GET /api/hazards`.
   - **Source of the mapping:** CHECKS R1 #3 confirms the risk ids. The mapping from card to risk to hazard is checked in brief R11 before it is written.

5. **E04: radiation dose tracker.**
   - **Data:** real MSL RAD (Curiosity) measurements from NASA's archive, kept unmodified in `data/nasa/rad/` with a README giving source and fetch date. Brief R9 finds the files.
   - **Calculation:** a pure function `estimateDose(dailyRates, environment, missionDay)` in `src/core/radiation.ts`.
   - **Endpoint:** `GET /api/radiation` returns the dose to date, the daily rate, the career limit (600 mSv, CHECKS R1 #5) and the percentage of that limit, all labelled "estimate".
   - **Status:** information only, unless a sourced limit is crossed or projected to be crossed. No invented alarm level.
   - **Fallback:** if R9 cannot get a clean file, the cruise average (Zeitlin 2013, 1.84 mSv/day, CHECKS R1 #12) is used and labelled as a published average.

6. **E05: medical officer view.**
   - **Consent:** each crew member sets `PUT /api/consent { shareWithMedicalOfficer }`. It is off by default.
   - **Overview:** `GET /api/crew/overview` is officer-only, with the role checked on the server; anyone else gets 403. It returns, only for crewmates who consented, their name, role, last check-in day, reaction zone status, latest BP category, the primary card's title and severity, and `nextDue`. It never returns raw trials, readings or coach chats.
   - **Access log:** every overview read is written to each shown crewmate's runtime log, so each person can see "Elena viewed your summary at …".

7. **E06: environment profiles (replaces "Earth mode").**
   - **Profiles:** `content/environments.json` holds `iss`, `moon`, `mars-transit` (default, the hero story), `mars-surface`, and `remote-earth` (only if R10 finds sourced values).
   - **Fields per profile:** one-way delay and blackout note, evacuation or time to definitive care, who leads care, gravity, day length, the radiation rate key used by E04, and the escalation wording for cards and emergency screens.
   - **Endpoints:** `GET /api/environment` (public); `PUT /api/environment` (Commander only, design choice).
   - **Sources:** every value comes from `research/CHECKS.md` after brief R10. Values from R5 that are not yet checked stay out until they are.

8. **Conflict-free parallel work.**
   - **One router file per feature:** each new feature adds its own `src/api/routes/<feature>.ts`, mounted once in `app.ts`, plus its own schema file. That way parallel lanes don't edit the same lines.
   - **One contract export:** `contract/schemas.json` and `docs/api-contract.md` are re-exported once per merge, never by two lanes at the same time.

9. **Frontend ownership.** Hamza took the frontend over on 2026-11-15 (Mariam's PR #1 was merged and then connected to the API). `frontend/` becomes a Claude/agent-owned folder, with the same rules: no client-side scoring, and status is never colour alone.

## Consequences

- The personal endpoints now return 401 without a session. Contract and golden tests get a login helper, and Sara's behaviour and numbers stay the same.
- `src/core/` stays pure. New pure code: `radiation.ts` and a small `environment.ts` for choosing wording.
- New data under `data/nasa/` follows the existing rule: unmodified files, with source and fetch date.
- Two new NASA data sources in the submission's "NASA Data" field: OSD-569 shown on screen, and MSL RAD.
