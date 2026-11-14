# Brief A: data simulator (feature F02)

You are a worker on the crewpulse backend. Build one thing: a seeded generator that writes 120 days of sample health data.

## Read first

1. `AGENTS.md` (rules; they apply to you)
2. `docs/features/D1-data-simulation.md` (the design you are building)
3. `docs/blueprint/03-data-model.md` (shapes, storage section)
4. `src/schemas/` (the zod schemas your output must pass; do not change them)
5. `research/CHECKS.md` (verified numbers; it wins over any `research/R*` file)

## You own (write only here)

- `tools/simulate/**`
- `data/fixtures/**`
- `data/README.md`
- `tests/unit/simulate.test.ts`
- the `simulate` script line in `package.json` (one line; touch nothing else in that file)

Do not edit anything else. If you need a change outside these paths (a schema field, a dependency), stop and say so in your report.

## Build

1. `tools/simulate/rng.ts`: mulberry32 and a Box–Muller normal. A function that derives a sub-seed from the master seed plus a string (subject id + signal name). No `Math.random()`, no `Date.now()`, anywhere.
2. `tools/simulate/config.ts`: every parameter in one object: master seed, launch date `2026-07-19`, days `120`, the four subjects (Sara the commander plus three crew with invented first names and roles), each subject's personal means, the events table from the design.
3. `tools/simulate/signals.ts`: sleep hours, daily reaction-test trials, blood pressure every 3rd day (2 readings), resting heart rate. Follow the model in the design: personal mean + drift + AR(1) + event effects.
4. `tools/simulate/index.ts`: writes `data/fixtures/mission.json` and `data/fixtures/<subjectId>.json`, validates each against the schemas before writing, and supports `--check` (regenerate in memory, exit 1 on any difference).
5. `data/README.md`: what the fixtures are, the seed, and the honesty table: every parameter marked **sourced** (with its CHECKS row) or **assumption** (one line why).
6. `tests/unit/simulate.test.ts`: the tests listed in the design.

## Rules that matter most

- **Never invent a source.** If a number isn't in `research/CHECKS.md`, it is an assumption. Label it so.
- **Reaction trials must respect the protocol:** gap 1 000–4 000 ms, whole-millisecond `rtMs`, about 180 s per session, early taps as `{early: true, rtMs: null}`.
- **Output must be byte-identical across runs:** stable key order, fixed rounding, `\n` line endings, no timestamps of "now".
- **Day 120 for Sara is the hero day:** sleep under 6 h on the two nights before days 119 and 120, and clearly slower reactions on day 120 than her previous two weeks. Keep the size of the sleep effect as one named config value; the orchestrator may tune it.
- This is simulated data. The words "NASA data" must not describe it anywhere.

## Done when

- `npx tsc --noEmit` and `npx vitest run tests/unit/simulate.test.ts` pass.
- `npm run simulate` then `npm run simulate -- --check` reports no difference.
- Fixture files total under 3 MB.

## Report (exactly this format)

```
Feature: F02
Files changed: <paths>
Gate: PASS | FAIL (+ last 10 lines)
Verify steps run: <commands and results>
Sources used: <CHECKS.md rows>
Assumptions: <parameter = value, one line each>
Open questions / anything outside my folder: <list or "none">
```

Do not commit. Do not push. Do not flip `passes` in `features.json`.
