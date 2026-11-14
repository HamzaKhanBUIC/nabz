# Architect brief: NOVA TRIO backend (Space Apps 2026)

Input for `/agentic-architect`. Treat this as the locked idea brief. Don't re-brainstorm the product.

## Read first, in this order

1. `HANDOFF.md`: problem statement, MVP split, decisions, team split.
2. `research/CHECKS.md`: verified numbers and corrections. **Where it disagrees with an R file, CHECKS.md wins.**
3. `research/R1`–`R8`: details behind each check. R2, R3, R4 and R6 matter most for Must.
4. `docs/setup-plan.md` and `AI-USAGE-LOG.md`: tools, agents, no-clash rules, tracking.

## What we're building

Sara, a mission commander on day 120 of a trip to Mars, does a fast, private daily check-in. The app compares her to **her own normal** and guides her through measurements and emergencies **offline**. Earth is 3–22 min away one way, up to ~40 min for a reply.

- **Our part:** backend, data and AI only (Hamza + Claude + Antigravity workers).
- **Not ours:**
  - frontend (Mariam, Node.js web app, used on a **desktop/laptop screen**)
  - UI/UX (Ameni)
- **Our one shared point with them:** the API contract.

## Scope: three tiers, different depth

| Tier | Features | Design depth |
|---|---|---|
| **Must (build now)** | 1. "Tap when green" reaction check-in (PVT-B)<br>2. Personal normal zone chart<br>3. Action card: what changed / why it matters / what to do<br>4. Guided blood pressure measurement<br>5. Emergency mode, first person (Sara herself), offline | **Full.** Data model, formulas, rules, content shape, endpoints, tests. Every Must item is a `features.json` entry with verify steps. |
| **Should (slots only)** | 1. Emergency "Who is this for?" with **For me / For a crewmate** (R8)<br>2. AI coach for follow-up questions (R7)<br>3. Health routines (hands, tension, BP)<br>4. "Send to Earth?" (Sara picks what to share)<br>5. Check-up reminder | **Slots, no logic.** For each: the field, endpoint name, module folder and interface it plugs into, so it can be added later **without reworking Must**. Mark the endpoints "not built" in the contract. Examples:<br>- emergency cards carry `"for": "self"` now<br>- `/api/coach` and `/api/share` are reserved<br>- the coach only reads rule outputs |
| **Later (pitch only)** | Wearable sensors, crew view for the medical officer, health forecast, offline voice (Vosk / whisper.cpp), Speechmatics dictation when connected, hosted open-source model | One short list in `01-scope.md`. No code, no slots. |

Each Should feature gets its own short design pass (an ADR plus `features.json` entries) **extending this blueprint**, right before it's built. Don't design a separate architecture per feature.

## Hard rules

1. **Rules decide, AI never decides.**
   - Thresholds, z-scores, BP categories, red flags and which card shows are all deterministic TypeScript, unit-tested.
   - The AI coach (Should) only explains a rule's output, answers only from our verified cards, and has a fixed "no verified source" reply.
2. **Offline first.** Every Must feature works with the network off: no API keys, no cloud calls. The demo has a replay mode from fixtures.
3. **Every number traces to a source.**
   - Constants live in one file, each with its CHECKS.md reference (e.g. `LAPSE_MS = 355 // CHECKS R2, Basner 2011`).
   - No invented values.
   - Emergency and BP screen text is copied word for word from CHECKS.md, including the corrected wording.
4. **NASA data is named and used.**
   - Base Sara's simulated signals on real open NASA data: OSD-569 Inspiration4 CBC CSV (`LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv`), OSD-575, plus the published ISS values in CHECKS (Norsk 2015, Barger 2014, etc.).
   - Simulation method from R6: AR(1) + drift + circadian + injected events, **seeded, so output is reproducible**.
5. **Synthetic data only**, no real health records. Sara controls her data (relevant to the Send to Earth slot).
6. **Status never by colour alone.** The API returns a text label and icon key with every status, not just a colour.
7. **Decision support, not diagnosis.** That wording appears in the contract's card shape.

## Stack and environment

- Node.js + TypeScript + Express, Vitest, JSON files (no database server).
- Use context7 for current Express / Vitest / zod APIs.
- Data generator: TypeScript or Python (uv). Propose one.
- Demo machine: Hamza's desktop. RX 9060 XT 16 GB, no CUDA, 16 GB RAM. This matters for the later local model (Ollama via Vulkan/ROCm).
- Repo: private GitHub, branch `main`. gitleaks pre-commit hook in `.githooks/`.
- Tier: **C**. About 28 hours left. The board says submit by 6:00 PM TN / 10:00 PM PKT; the final day and time are still to confirm.

## Build loop (design this)

- **State in files.** `features.json` (all `passes: false`), the gate script, one feature per session, progress in git and HANDOFF.md.
- **Gate** (one command, under a minute): typecheck, lint, Vitest unit tests, an API contract test (responses match the documented shapes), and the hero-flow test in replay mode (check-in → zone → action card). CI runs the same gate plus gitleaks and `npm audit` on every push.
- **Workers and file ownership:** one writer per folder; parallel writers each get their own worktree; only Claude merges and commits; nobody pushes without Hamza's OK.

  | Lane | Who | Owns |
  |---|---|---|
  | A. Data generator + fixtures | Antigravity, Gemini 4 Hydrogen | data folder |
  | B. Content JSON (cards, BP steps, emergency steps from CHECKS.md) | Antigravity, Hydrogen | content folder |
  | C. Rules engine | Claude | rules/core folder |
  | D. API server + contract | Claude `core-builder` | api folder |
  | Review | Gemini 4 Argon (second-model review), `qa-gatekeeper` (writes tests only), `reviewer` (read-only) | none |

- **Commits** carry no Claude co-author line. Every AI job is logged in `AI-USAGE-LOG.md`.

## Decisions to put to Hamza at Stage 2

1. Where the rules engine runs:
   - server only, or
   - a shared TS package the frontend can also run in the browser, so check-ins still score if the backend is down.
2. PVT gap between targets: original PVT-B **1–4 s**, or ISS Reaction Self Test **2–5 s**. Pick one and keep it fixed.
3. Environment switch (station / Moon / Mars, R5): one mission-profile constant now, or leave it out.
4. Data generator language, and how many crew to simulate (Sara only, or Sara + 3 for the later crew view).
5. Contract format: OpenAPI file, or a markdown table with JSON examples plus zod schemas as the source of truth.

## Deliverables

As the skill's Stage 3 defines. Also:
- `docs/api-contract.md`: every Must endpoint with request/response JSON examples, plus reserved Should endpoints marked "not built". Short enough to hand to Mariam today.
- The data model: one check-in, one day, Sara's baseline, a card, an emergency procedure. Include the Should slot fields.
- The first two kickoff prompts:
  - one for Claude (rules engine)
  - one Antigravity brief for lane A (data generator)

## Out of scope

Frontend and UI, auth/login, database servers, deployment beyond a local run, success-metric targets (decided after backend testing, per HANDOFF decision #6).
