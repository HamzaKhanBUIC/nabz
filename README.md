# crewpulse

Backend, data, and deterministic clinical rules engine for the **NOVA TRIO — NASA Space Apps 2026** entry (Tier C · Node/TypeScript). Runs 100% offline with zero network calls or API keys.

## Run the backend (one command)

```bash
npm install && npm run dev
```

Or run the platform setup + full gate first:

- Windows: `./init.ps1`
- macOS / Linux: `./init.sh`

Once running:

- API server: `http://localhost:8787` (verify with `GET http://localhost:8787/api/today`)
- Offline browser test console: `http://localhost:8787/dev/` (served whenever `NODE_ENV !== "production"`)

Optional environment variables:

- `PORT` — HTTP port (default `8787`, binds `127.0.0.1`)
- `MISSION_NOW` — ISO-8601 clock override (default `2026-11-15T08:00:00+00:00`, Day 120 for Sara)

---

## Frontend Handover (for Mariam & UI/UX)

Everything the frontend needs lives in these files:

| What you need | Where it is | Notes |
|---|---|---|
| **API contract** (single source of truth) | [`docs/api-contract.md`](docs/api-contract.md) | Request/response shapes, units, status semantics, and rules |
| **Example JSON payloads** (all 15 files) | [`contract/examples/`](contract/examples/) | Validated request/response mocks (e.g. `today.response.json`, `checkins.request.json`, `checkins.response.json`, `bp-guide.response.json`, `bp.response.json`, `trends.response.json`, `emergency-procedures.response.json`, `error-invalid-input.response.json`, `error-not-built.response.json`) |
| **JSON Schemas** (generated from Zod 4) | [`contract/schemas.json`](contract/schemas.json) | Generated via `npm run contract:export` from [`src/schemas/`](src/schemas/) |
| **Wireframe vs API contract notes** | [`docs/wireframe-review.md`](docs/wireframe-review.md) | Exact screens/fields to hide, update, or add from the wireframe review |
| **Working reference test UI** | [`tools/console/`](tools/console/) (`http://localhost:8787/dev/`) | Plain HTML/JS reference for PVT-B `requestAnimationFrame` + `event.timeStamp` timing, trends, guided BP, and offline emergency tabs |

### Integration essentials for the frontend

1. **Send raw inputs only; never send scores.** Request schemas use strict objects and reject unexpected fields (such as mood or client-calculated scores) with HTTP `400 invalid_input`.
2. **Never rely on color alone for status.** Every status object includes `{ level, label, iconKey }` (`normal | watch | act | not_scored`). Always render `label` and an icon alongside color.
3. **Preserve safety disclaimers and sources.** Action cards and emergency procedures include `disclaimer: "Decision support, not a diagnosis."` and `sources` (`{ id, title, url }`).
4. **Reserved `Should` endpoints return `501 not_built`.** Hide or disable Should features (`Coach`, `Send to Earth`, `Routines`, `Reminders`, and `for=crewmate` emergency filter) until those features are built.

---

## API Endpoints

### Must endpoints (live)

| Method & Path | Purpose | Example JSON |
|---|---|---|
| `GET /api/health` | Liveness check (`{ ok, version, offline: true }`) | `contract/examples/health.response.json` |
| `GET /api/mission` | Crew member profile, Mars transit day, Earth delay range (`3–22 min`) | `contract/examples/mission.response.json` |
| `GET /api/today` | Today's summary, latest status badge, latest action card, `nextDue` | `contract/examples/today.response.json` |
| `GET /api/checkin/protocol` | PVT-B timing config (`durationMs: 180000`, `isiMinMs: 1000`, `isiMaxMs: 4000`) | `contract/examples/checkin-protocol.response.json` |
| `POST /api/checkins` | Score raw PVT-B trials + optional `sleepHours`, save check-in, return zone & card | `contract/examples/checkins.request.json`, `checkins.response.json` |
| `GET /api/trends` | Time series + 28-day personal baseline band (`reaction-speed`, `bp-systolic`, `bp-diastolic`, `sleep-hours`) | `contract/examples/trends.response.json` |
| `GET /api/measurements/bp/guide` | Guided BP preparation/measurement steps, timers, and 12 symptom definitions | `contract/examples/bp-guide.response.json` |
| `POST /api/measurements/bp` | Average valid BP readings, classify AHA/ACC category, handle 5-min retest & urgent alerts | `contract/examples/bp.request.json`, `bp.response.json` |
| `GET /api/emergency/procedures` | All offline first-person (`for=self`) emergency procedures (optional `?for=`) | `contract/examples/emergency-procedures.response.json` |
| `GET /api/emergency/procedures/:id` | Single offline emergency procedure by ID (`bleeding`, `burn`, `eye`, `allergic-reaction`, `near-fainting`) | `contract/examples/emergency-procedure.response.json` |

### Reserved Should endpoints (currently HTTP `501 not_built`)

`POST /api/coach/ask`, `GET /api/routines`, `POST /api/share/preview`, `POST /api/share`, `GET /api/reminders`, `PUT /api/reminders` — example response in [`contract/examples/error-not-built.response.json`](contract/examples/error-not-built.response.json).

---

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Run backend with watch mode (`tsx watch src/server.ts`) on `http://localhost:8787` |
| `npm run start` | Run backend once (`tsx src/server.ts`) |
| `python scripts/gate.py` | Quality gate: `npx tsc --noEmit`, `npx eslint .`, and `npx vitest run` |
| `npm run simulate` | Regenerate deterministic 120-day crew fixtures (`seed = 20261004`, Sara + 3 crew) |
| `npm run simulate -- --check` | Verify generated fixtures match committed files byte-for-byte |
| `npm run contract:export` | Regenerate `contract/schemas.json` from Zod schemas in `src/schemas/` |

To reset check-ins and BP measurements posted during testing back to a clean Day-120 starting state (`card: null`), delete the runtime JSON files under `data/runtime/` (without editing `data/fixtures/`).

---

## Repository Layout

- `src/core/` — Pure TypeScript rules & math (PVT-B scoring, QC, 28-day personal baseline fold, action card rules, guided BP evaluation). No I/O, timers, or randomness.
- `src/schemas/` — Zod 4 schemas defining the contract.
- `src/store/` — Clock, atomic runtime JSON persistence, content loader, seeded fixture loader, and real NASA Inspiration4 `OSD-569` blood-count trend loader.
- `src/api/` & `src/server.ts` — Express 5 routes, Zod request validation, and `/dev` console mount.
- `src/slots/` — Reserved interfaces for `Should` features (`coach`, etc.).
- `content/` — Verified cards, BP guide, sources, and 5 offline emergency procedures sourced from `research/CHECKS.md`.
- `data/fixtures/` & `tools/simulate/` — Seeded 120-day synthetic mission data (`sara`, `alex`, `mei`, `tomas`) + honesty table (`data/README.md`).
- `data/nasa/` — Real NASA OSDR `OSD-569` Inspiration4 CBC dataset (`LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv`).
- `tools/console/` — Offline `/dev` HTML/CSS/JS test console.
- `tests/` — Unit, contract, and offline Day-120 golden tests (`tests/unit/`, `tests/contract/`, `tests/golden/`).
