# ADR 0002: Should Features Design Pass (`S01`–`S05`) (2026-11-14)

## Context
All Must (`F00`–`F09`, `F12`) and P1 (`F10`, `F11`) features pass `scripts/gate.py` on branch `argon/work`. The UI/UX wireframes (`docs/wireframe-review.md`) already surface four Should capabilities: Crewmate Emergency (`Me / A crewmate`), Offline-first AI Coach, Health Routines, Send to Earth, and Check-up Reminders. This ADR records the concrete architecture and design choices before building `S01`–`S05`.

## Decisions

1. **`S01` — Crewmate emergency (`GET /api/emergency/procedures?for=crewmate`)**
   - Adds four verified `for: "crewmate"` JSON procedures in `content/emergency/`:
     `crewmate-collapse`, `crewmate-cpr`, `crewmate-seizure`, and `crewmate-low-blood-sugar`.
   - Grounded strictly in `research/CHECKS.md` R8 (`PMC7607644` DGLRM/ESAM spaceflight CPR guideline, 2025 AHA/RCUK BLS, 2024 AHA/ARC First Aid).
   - Extends `ProcedureStep` with optional `metronomeBpm?: number` (`110`, middle of the verified `100–120/min` chest-compression rate).
   - Preserves `CHECKS.md` R8 safety corrections verbatim: `"Wrap your legs around their chest. Lock your ankles behind their back."`, `"follow your spacecraft's emergency procedure"` for toxic air, no promise of full 50–60 mm compression depth in microgravity, defibrillate only when restrained on an electrically isolated surface, oral glucose only if awake and able to swallow, and seizure escalation at `> 5 minutes` or not back to normal in `5 to 10 minutes`.

2. **`S02` — Deterministic offline-first AI coach (`POST /api/coach/ask`)**
   - **Rules decide, AI never decides:** `src/core/coach.ts` inspects only the active `Card` (`facts`, `ruleId`, `sources`, `severity`), the user `question`, and `content/coach-knowledge.json`. It never reads raw history or mutates scores, zones, or cards.
   - **Deterministic Red-Flag Guardrail:** Before answering, `detectCoachRedFlag(question, card)` checks the question for red-flag symptom phrases (`chest pain`, `can't breathe`, `shortness of breath`, `fainting`, `collapsed`, `unconscious`, `seizure`, `numbness`, `weakness`, `vision change`, `trouble speaking`, `back pain`, `bleeding`) or `card.severity === "urgent"`. If matched, `banner` is set to `{ level: "urgent", label: "Alert a crewmate or medical officer now — do not wait for Earth.", iconKey: "alert" }`.
   - **Strict Retrieval & Fixed Abstention:** `selectCoachSnippets` retrieves relevant verified snippets from `content/coach-knowledge.json` using rule/topic/token matching. If no snippet and no card-relevant question match (out-of-scope query), it refuses cleanly with `grounded: false`, `citations: []`, and `COACH_NO_SOURCE_REPLY`: `"I only answer from verified mission medical cards and don't have a verified source on that."` (`research/CHECKS.md` R7 RAG trade-off).
   - **Swappable Provider (`src/slots/coach/index.ts`):** `DeterministicCoachProvider` is the zero-dependency offline default. `OllamaCoachProvider` (e.g., local `qwen3:4b`) is provided as an opt-in explanation phraser (`COACH_PROVIDER=ollama`) that validates citations and falls back automatically to `DeterministicCoachProvider` when Ollama is absent or offline.

3. **`S03` — Health routines (`GET /api/routines`)**
   - Adds three self-care recovery routines in `content/routines/` (`hands-microbreak`, `tension-winddown`, `bp-quiet-rest`) matching `ProcedureStep` so the frontend renders steps and timers with one component.
   - Connects actionable cards in `content/cards.json` via `links.routineId`: `reaction-slow-short-sleep` → `tension-winddown`, `reaction-watch` → `hands-microbreak`, and `bp-off-normal` / `bp-above-ideal` → `bp-quiet-rest`.

4. **`S04` — Send to Earth (`POST /api/share/preview` & `POST /api/share`)**
   - Implements human-in-the-loop data sharing (`docs/features/S-should-slots.md`): Sara selects checkboxes (`includeReaction`, `includeSleep`, `includeBp`, `includeCards`, optional `days`, optional `entryIds`, optional `note`), previews the exact structured entry list + `summaryText` formatted for the flight surgeon + Mars `3–22 min` one-way delay (`18 min` nominal cruise midpoint), and must submit `{ ..., confirm: true }` to `POST /api/share` to append the package to `runtime.outbox` in `<runtimeDir>/<subjectId>.json`. Zero network calls are made.

5. **`S05` — Check-up reminders (`GET /api/reminders`, `PUT /api/reminders`, `Today.nextDue`)**
   - Adds pure `computeReminders` and `nextDue` in `src/core/reminders.ts` (time passed via `nowIso`).
   - Design choices (no verified personal interval in R1–R8): daily reaction check-in due at `08:00` UTC; guided blood pressure check due every `3` days at `08:30` UTC. Users can customize hours/interval or toggle `enabled` via `PUT /api/reminders`.
   - `GET /api/today` returns `nextDue` computed from runtime + simulated history and active schedule (`null` only when reminders are disabled).

## Consequences
- All 6 endpoints previously returning `501 not_built` in `src/schemas/endpoints.ts` become active `tier: "should"` endpoints (`200` / `201`) with strict zod contracts exported to `contract/schemas.json`.
- `src/core/` stays 100% pure (checked by ESLint AST rules).
- Must card rules, baseline math, and verified `for: "self"` procedures remain unchanged.
