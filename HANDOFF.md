# HANDOFF: NOVA TRIO, Space Apps 2026 (Astronaut Health Monitoring)

Last updated: Sat Nov 14, 2026, evening PKT.
**Phase: architecture locked; build starts with F00.** Read `AGENTS.md` and `docs/blueprint/` next.
- Git repo is set up, with a gitleaks secret-scan hook in `.githooks/`. Each clone turns it on with `git config core.hooksPath .githooks`.
- Private GitHub repo: see the bottom of this file.
- No app code and no API keys yet. The build plan is `features.json`; the gate is `python scripts/gate.py`.

## Problem statement (locked at the team workshop)

Sara, a mission commander on day 120 of the trip to Mars, needs a fast, private daily check-in. It compares her to her own normal and guides her through measurements, health routines and emergencies. She can act without waiting for Earth, which can take up to 40 minutes to reply.

## MVP split (from the team board)

**Must (Saturday build)**
- "Tap when green" reaction check-in
- Personal normal zone chart
- Action card: what changed, why it matters, what to do
- Guided medical measurement (e.g. blood pressure), step by step
- Emergency mode, one-tap step-by-step procedures, offline. **First person only (Sara herself).**

**Should (only if time)**
- AI coach for follow-up questions
- Health routines for hands, tension and blood pressure
- "Send to Earth?": Sara picks what to share
- Reminder for the health check-up
- Emergency mode "Who is this for?" with two buttons, **For me** and **For a crewmate**, for when someone collapses in front of Sara (added by Hamza, Nov 14)

**Later (pitch only)**
- Real wearable sensors
- Crew view for the medical officer
- Health forecast and mission-aware advice

**Design:** dark UI, labels 12 pt or larger, status never shown by colour alone, about 4 key screens.
**Tech (board):** web app, sample crew data, AI model for the coach, works offline.
**Constraints:** submit by 6:00 PM TN / 10:00 PM PKT (day and final time still to discuss). Supports decisions, isn't a diagnosis. Sara controls her data.

## Decisions on the outside review (Hamza, Nov 14)

| # | Review point | Decision |
|---|---|---|
| 1 | Move crew compare ("me or the ship?") to Should | **Skip.** Crew view stays in Later. |
| 2 | Must list too big; split out procedure writing | **Skip.** |
| 3 | Environment switch (station / Moon / Mars) from the brief | **Research first**, then decide. |
| 4 | Emergency mode for a crewmate | **Must: first person only. Should: add a "For a crewmate" option** (Hamza, Nov 14). Build Must emergency data so procedures can be tagged self / crewmate later without rework. |
| 5 | No NASA data named | **Yes, must fix.** Name NASA sources and base the simulated astronaut data on them. |
| 6 | Success numbers (check-in time, false alarms) | **Later.** Set after the backend is built and tested. |

## Hamza's scope: data + backend + AI

- **Must first.** Data and the formulas that drive the Must features.
- **AI is Should, not Must.** AI model choice (Claude API vs open source) and the API key come later.
- **Voice is an extra for later.** Speechmatics ($500 credits available).
- Open question for the AI phase: the board says "AI coach" and "works offline". A cloud API (Claude or Speechmatics) needs a connection, so the offline story needs an answer.

## Way of working

- Claude (this session) is the orchestrator: plans, writes briefs, verifies. Model choice is Opus 5.5, or Fable 5.2 for heavy design/review moments.
- Antigravity (Gemini workers) takes the bulk: research, dataset curation, data simulation.
- Setup comes before any build: create the repo, set up Claude, set up Antigravity offloading.
- Tracking files: research/README.md (research tasks and status), AI-USAGE-LOG.md (every AI job, for the submission's SI section).
- Antigravity check (Nov 14, ~4 PM): agy 1.5.8 signed in. Memory had room for about 2 workers at once.

## Team split

- Frontend (Mariam, Node.js) and UI/UX (Ameni) are separate. We don't touch frontend or UI work.
- Our only shared point with Mariam is the API contract (endpoints and JSON shapes). We agree it with her before she builds against it.

## Phases (each must pass its tests before the next starts)

Must → Should → Later. Within Must: data → formulas → action cards → measurement/emergency content → API.

## Next steps (in order)

1. Research R1–R6 running in Antigravity (Hamza's app, started Nov 14 afternoon). Hamza tells Claude when done.
   - **R1–R6 verified (Nov 14).** 4 corrections, recorded in research/CHECKS.md, which wins over the R files.
   - R7 (AI coach + voice) and R8 (crewmate emergency) verified, 1 correction each. All research R1–R8 is done.
2. Claude verifies each result against its sources; Argon second opinion on key numbers.
3. Decide: core NASA sources (R1), which emergencies (R4), environment switch yes/no (R5).
3b. **Decided (Nov 14):** five emergencies (bleeding, burn, eye, allergic reaction, near-fainting); no environment switch, one Mars-transit profile; real NASA file is OSD-569 blood counts, daily signals are simulated.
4. **Done (Nov 14): architecture.** `/agentic-architect` wrote AGENTS.md, CLAUDE.md, `docs/blueprint/00–03`, `docs/adr/0001`, `docs/features/` (one design per feature), `docs/api-contract.md` (draft), `features.json`, `scripts/gate.py`, and worker briefs in `docs/briefs/`.
5. **Next: build, in this order** (details in `docs/blueprint/02-agents-and-gates.md`):
   - F00 skeleton, gate, CI (Claude)
   - F01 schemas, example JSON, contract (Claude). After this the contract can go to Mariam.
   - In parallel: F02 data (Antigravity, brief A) · F07 content (Antigravity, brief B) · F03–F06 rules (Claude)
   - F08 API, F09 hero flow, F12 README; then F10 NASA data and F11 our test page
6. Should features: one short design pass each, after F09 passes (`docs/features/S-should-slots.md`).
7. Demo material (30-second video or 7 slides): later, outside the backend plan.

## Research to queue (not started)

- NASA data sources: HRP risks, OSDR (e.g. Inspiration4), NASA-STD-3001 limits, the challenge's Resources tab.
- Reaction test science (NASA's PVT-style tests): normal ranges, what a slowdown means.
- Blood pressure measurement steps, and how they change in microgravity.
- First-person emergency procedures that can be done alone, offline.
- Environment switch (#3): delays and escalation rules for station / Moon / Mars.
- Simulation design: which signals, how they drift by mission day 120, which events to inject.
- Later: offline-capable AI models; Speechmatics voice.

## Repo

- GitHub (private): https://github.com/HamzaKhanBUIC/space-apps-2026-astronaut-health
- Branch: `main`. Only Claude merges; every push needs Hamza's OK.
