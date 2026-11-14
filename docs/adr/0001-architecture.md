# ADR 0001: Architecture lock (2026-11-14)

## Decision

1. **One Node package**: Express 5, zod 4, Vitest 5, TypeScript, JSON files. No database, no API keys, no network at runtime.
2. **Rules run on the server**, in a pure `src/core` folder that imports nothing from Node.
3. **Plain typed functions and a priority table** choose the action card. No rules-engine library.
4. **The browser times the taps and sends raw trials.** The server validates and scores everything.
5. **Baseline is within-person:** mean and SD of the last 14 valid check-ins that were not in zone `act`; at least 5 needed.
6. **zod schemas are the contract.** `contract/examples/*.json` and `docs/api-contract.md` are checked against them by tests.
7. **Must is designed in full. Should gets slots** (fields, 501 endpoints, `src/slots/` interfaces). Later is a list.
8. **Simulated daily signals + one real NASA file.** Reaction, blood pressure, sleep and heart rate are simulated from published ISS values. The real Inspiration4 blood counts (OSD-569) run through the same baseline engine.
9. **Generator in TypeScript**, seeded, Sara + 3 crew, output committed.
10. **PVT-B with a 1–4 s gap**, 3 minutes, lapse ≥ 355 ms, false start < 100 ms.

## Why

- **1, 3:** 28 hours. Fewer moving parts means fewer things to break before a judged demo. About 15 fixed rules don't need an engine; `json-rules-engine` is async and throws on a missing fact, which is exactly our cold-start case.
- **2:** In the story the backend is the ship's computer, so "offline" means no link to Earth, not no server. Keeping the core pure costs nothing now and leaves the browser option open.
- **4:** Only the browser can time a tap. Sending raw trials keeps scoring deterministic and lets us re-score if a threshold is corrected.
- **5:** NASA's Cognition studies flag scores at or below −1.5 SD from the person's own baseline. Leaving `act` days out of the window stops a bad week from becoming the new normal. Window and minimum come from the R2 proposal and are marked as design choices.
- **6:** A hand-written contract drifts. Tests that parse examples and live responses against one schema set can't.
- **7:** Reserving a field or an endpoint name is free now and expensive later (emergency cards without `for` would all be rewritten).
- **8:** OSD-569 holds blood counts for 4 crew at 7 timepoints, nothing daily. Saying so is more defensible than stretching it.
- **9:** The generator imports the same schemas as the API, so fixtures can't drift, and the gate stays on one toolchain.
- **10:** The 355 ms lapse threshold was validated on the 1–4 s version (Basner 2011).

## Alternatives rejected

- **Shared rules package in the browser now:** needs workspace and bundler setup we can't test against the frontend's toolchain yet.
- **`ts-rest`:** archived October 2026; needs Express 4 and zod 3.
- **OpenAPI via `zod-to-openapi`:** fine, but an extra step nobody has asked for. Add it if the frontend wants Swagger.
- **Python generator:** better numeric libraries, but a second toolchain in the gate and duplicated schemas.
- **SQLite:** not needed for one user and 120 days; JSON files are inspectable and diffable.
- **2–5 s gap (ISS Reaction Self Test):** valid, but gives about 45 taps instead of 60 and the threshold evidence is for 1–4 s.
- **Rolling baseline that includes every day:** simpler, but a slow decline would hide itself.
- **Using the `pre-commit` framework file the scaffolder created:** removed; the repo already has a gitleaks hook in `.githooks/`, and two hook systems would confuse it.
