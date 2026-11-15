# crewpulse — agent rules

Backend, data and AI for the NOVA TRIO Space Apps 2026 entry. Tier C · hackathon · Node.
The frontend in `frontend/` started as Mariam's work; Hamza took it over on 2026-11-15 and it is now built by Claude and agents. `docs/api-contract.md` stays the contract between `frontend/` and the API.

## Commands
- Setup: `./init.ps1` (Windows) or `./init.sh`
- Run the server: `npm run dev` (http://localhost:8787, test page at `/dev`)
- Gate (must pass before a feature counts as done): `python scripts/gate.py`
- Regenerate fixtures: `npm run simulate` (same seed gives the same files)

## Session routine
1. Read the tail of `progress.md`, `features.json`, and `git log --oneline -15`.
2. Run setup and the gate once; fix existing breakage before new work.
3. Pick the highest-priority feature with `"passes": false` and work only on it.
4. Read that feature's design in `docs/features/`, write a short plan, implement.
5. Run the gate and the feature's `verify` steps.
6. Set `passes` to true, append to `progress.md`, commit. Never push; Hamza approves every push.

Never delete or reword features in `features.json`; raise it with Hamza instead.

## Where things are
- `docs/blueprint/00-architecture.md`: structure, diagram, fallbacks
- `docs/blueprint/01-scope.md`: Must / Should / Later and the cut-line
- `docs/blueprint/02-agents-and-gates.md`: who owns which folder, the gate, handoff format
- `docs/blueprint/03-data-model.md`: every JSON shape and every constant with its source
- `docs/features/`: one design per feature. `docs/api-contract.md`: what the frontend gets.
- `research/CHECKS.md`: verified numbers. It wins over the `research/R*` files.

## Folder boundaries (one writer per folder)
| Folder | Owner | Rule |
|---|---|---|
| `src/core/` | Claude | Pure TypeScript. No `node:*`, `fs`, `express`, `Date.now()` or `Math.random()`. Time and data come in as arguments. |
| `src/schemas/` | Claude | zod schemas. The contract's single source of truth. |
| `src/api/`, `src/store/`, `src/server.ts`, `tools/console/` | `core-builder` | HTTP and file I/O only. No thresholds or health logic here. |
| `frontend/` | Claude, or an agent lane per `docs/features/E-extras.md` | Renders what the API returns. No scoring, zones or thresholds in the client. Status never colour alone. |
| `src/slots/` | Claude | Interfaces and READMEs for Should features. No logic until that feature's design pass. |
| `content/` | Antigravity lane B | JSON only. Wording copied from `research/CHECKS.md`. |
| `tools/simulate/`, `data/fixtures/`, `data/README.md` | Antigravity lane A | Seeded generator and its output. |
| `data/nasa/` | Claude | Real NASA files, unmodified, with source and fetch date. |
| `tests/` | the feature's builder; `qa-gatekeeper` may add tests | Never weaken or skip a test to pass the gate. |

## Conventions
- **Rules decide, AI never decides.** Scores, zones, categories, red flags and card choice are code in `src/core/`. A model may only explain a card, later, through `src/slots/coach`.
- **Every number has a source.** Health constants live only in `src/core/constants.ts`, each with a comment naming its row in `research/CHECKS.md`. A value with no source is marked `// design choice` and listed in `03-data-model.md`. Never invent a threshold.
- **Verified wording is copied, not rewritten.** Emergency and blood pressure steps come from `research/CHECKS.md`, corrections included (eye flush 15 minutes; tourniquet wording; ER leg position).
- **Offline.** No network calls at runtime, no API keys, no CDN links. Must features run with the network off.
- **Untrusted input.** Every request body and query goes through a zod schema before anything else touches it. The server recomputes all scores; it ignores any score the client sends.
- **Deterministic.** The simulator uses one seeded generator. Tests pin the clock. Same input, same output.
- **Status is never colour alone.** Every status has `level`, `label` and `iconKey`.
- **Every card carries** `disclaimer: "Decision support, not a diagnosis."` and at least one source.
- **Units in names:** `rtMs`, `sleepHours`, `systolic` (mmHg), `meanSpeed` (responses per second).
- Synthetic data only. No real health records. `.env` is never committed (gitleaks hook in `.githooks/`).
- Check Express 5, zod 4 and Vitest APIs with context7 before writing integration code.
- Commits: plain message, no AI co-author line. Log every AI job in `AI-USAGE-LOG.md`.

## Mistake ledger
- R files contain numbers that `research/CHECKS.md` corrected. Always take the CHECKS value.
- The real NASA file (OSD-569) holds blood counts only. Don't claim it contains reaction or blood pressure data.
