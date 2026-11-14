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
