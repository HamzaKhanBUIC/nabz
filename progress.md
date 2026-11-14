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
