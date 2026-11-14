# Should features (`S01`–`S05`): design & implementation record

Built on top of Must without altering any Must rule, baseline calculation, or `for: "self"` emergency procedure. Full architectural decisions live in [docs/adr/0002-should-features.md](../adr/0002-should-features.md).

## S01: Emergency "For me / For a crewmate" (`built`)

- **Endpoint:** `GET /api/emergency/procedures?for=crewmate` and `GET /api/emergency/procedures/:id`.
- **Content (`content/emergency/`):** `crewmate-collapse`, `crewmate-cpr`, `crewmate-seizure`, `crewmate-low-blood-sugar` — sourced from `research/CHECKS.md` R8.
- **Step addition:** Optional `metronomeBpm?: number` (`110` bpm, within 100–120/min) on `ProcedureStep`.
- **Safety wording:** Exact `CHECKS.md` R8 corrections enforced by tests (Evetts-Russomano leg lock, no full-depth claim in 0g, isolated restraint before defibrillation, seizure 5 / 5–10 min escalation, oral glucose only when awake and swallowing, toxic air defers to spacecraft procedure).

## S02: Offline-first AI coach (`built`)

- **Endpoint:** `POST /api/coach/ask` (`CoachAskInput` → `CoachAskResponse`).
- **Contract:** `src/core/coach.ts` + `src/slots/coach/index.ts` (`CoachContext`, `CoachAnswer`, `CoachProvider`).
- **Rules enforced in code:**
  - Never accesses raw historical logs and never edits scores, zones, or cards (`Card` facts + `content/coach-knowledge.json` only).
  - Deterministic red-flag scanner (`detectCoachRedFlag`) attaches an urgent alert banner whenever red-flag words or `urgent` card severity appear.
  - Strict grounding: out-of-scope questions return `grounded: false`, `citations: []`, and `"I only answer from verified mission medical cards and don't have a verified source on that."`.
  - Default `DeterministicCoachProvider` runs offline with zero network calls; optional `OllamaCoachProvider` wraps local Ollama (`COACH_PROVIDER=ollama`) with automatic deterministic fallback.

## S03: Health routines (`built`)

- **Endpoint:** `GET /api/routines`.
- **Content (`content/routines/`):** `hands-microbreak` (`hands`), `tension-winddown` (`tension`), `bp-quiet-rest` (`blood-pressure`), using `ProcedureStep` and linked via `card.links.routineId`.

## S04: Send to Earth (`built`)

- **Endpoints:** `POST /api/share/preview` (`200`) and `POST /api/share` (`201`).
- **Rules enforced in code:** Sara toggles which metrics (`includeReaction`, `includeSleep`, `includeBp`, `includeCards`, optional `entryIds`, optional `note`) to include, inspects the exact `summaryText` + Mars `3–22 min` one-way delay before sending, and must pass `confirm: true` to persist a queued packet to local `runtime.outbox`. Zero network calls.

## S05: Check-up reminder (`built`)

- **Endpoints:** `GET /api/reminders`, `PUT /api/reminders`, plus `nextDue` in `GET /api/today`.
- **Pure core:** `computeReminders(ctx, schedule)` and `nextDue(ctx, schedule, nowIso)` in `src/core/reminders.ts` (`DEFAULT_CHECKIN_REMINDER_UTC = "08:00"`, `DEFAULT_BP_REMINDER_UTC = "08:30"`, `DEFAULT_BP_INTERVAL_DAYS = 3` — marked design choices).

## Later (no slots)

Wearables, crew view, forecast and voice are pitch notes in `docs/blueprint/01-scope.md`. The fixtures already hold three more crew members and resting heart rate, so a crew view or wearable feed would reuse the M2 fold unchanged.
