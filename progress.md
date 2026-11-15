# Progress log

Append-only, newest at the bottom: date, feature, what changed, what's next.

## 2026-11-14 — architecture locked
- `/agentic-architect` ran: tier C, hackathon pack, Node. Blueprint, ADR 0001, feature designs, contract draft, features.json and worker briefs written.
- Gate commands set. The gate fails until F00 creates `package.json`; that is expected.
- Real NASA file added at `data/nasa/` (OSD-569 blood counts).
- Next: F00 (skeleton, gate, CI), then F01 (schemas, examples, contract).

## 2026-11-14 — F00 skeleton, gate, CI
- Express 5.3, zod 4.6, Vitest 5.1, TypeScript 6.0 (typescript-eslint doesn't support TypeScript 7 yet), ESLint 10.
- `src/api/app.ts` (health, JSON 404, JSON error handler, CORS for localhost only), `src/server.ts` on port 8787.
- ESLint blocks Node imports, `Date.now()`, `new Date()` and `Math.random()` inside `src/core`.
- Gate PASS. CI workflow written; first run happens on the next push.
- Next: F01 schemas, examples, contract.

## 2026-11-14 — F01 schemas, examples, contract
- `src/schemas/`: zod schemas for every shape, plus `endpoints.ts`, one table of all 16 endpoints (10 Must, 6 reserved).
- `contract/examples/`: 15 example files. `contract/schemas.json`: JSON Schema export (`npm run contract:export`).
- `tests/contract/examples.test.ts`: every example parses; no orphan files; the doc names every endpoint; the export is current; inputs with client-sent scores, bad trials or unknown symptoms are rejected.
- Request bodies are strict: unknown fields get a 400.
- `GET /api/today` returns `card: null` when nothing was done today (changed from the first draft).
- Gate PASS, 35 tests. `src/schemas/` is now frozen for lanes A and B.
- Next: lanes A (F02 data) and B (F07 content) on Antigravity; F03-F06 rules engine (Claude).

## 2026-11-14 — F02 seeded data simulator
- Added `"simulate": "tsx tools/simulate/index.ts"` in `package.json`.
- Built `tools/simulate/{rng,config,signals,index}.ts`: deterministic mulberry32 + Box-Muller PRNG (`deriveSeed` via FNV-1a), 120-day signals for Sara and 3 crew (`mateo`, `elena`, `kenji`) anchored to `research/CHECKS.md`, injected events (`short-sleep-week`, `illness`, `high-workload`, `short-sleep-before-120`), and `--check` byte-identical comparison.
- Wrote `data/fixtures/{mission,sara,mateo,elena,kenji}.json` (1813.0 KB total), `data/README.md` with the honesty table, and `tests/unit/simulate.test.ts` (4/4 pass).
- Gate PASS (`tsc`, `eslint`, `vitest run`).
- Next: F07 verified content (`content/`).

## 2026-11-14 — F07 verified content
- Wrote `content/sources.json` (9 verified sources from `research/CHECKS.md` and `R1..R4`), `content/emergency/{bleeding,burn,eye,allergic-reaction,near-fainting}.json`, `content/bp-guide.json`, and `content/cards.json` (all 17 rule card templates).
- Copied verified CHECKS wording verbatim (eye flush 15 minutes, tourniquet wording, burn 5 to 20 minutes / no ice, severe BP retest about 5 minutes).
- Added `tests/unit/content.test.ts` (4/4 pass). Gate PASS (`tsc`, `eslint`, `vitest run`).
- Next: F03 reaction check-in scoring and quality checks (`src/core/`).

## 2026-11-14 — F03 reaction check-in scoring and QC
- Added `src/core/constants.ts` (all verified thresholds citing `research/CHECKS.md` or `design choice` in `docs/blueprint/03-data-model.md`), `src/core/pvt.ts` (`getProtocol`, `isFalseStartTrial`, `scorePvt`), and `src/core/qc.ts` (`computeSessionDurationMs`, `checkSession`).
- Added `tests/unit/pvt.test.ts` (5/5 pass) verifying protocol defaults, the M1 hand-computed session (`meanSpeed = 3.2905`, `medianRtMs = 250`, `performanceScore = 55.56`), lapse (`354`/`355`) and false-start (`99`/`100`) boundaries, zero-division edge cases, and all 4 QC flag limits.
- Gate PASS (`npx tsc --noEmit`, `npx eslint .`, `npx vitest run`).
- Next: F04 normal zone, rolling personal baseline, and trend builder (`src/core/{zone,baseline}.ts`).

## 2026-11-14 — F04 personal baseline, zones, and trend builder
- Added `src/core/zone.ts` (`classifyZone`, `statusForZone`, `buildZoneResult`) and `src/core/baseline.ts` (`foldHistory`, `buildTrend`) supporting `lower_is_worse`, `two_sided`, and `none` series, 14-session rolling baseline (minimum 5 sessions, sample SD > 0), and exclusion of QC-flagged and `act` entries from subsequent baseline windows.
- Added `tests/unit/baseline.test.ts` (6/6 pass) verifying 4-vs-5 session calibration, the M2 hand-computed cases, exact z-score boundaries, exclusion of flagged/act entries, `sd === 0` stability, missing mission days, and `Trend` + `TrendBand` schema compliance.
- Gate PASS (`npx tsc --noEmit`, `npx eslint .`, `npx vitest run`).
- Next: F05 priority action-card engine (`src/core/cards.ts`).

## 2026-11-14 — F05 priority rule table and action cards
- Added `SEVERE_BP_SYMPTOM_IDS` and `LOW_BP_SYMPTOM_IDS` to `src/core/constants.ts`, plus `src/core/cards.ts` (`validateCardCatalog`, `selectReactionCard`, `selectBpCard`, `selectCard`, `pickMostSevereCard`) implementing all 7 reaction rules and all 10 blood-pressure rules in exact M3 priority order.
- Added `tests/unit/cards.test.ts` (4/4 pass) verifying catalog source validation against `content/cards.json` and `content/sources.json`, all 17 rule boundaries and precedence rules, `{placeholder}` resolution, and strict error throwing on missing templates or facts.
- Gate PASS (`npx tsc --noEmit`, `npx eslint .`, `npx vitest run`).
- Next: F06 guided blood pressure measurement, classification, and next action (`src/core/bp.ts`, `src/core/index.ts`).

## 2026-11-14 — F06 guided blood pressure measurement, classification, and actions
- Added `src/core/bp.ts` (`averageBpReadings`, `categorizeBp`, `countConsecutiveHighBpDays`, `isSustainedHighBp`, `evaluateBp`) and `src/core/index.ts` barrel export.
- Added `tests/unit/bp.test.ts` (6/6 pass) verifying half-up averaging, all 13 category boundaries, severe 5-minute retest and retest confirmation, symptomatic severe/low urgent alerts, 3-distinct-day sustained high detection, two-sided personal systolic baseline (`|z| >= 1.5`), and schema rejection of unknown symptom IDs.
- Finished features: F00, F01, F02, F07, F03, F04, F05, F06
- Half-done: none
- Next: F08 (API Must endpoints and JSON store)
- Gate output (`python scripts/gate.py`):
  `PASS npx tsc --noEmit`
  `PASS npx eslint .`
  `PASS npx vitest run`
  `GATE: PASS`

## 2026-11-14 — F08 Must API routes and JSON store
- Added `src/store/{clock,runtime,content,fixtures,index}.ts` implementing pinned/env clock, atomic temp+rename runtime storage with `*.corrupt` fallback, verified content loader, and core-scored fixture replay.
- Updated `src/api/app.ts` to serve all 10 Must endpoints (`/api/health`, `/api/mission`, `/api/today`, `/api/checkin/protocol`, `POST /api/checkins`, `/api/trends`, `/api/measurements/bp/guide`, `POST /api/measurements/bp`, `/api/emergency/procedures`, `/api/emergency/procedures/:id`), return `501 not_built` on all 6 reserved Should endpoints, and mount `/dev` in non-production mode.
- Added `tests/contract/api.test.ts` (5/5 pass). Gate PASS (`tsc`, `eslint`, `vitest run` 69/69).
- Next: F09 offline hero-flow golden test (`tests/golden/hero-flow.test.ts`).

## 2026-11-14 — F09 offline hero flow golden test
- Added `tests/golden/hero-flow.test.ts` (2/2 pass) verifying full offline replay of Sara's 120-day fixture (day 120 `act` + `RT-SHORT-SLEEP`, `short-sleep-week` `act` peak) and end-to-end HTTP flow (`GET /api/today` -> `POST /api/checkins` -> `GET /api/trends` -> `POST /api/measurements/bp` severe retest -> `GET /api/emergency/procedures`).
- Gate PASS in ~10s (< 60s limit).
- Next: F10 NASA Inspiration4 (`OSD-569`) blood-count trend (`src/store/nasa.ts`).

## 2026-11-14 — F10 NASA Inspiration4 OSD-569 blood counts
- Added `src/store/nasa.ts` (`parseOsd569Csv`, `loadNasaOsd569Samples`, `buildNasaBloodTrend`) parsing all 4 Inspiration4 subjects × 7 timepoints (`L-92` to `R+194`) and running them through `foldHistory` (`minSessions: 3`) + `buildTrend` (`source: "nasa-osd-569"` with lab `referenceRange`).
- Added `tests/golden/nasa-i4.test.ts` (2/2 pass) verifying 4 subjects × 7 timepoints and confirming `C002` `hematocrit` `34.7` at `R+82` drops below its `35..45` reference range.
- Gate PASS (`tsc`, `eslint`, `vitest run`).
- Next: F11 `/dev` browser test console (`tools/console/`).

## 2026-11-14 — F11 offline /dev browser test console
- Added `tools/console/{index.html,style.css,console.js}` (plain HTML/CSS/JS, zero CDN) serving PVT-B `requestAnimationFrame` + `event.timeStamp` tap test, Day-120 short-sleep sample button, non-color `[alert] Below your normal` status badge, action card + facts/sources/raw JSON, inline SVG 28-day baseline band chart, guided BP 5-step flow with timers and 12 symptom ticks, 5 offline emergency tabs, and clean reset instructions.
- Extended `tests/contract/api.test.ts` (6/6 pass) to assert `/dev/` serves HTTP 200 HTML outside production.
- Verified in live browser on `http://localhost:8787/dev/` (screenshot `final_step_30.png`): 0 console/network errors, Day-120 sample renders `[alert] Below your normal` + `RT-SHORT-SLEEP` card (`Decision support, not a diagnosis.`) + updated trend, plus guided BP and 5 emergency tabs.
- Gate PASS (`tsc`, `eslint`, `vitest run`).
- Next: F12 `README.md` quickstart and frontend handover documentation.

## 2026-11-14 — F12 README quickstart and frontend handover documentation
- Added root `README.md` starting with the one-command backend launch (`npm install && npm run dev`, plus `./init.ps1` / `./init.sh`, port `8787`, `/api/today`, `/dev/`), full frontend handover pointers (`docs/api-contract.md`, `contract/examples/*.json`, `contract/schemas.json`, `src/schemas/`, `docs/wireframe-review.md`, `tools/console/`), endpoint summary, reset instructions, and repository map.
- Verified `npm run start` brings up `http://localhost:8787` and `GET /api/today` returns HTTP `200` (`{"missionDay":120,"checkin":null,"bp":null,"card":null,"cards":[],"nextDue":null}`).
- Finished features: F00, F01, F02, F07, F03, F04, F05, F06, F08, F09, F10, F11, F12 (all P0 Must and P1 features complete)
- Half-done: none
- Remaining/Reserved P2 Should features: S01–S05 (slots in `src/slots/` and `501 not_built` stubs in place per `docs/blueprint/01-scope.md`, awaiting per-feature ADR/design pass)
- Gate output (`python scripts/gate.py`):
  `PASS npx tsc --noEmit`
  `PASS npx eslint .`
  `PASS npx vitest run`
  `GATE: PASS`

## 2026-11-14 — Orchestrator review fixes & Generator 2.0.0
- Completed Fable's orchestrator review fixes on `argon/work` after reviewing F08–F12:
  - `src/store/index.ts`: Server mission clock (`getCurrentMissionDay()`) now sets `missionDay` on `POST /api/checkins` and `POST /api/measurements/bp` rather than client timestamps; `createCheckin` looks up the newly scored entry by object reference in `foldHistory`.
  - `src/core/bp.ts`: `evaluateBp` looks up the newly scored BP entry by object reference in `foldHistory`.
  - `src/core/baseline.ts`: Fixed two issues — two-sided (`bp-systolic`) `watch` outliers stay out of future rolling windows so a severe reading (`186/121`) cannot poison the personal normal band, while one-sided (`reaction-speed`) `lower_is_worse` valid entries stay in the rolling window so excluding lower-tail `act` days no longer ratchets the baseline upward (~25% -> ~7% ordinary-day `act` rate across crew fixtures). Updated `docs/features/M2-normal-zone.md` and `docs/blueprint/03-data-model.md`.
  - `src/core/constants.ts` & `content/cards.json`: Tightened source citations (`PMC11614644`, `Jones 2022`, `30 s` no-response timeout marked design choice) and updated card template wording (`version: 2`, NHLBI shock/low-BP wording).
  - `tools/simulate/{config,signals}.ts`, `data/README.md`, `data/fixtures/*.json`: Completed `generatorVersion: "2.0.0"` forward-only check-in generator (no baseline/zone knowledge in the simulator, no non-event sleep censoring on days 109–118, realistic day-to-day BP spread `4.0/3.0` mmHg + `2.5/2.0` within-session, `restedLapsesPerSession: 1.0`).
  - Added `tests/contract/api-regression.test.ts` (6/6 pass) and updated `tests/unit/{baseline,simulate}.test.ts`.
- Verified `npm run simulate -- --check` (byte-identical) and live HTTP endpoints (`POST /api/checkins` off-day timestamp -> `missionDay: 120` `act` `RT-SHORT-SLEEP`; severe BP `186/121` -> `retest` `300s` with unchanged BP baseline on follow-up `116/74`).
- Finished features: F00, F01, F02, F07, F03, F04, F05, F06, F08, F09, F10, F11, F12
- Half-done: none
- Gate output (`python scripts/gate.py`):
  `PASS npx tsc --noEmit`
  `PASS npx eslint .`
  `PASS npx vitest run`
  `GATE: PASS`


## 2026-11-14 — S01–S05 Should features & deterministic offline-first AI coach
- Completed the design pass (`docs/adr/0002-should-features.md`, `docs/features/S-should-slots.md`, `docs/blueprint/03-data-model.md`) and implemented all 5 `Should (P2)` features with zero runtime network dependencies:
  - **S01 Crewmate Emergency (`?for=crewmate`):** Added `metronomeBpm` support in `src/schemas/procedure.ts`, 3 verified R8 sources in `content/sources.json`, and 4 crewmate procedures (`crewmate-collapse`, `crewmate-cpr` with `metronomeBpm: 110`, `crewmate-seizure`, `crewmate-low-blood-sugar`) copied verbatim from `research/CHECKS.md` R8; filtered via `GET /api/emergency/procedures?for=crewmate`.
  - **S02 Deterministic Offline-First AI Coach (`POST /api/coach/ask`):** Added pure rules engine in `src/core/coach.ts` + 11 verified snippets in `content/coach-knowledge.json`, `DeterministicCoachProvider` default + opt-in `OllamaCoachProvider` (`qwen3:4b`) with automatic offline fallback in `src/slots/coach/index.ts`. Handles card-grounded intents (`why`, `serious`, `worse`, `earth`, `routine`, `action`), fixed `COACH_NO_SOURCE_REPLY` abstention for uncovered topics, and `COACH_URGENT_BANNER_LABEL` on red-flag terms even if combined with uncovered terms.
  - **S03 Health Routines (`GET /api/routines`):** Added `src/schemas/routine.ts`, 3 routines in `content/routines/` (`hands-microbreak`, `tension-winddown`, `bp-quiet-rest`), card linkage in `content/cards.json`, and startup link validation in `src/store/content.ts`.
  - **S04 Send to Earth (`POST /api/share/preview`, `POST /api/share`):** Added pure preview builder in `src/core/share.ts`, `confirm: true` gate, and atomic runtime outbox persistence in `src/store/`.
  - **S05 Check-up Reminders (`GET/PUT /api/reminders` + `Today.nextDue`):** Added pure reminder state machine in `src/core/reminders.ts` and wired `nextDue` into `GET /api/today`.
- Exported updated `contract/schemas.json` (`npm run contract:export`), added 9 contract example files (`24` total in `contract/examples/`), updated `docs/api-contract.md` and `README.md`, and added live Should panels + crewmate CPR metronome in `tools/console/`.
- Added `tests/unit/should.test.ts` and updated `tests/contract/api.test.ts` (`13/13` test files, `93/93` tests passing).
- Finished features: F00, F01, F02, F07, F03, F04, F05, F06, F08, F09, F10, F11, F12, S01, S02, S03, S04, S05 (all Must, P1, and Should features complete)
- Half-done: none
- Gate output (`python scripts/gate.py`):
  `PASS npx tsc --noEmit`
  `PASS npx eslint .`
  `PASS npx vitest run`
  `GATE: PASS`

## 2026-11-15: Review of the Should work, BP baseline fix, CI fixes for the frontend PR
- Checked Gemini's S01–S05 work on `main` (`55129fd`): gate PASS, fixtures byte-identical, CI green. Crewmate wording matches CHECKS R8 (ER leg wording, compression depth caveat, isolated-surface AED rule).
- **BP baseline fix.** The baseline left out every two-sided `watch` reading. That trims the tails, shrinks the SD and flagged 40.7% of ordinary BP readings as `watch`. Now nothing leaves the window because of its own z or zone. Only quality flags and the new `excludeFromBaseline` (set for BP readings in the absolute `severe` or `low` category through `isOutsideBpBaselineRange`) keep an entry out. BP `watch` on the fixtures: 40.7% → 21.4%. With a 5–14 session window, a 1.5 SD two-sided threshold is expected to flag about 17–24% (t distribution), so the remaining rate is window size, not bias. Reaction stays at 7.1% `act` on ordinary days.
- Docs updated: `docs/features/M2-normal-zone.md`, `docs/blueprint/03-data-model.md` (also renamed `BP_Z_FLAG` to the real `BP_Z_WATCH`), ADR 0001 amendment note.
- **CI fixes for frontend PR #1.** The root eslint now ignores `frontend/`, which has its own config. A new `frontend` CI job runs install, lint and build only when `frontend/package-lock.json` exists. The gitleaks job gets `pull-requests: read`, which fixes the 403 on PR events. Verified locally on the PR head: frontend lint clean, `next build` OK (12 static routes), gitleaks finds no leaks.
- Frontend PR #1 findings (for Mariam): it uses mock data and calls no backend endpoint. It has its own baseline math (population SD, minimum 3), still has mood, and its reaction test is one random-delay trial, not the 3-minute PVT-B from `/api/checkin/protocol`.
- Not verified in CHECKS, flag before demo: the 15-minute recheck in `crewmate-low-blood-sugar`, and source ids `aha-bls-2025`, `dglrm-esam-2020-cpr`.
- Gate output (`python scripts/gate.py`):
  `PASS npx tsc --noEmit`
  `PASS npx eslint .`
  `PASS npx vitest run`
  `GATE: PASS`

## 2026-11-15: Frontend–backend integration on `feat/crewpulse-frontend-pr`
- Merged `origin/main` (`a53c8d6`) cleanly into `feat/crewpulse-frontend-pr`.
- Removed off-contract/mock views and utilities (`SignInScreen.js`, `app/profile/`, `MoodSelector.js`, `FeelingChips.js`, `DemoData*.js`, `lib/data/demo.js`, orphaned dashboard/wizard drafts) and removed `next/font/google` from `frontend/app/layout.js` for strict offline operation.
- Added `frontend/lib/api.js` covering all 14 contract endpoints against `NEXT_PUBLIC_API_URL || "http://localhost:8787"`, rewrote `frontend/lib/data/*` and `frontend/lib/utils/health.js` so all scoring, zones, action cards, and disclaimers come verbatim from backend responses, and cached static reference data in `localStorage`.
- Wired all active views and Should (`S01`–`S05`) workflows across `/`, `/check-in` (3-min PVT-B protocol + 64-trial QC-passing sample), `/normal-zone`, `/measure` & `/measure/blood-pressure` (guided 8-step cuff workflow), `/emergency` (`for=self` & `for=crewmate` + 110 bpm CPR metronome), `/coach`, `/send-to-earth` & `/sent`, `RoutineModal.js`, and `ReminderCard.js`.
- Fixed production CSS compilation by changing `frontend/package.json` `"build"` from `next build --webpack` to `next build` so `@tailwindcss/turbopack` compiles Tailwind v4 utilities (`frontend/.next/static/chunks/*.css`).
- Verified offline `npm run lint`, `npm run build` (12 static routes), `python scripts/gate.py` (`GATE: PASS`), and live browser visual styling + 64-trial check-in (`POST /api/checkins` 204, scored `Below your normal` at `3.71 resp/s` / `273 ms` median RT, action card `Slower than your personal normal`, 0 console/network errors); removed temporary `data/runtime/sara.json`.
- Completed frontend polish pass: bundled offline `@fontsource-variable` fonts with `localFont`, tuned fluid type scale and `--ease-smooth`/`--ease-spring` transitions, fixed mobile flex-wrap/1-char vertical wrapping (`MetricCard`, `MetricTile`, `TopBar`, `ReminderCard`, `Card`, `ClinicalActionCard`, `coach/page.js`) and `lg:` sidebar alignment, removed prose em/en dashes and robotic copy, and verified with `lint`, `next build`, `gate.py`, `gitleaks`, `semgrep`, and `npm audit`.


## 2026-11-15: Extras design pass (E00, proposed)
- Judge-style review: the entry qualifies for Global Awards (NASA data or resource used), but real NASA data barely shows on screen, NASA's 5 hazards are never named on screen, radiation isn't covered, and there is one user and one environment.
- Hamza chose six extras and four architecture options: server-checked crew sessions; Inspiration4 data on its own public screen; an environment switch (from R5) that changes guidance only; radiation from real Curiosity RAD data.
- Written: `docs/adr/0003-extras.md` (status proposed), `docs/features/E-extras.md` (build order and lanes), research briefs R9 (radiation data), R10 (re-check R5 environment values, Remote Earth), R11 (card → HRP risk → hazard mapping). `features.json` gains E00–E06 (`passes: false`). `01-scope.md` gains an Extras section; `AGENTS.md` gives `frontend/` an owner.
- Next: Hamza approves ADR 0003 → research lanes R9–R11 in parallel → E01 (Claude) → E02/E03/E05 in parallel → E06 → E04.

## 2026-11-15: E01, E02, E05 built (local only, design/extras)
- Backend (494f03c): crew sign-in with scrypt-hashed codes, per-person stores, OSD-569 catalog and trend endpoints, consent and Medical Officer overview. Every session endpoint is checked for 401 by a contract test driven from ENDPOINTS.
- Frontend (Antigravity worker, reviewed): `/sign-in`, a shared route guard, `/real-data` (public), `/privacy`, `/crew-health` (Medical officer only), and name and role in the header. Two chart captions corrected: the band comes from all earlier samples, not only pre-launch ones.
- Browser check with both apps running: wrong code, lockout countdown, Sara and Mateo see different data, Mateo gets the 403 page, Sara turns sharing on, Elena sees her summary, the access log records Elena's view, emergency and real-data work signed out, 375 px width with no sideways scroll.
- Gate PASS (16 files, 118 tests); frontend lint and build pass.
- Held for research: E03 (R11), E06 (R10), E04 (R9). Open: the OSD-569 hemoglobin unit says percent but the values are g/dL.
- Not pushed: the team sees a demo video first.

## 2026-11-15: E03, E04, E06 built (local only, design/extras)
- Research R9-R11 checked into CHECKS.md (91d12f0). Hamza chose option A for radiation: published rates, no raw RAD files.
- Backend (2c5b46c and this commit): `content/hazards.json` (NASA's 5 hazards, sentences quoted from the raw NASA page), `content/environments.json` (5 profiles), hazard and HRP risk tags on every card, `GET /api/hazards`, `GET/PUT /api/environment` (Commander only, returns resolved sources), `GET /api/radiation` (estimate, George 2024 rates, 600 mSv limit, "not tracked" for Remote Earth). Escalation line on act and urgent cards only; same check-in gives the same card in every environment (contract test).
- Frontend (Antigravity worker, reviewed): `/hazards` (public), `/environment`, dose card on Today and /hazards, hazard chips and "Who to contact" on action cards, header strip, emergency line. Fixed: removed a client-side copy of sources.json (the API now returns sources); corrected an overclaiming intro line.
- Browser check: hazards page signed out; Sara's severe BP card shows the Gravity fields chip and the Mars transit line; switching to ISS changed the header, card line (flight surgeon), emergency line and dose (81.6 mSv); Remote Earth shows "Not tracked here"; Mateo sees no switch; 375 px with no sideways scroll on 4 pages.
- Gate PASS (19 files, 135 tests). E06 passes. E03 and E04 held: one verify step each no longer fits (see features.json notes).
- Local runtime: the old `data/runtime/sara.json` (1 test BP entry, cards without hazard tags) was set aside as `sara.json.corrupt` by the loader.
- E03 and E04 verify steps reworded with Hamza's OK (E04 description too) to match the R11 design-choice note and the published-rates decision; both now pass.

## 2026-11-15: ADR 0003 accepted, demo guide
- Hamza accepted ADR 0003. Added an Amendments section for what changed in the build (E04 published rates, days until limit, `estimateDose` in `environment.ts`, Remote Earth not tracked, escalation added at response time). E00 passes; E00 to E06 all pass.
- `docs/demo/extras-demo.md`: run and reset steps, crew codes, a test checklist, a 3-minute shot list with narration, Windows recording tips, and a before/after note for the team.
- Next: Hamza tests, records the video and sends it to the team. Push or merge only after their OK.

## 2026-11-15: frontend restyle, anti-slop pass (local only)
- Header: one row. Mission day and environment as one link with labelled facts ("Earth delay 3 to 22 min · Microgravity"); the crew member moved into an account menu on phone and tablet. Phone header went from three rows of pills to one line.
- Today: a "Today's checks" list replaces four equal tiles. It shows done, not scored or due for the check-in and blood pressure (from today.checkin.qcFlags, today.bp and the reminders API) with one primary button on the next step. The three readings sit in one divided strip; a failed check-in says "Not scored" under its number.
- Theme: navy darks replaced by neutral near-black (#0c0d0f / #15171a); blue kept for data only; primary button is an ink pill; one typeface (Inter, as on nasa.gov); no resting shadows, glows, blur, tracked capitals, kickers over titles, icons in tinted squares or nested boxes. Light theme green and amber darkened to pass 4.5:1 as text.
- NASA brand guidelines checked: no NASA insignia, logotype, seal or look-alike, and no wording that implies endorsement. NASA appears only as a source credit.
- Checks: tasteskill lint 10 FAIL / 72 WARN before, 0 FAIL / 12 WARN after (remaining: overlay shadows, clock zero-padding, missing-value dashes); inspector on the production build 0 FAIL on sign-in, hazards, emergency; frontend lint and next build pass; gate PASS. Browser check at 375, 900 and 1280 px, dark and light.
- Sign-in page: added "CrewPulse is a NASA Space Apps Challenge 2026 project built with public NASA data. It is not affiliated with or endorsed by NASA." under the card (Hamza approved). 7.15:1 contrast; no sideways scroll at 375 px.

## 2026-11-15: rename CrewPulse to Nabz and add logo
- On 2026-11-15 the project was renamed from CrewPulse to Nabz across code, tests, localStorage keys, package names, and current docs, and the Nabz logo and favicon were added to the frontend.
- Captured three 1280x800 screenshots in `docs/assets/screenshots/` (`today.png`, `bp-action-card.png`, `real-data.png`) and rewrote root `README.md`.
- Work done by a Gemini 4 Hydrogen worker (agy), verified by Claude.

## 2026-11-15: E07 heart rate and oxygen level
- Team asked for two more measurements with blood pressure. Claude checked MedlinePlus, NHLBI and FDA pages and added R12 to `research/CHECKS.md`.
- `src/core/vitals.ts` checks the averaged cuff pulse (60-100 bpm normal) and an optional SpO2 (95% normal, 92% contact, 88% act now). The BP card is unchanged.
- API accepts `spo2` and returns `vitals`; the BP result screen shows a "Pulse and oxygen" panel. 21 new tests; gate passes; browser-checked on an isolated API.

## 2026-11-15: UX/UI designer review (Nabz post-dev review)
- Applied Ameni's review across the frontend: sign-in cleanup (label "Enter your code", placeholder "Enter 4 digits", no Real data / hazards links), solid red Close in emergency mode, sticky full-height sidebar, Today in two columns without "Today's focus", 12 px minimum font size.
- Check-in: 3-minute progress bar and "Taps so far" (the test already ends by itself at 3:00). Result: the four tiles are gone; the action card shows the title and what to do, with sources behind a "Sources" toggle and the disclaimer kept.
- Normal zone and metric labels in plain words (taps/s, no z-score, no "PVT-B mean reciprocal speed"). Measure in two columns. Coach is a full-height chat with chips and a send button.
- Send to Earth: nothing ticked by default; share list on the left and To / note / Send / Not now on the right. Sent screen: sent time, arrival window (sent time + the environment's one-way delay) and a four-step timeline.
- Environment: Sources block and "Signed in as" line removed. Emergency: 4-step stepper (who, what, do this now, help is on the way) with verified step wording unchanged.
- Kept on purpose: the NASA disclaimer footer on sign-in (waiting on Hamza), card sources (folded, not deleted), CHECKS.md step wording instead of the Figma draft text.
- Checks: gate PASS, frontend lint, browser walkthrough of every changed page at 1440x900 and 375 px (no sideways scroll).
- Follow-up: Send to Earth has a closed "See exactly what will be sent" toggle that shows the exact outgoing text, so consent is informed without bringing back the clutter. Light-theme text tokens darkened (attention #8a5700, accent #1b66c4, emergency #c62828), the Environment "Current" pill is solid, and the body-map selected button uses accent tokens. Contrast check: 0 failures across 510 text elements on 10 pages in light and dark. CI on PR #7 green (6 checks, including the production build).

## 2026-11-15: repo health check
- Gate PASS (21 files, 155 tests); API on 8787 answers /api/health and /dev; frontend on 3005: /welcome has no console errors, Sara's code opens Today with API data. CI on main green.
- Fixed: `scripts/gate.py` now decodes command output as UTF-8 (Windows cp1252 threw UnicodeDecodeError on vitest's check marks). `frontend/app/layout.js` sets `suppressHydrationWarning` on `<html>`, since the theme bootstrap script changes `data-theme` before hydration on purpose.
- Open, Windows only: about 1 vitest run in 6 to 11 dies with a native Node crash (exit 3221226505 = 0xC0000409), mostly in `tests/contract/api.test.ts`. Not an assertion; Linux CI never shows it. `pool: "threads"` did not help (the main process crashed instead), so it was reverted. Local Node is v24.15.0; a v24.15.0 Windows crash report exists (nodejs/node#62991). Rerun the gate if it shows that exit code.
