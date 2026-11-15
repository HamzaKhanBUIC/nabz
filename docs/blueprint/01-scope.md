# Scope

## Outcome metric

With the network off, a day-120 check-in for Sara returns zone `act` and the short-sleep action card with its sources, the 120-day trend returns her personal band, and `python scripts/gate.py` exits 0 in under 60 seconds. Test: `tests/golden/hero-flow.test.ts`.

Product success numbers (check-in time, false-alarm rate) are set after backend testing (HANDOFF decision #6).

## P0: Must (designed in full, built first)

| Feature | Design | features.json |
|---|---|---|
| Reaction check-in ("tap when green", PVT-B) | `docs/features/M1-reaction-checkin.md` | F03 |
| Personal normal zone and trend | `docs/features/M2-normal-zone.md` | F04 |
| Action card: what changed / why it matters / what to do | `docs/features/M3-action-card.md` | F05 |
| Guided blood pressure measurement | `docs/features/M4-blood-pressure.md` | F06 |
| Emergency mode, first person, offline | `docs/features/M5-emergency.md` | F07 |
| Sample data: 120 days, Sara + 3 crew, seeded | `docs/features/D1-data-simulation.md` | F02 |
| API for all of the above | `docs/api-contract.md` | F01, F08, F09 |

P1, after P0 passes: real NASA blood data through the baseline engine (F10), our own test page (F11).

## P2: Should (slots only now)

Each gets a short design pass (one ADR + its features.json entries) right before it's built. Slots are in `docs/features/S-should-slots.md`.

| Feature | Slot reserved now |
|---|---|
| Emergency "For me / For a crewmate" | `for: "self" \| "crewmate"` on every procedure; `?for=` filter on the endpoint |
| AI coach | `POST /api/coach/ask` (501); `facts` and `ruleId` on every card; `src/slots/coach` |
| Health routines | `GET /api/routines` (501); `links.routineId` on cards |
| Send to Earth | `POST /api/share/preview`, `POST /api/share` (501); every stored entry has a stable `id` |
| Check-up reminder | `GET/PUT /api/reminders` (501); `nextDue` in `GET /api/today` |

## Extras (P3, chosen 2026-11-15; design in `docs/adr/0003-extras.md` and `docs/features/E-extras.md`)

- E01 crew sign-in with name and code, one data set per person (emergency stays public)
- E02 real astronaut data screen (OSD-569, Inspiration4)
- E03 NASA hazards and HRP risks on every action card
- E04 radiation dose estimate from Curiosity RAD data against the 600 mSv career limit
- E05 medical officer view, with each person's consent
- E06 environment switch: ISS, Moon, Mars transit, Mars surface, Remote Earth if sourced (guidance changes, thresholds never do)

These promote two Later items below: the crew view becomes E05, and Station / Moon profiles become E06.

## Later (pitch notes only; no code, no slots)

- Wearable sensors feeding the same baseline engine
- Crew view for the medical officer (fixtures already hold 3 more crew)
- Health forecast and mission-aware advice
- Offline voice commands (Vosk or whisper.cpp), spoken steps (browser speech synthesis)
- Speechmatics dictation when a link exists (cloud only; on-prem is Enterprise)
- Station / Moon profiles (delay values are stored in `mission.json`; no switch is built)

## Cut-line

If time runs short, cut in this order: F11 test page polish, F10 NASA endpoint (keep the test), fifth emergency (near-fainting), sustained-BP rule. Never cut: F03–F05, the gate, the contract tests.

## Decisions locked at Stage 2 (Hamza, Nov 14)

1. Rules run on the server only; `src/core` stays pure.
2. PVT-B gap between targets: 1–4 s.
3. Five emergencies: bleeding, burn, eye, allergic reaction, near-fainting.
4. One mission profile (Mars transit); station and Moon values stored as data.
5. Generator in TypeScript; Sara + 3 crew.
6. Demo material (30-second video or 7 slides) is handled later, outside this blueprint.
7. We build a small test page for ourselves; the frontend developer gets the contract afterwards.

## Tier and deadline

Tier C. Submit by 6:00 PM TN / 10:00 PM PKT (final day and time to confirm). Feature freeze 3 hours before.
