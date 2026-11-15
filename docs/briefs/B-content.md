# Brief B: verified content (feature F07)

You are a worker on the nabz backend. Build one thing: the content JSON the app shows. You write words, not logic.

## Read first

1. `AGENTS.md` (rules; they apply to you)
2. `docs/features/M5-emergency.md`, `docs/features/M4-blood-pressure.md`, `docs/features/M3-action-card.md`
3. `src/schemas/` (your files must pass these; do not change them)
4. `research/CHECKS.md` in full. **It wins over every `research/R*` file.** Then `research/R4-emergencies.md` ("Proposed short screen instructions"), `research/R3-blood-pressure.md`, `research/R2-reaction-test.md`.

## You own (write only here)

- `content/sources.json`
- `content/emergency/bleeding.json`, `burn.json`, `eye.json`, `allergic-reaction.json`, `near-fainting.json`
- `content/bp-guide.json`
- `content/cards.json`
- `tests/unit/content.test.ts`

Do not edit anything else. If a schema doesn't fit the content, stop and say so in your report.

## Build

1. **`sources.json`**: one entry per source you cite: `id`, `title`, `url`. Use only sources that appear in `research/CHECKS.md` or the R files, with the URL given there. Ids to include at least: `aha-first-aid-2024`, `basner-2011-pvtb`, `cognition-iss-pmc11614644`, `jones-2022-iss-sleep`, `aha-acc-2025-bp`, `cdc-bp-measure`, `nhlbi-low-bp`, `norsk-2015`, `ochmo-std-100-1a`.
2. **Five emergency procedures**, all `for: "self"`, following `M5-emergency.md`. Start from R4's proposed screen text and apply every CHECKS correction.
3. **`bp-guide.json`**: the 8 steps in `M4-blood-pressure.md`, the severe and low symptom lists from `docs/blueprint/03-data-model.md` (ids in kebab-case, labels as written there).
4. **`cards.json`**: one template for each card id in the two rule tables of `M3-action-card.md` (17 templates). Only the placeholders listed there.
5. **`tests/unit/content.test.ts`**: the tests listed in `M5-emergency.md`, plus the template checks in `M3-action-card.md`.

## Wording rules

- **Copy verified wording; don't improve it.** These strings must appear exactly:
  - "Apply tourniquet above the wound, not on a joint. Tighten until bleeding stops."
  - eye flush: "15 minutes" (never 20)
  - burn: "5 to 20 minutes"
  - severe blood pressure retest: "about 5 minutes" (never 1 minute)
- One action per step, about 12 words, never more than 20. Plain words a tired person can follow.
- `whyItMatters` on a card states a finding from one of its sources, in one or two sentences. Don't write a finding the source doesn't contain.
- `whatToDo` is decision support: rest, re-check, tell a crewmate, put off precision work, take the blood pressure check. No diagnosis, no drug names or doses beyond what CHECKS R4 confirms (epinephrine auto-injector for a severe allergic reaction).
- Every procedure, the guide and every card carries "Decision support, not a diagnosis."
- First person only: Sara is treating herself.
- Where you can't find verified wording for something, leave it out and list it in your report. Never fill a gap from memory.

## Done when

- `npx vitest run tests/unit/content.test.ts` passes.
- Every `sourceId` you used exists in `sources.json`.

## Report (exactly this format)

```
Feature: F07
Files changed: <paths>
Gate: PASS | FAIL (+ last 10 lines)
Verify steps run: <commands and results>
Sources used: <CHECKS.md rows, per file>
Left out for lack of a verified source: <list or "none">
Open questions / anything outside my folder: <list or "none">
```

Do not commit. Do not push. Do not flip `passes` in `features.json`.
