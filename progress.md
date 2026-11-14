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
