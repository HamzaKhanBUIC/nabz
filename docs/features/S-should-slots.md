# Should features: reserved slots

Nothing here is built in Must. Each feature gets a short design pass (one ADR in `docs/adr/`, its own design file here, verify steps in `features.json`) right before it's built. This file records what Must already provides so that pass adds code without changing Must.

Every endpoint below exists from F08 on and answers `501 {"error": {"code": "not_built", "feature": "<name>"}}`.

## S01: Emergency "For me / For a crewmate"

- **Slot:** `for: "self" | "crewmate"` on every procedure; `GET /api/emergency/procedures?for=crewmate` (empty list today).
- **Adds:** new files in `content/emergency/` (collapse check, CPR in microgravity, seizure, low blood sugar). Research: R8 and `research/CHECKS.md` R8.
- **Must not change:** the five self procedures, the `Procedure` shape.
- **Design questions:** a compression metronome (100–120/min) as a `Step` field; wording that doesn't promise full compression depth (CHECKS R8 note).

## S02: AI coach

- **Slot:** `POST /api/coach/ask`; `facts`, `ruleId` and `sources` on every card; `src/slots/coach/` holds the interface:

```ts
type CoachContext = { card: Card; question: string; snippets: { sourceId: string; text: string }[] };
type CoachAnswer  = { answer: string; grounded: boolean; citations: SourceRef[]; banner?: Status };
interface CoachProvider { explain(ctx: CoachContext): Promise<CoachAnswer> }
```

- **Rules already fixed:** the coach never sees raw history and never changes a card. Code builds the context from the card and verified content only. No snippet found → the fixed reply "I only answer from verified mission medical cards and don't have a verified source on that." Red-flag words in the question (chest pain, can't breathe, fainting) → code adds an urgent banner; the model doesn't decide that.
- **Design questions:** provider (local Qwen3-4B through Ollama, or Claude when a link exists, per R7); retrieval by `sourceId` and tag or by search; how answers are tested (fixed question set, pass/fail checks). Expect frequent "no source" replies (CHECKS R7).

## S03: Health routines

- **Slot:** `GET /api/routines`; `links.routineId` on cards.
- **Adds:** `content/routines/*.json` (hands, tension, blood pressure), same step shape as procedures.
- **Design questions:** needs its own research brief; none of R1–R8 covers routine content.

## S04: Send to Earth

- **Slot:** `POST /api/share/preview` and `POST /api/share`; every stored entry has a stable `id`.
- **Rules already fixed:** nothing leaves without Sara choosing entries and confirming a preview. Sharing writes a package to a local outbox file; no network call in the hackathon build.
- **Design questions:** what a package contains (entries, cards, a summary), and how the 3–22 minute delay is shown.

## S05: Check-up reminder

- **Slot:** `GET /api/reminders`, `PUT /api/reminders`; `nextDue` in `GET /api/today` (returns `null` today).
- **Adds:** a pure function `nextDue(history, schedule, now)` in `src/core`.
- **Design questions:** cadence for blood pressure (R3 mentions periodic checks; no verified interval for a personal app).

## Later (no slots)

Wearables, crew view, forecast and voice are pitch notes in `docs/blueprint/01-scope.md`. The fixtures already hold three more crew members and resting heart rate, so a crew view or wearable feed would reuse the M2 fold unchanged.
