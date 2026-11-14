# M5: Emergency mode (first person, offline)

Feature F07. Owner: lane B (`content/emergency/*.json`); Claude reviews every line against `research/CHECKS.md`.

## What it does

One tap opens short, numbered steps Sara can follow alone. No scoring, no rules, no network: verified text served as one bundle so the frontend can keep a copy.

## Procedures (all `for: "self"`)

| id | Title | Key verified facts (CHECKS R4) |
|---|---|---|
| `bleeding` | Bleeding cut | Firm, steady pressure; add cloth on top if soaked. Tourniquet text, exactly: "Apply tourniquet above the wound, not on a joint. Tighten until bleeding stops." |
| `burn` | Burn | Cool with clean cool running water for 5 to 20 minutes. No ice. `timerSeconds: 1200` |
| `eye` | Eye injury or chemical splash | Flush for **15 minutes**. Keep the chemical away from the other eye. `timerSeconds: 900` |
| `allergic-reaction` | Allergic reaction | Breathing trouble, throat tightness or swelling: epinephrine auto-injector into the outer thigh; a second dose is sometimes needed. |
| `near-fainting` | Dizzy or about to faint | Lie down; cross legs and tense leg, belly and buttock muscles. Links to the blood pressure check. |

Starting text for the steps is the R4 proposal ("Proposed short screen instructions"). Where CHECKS corrected R4, CHECKS wins.

## Shape rules

- Each step: one action, about 12 words, plain words. `detail` holds anything longer.
- `redFlags`: the signs that mean "stop and get help", taken from R4's "Escalate now" lines.
- `escalation.text`: "Red flag or getting worse? Alert a crewmate now. Do not wait for Earth."
- `disclaimer`: "Decision support, not a diagnosis."
- `sources`: at least the 2024 AHA / Red Cross first-aid guideline (`aha-first-aid-2024`).
- `version`: starts at 1; bump on any text change so a cached copy can be refreshed.

## Endpoint

`GET /api/emergency/procedures` returns `{ version, procedures[] }`. `?for=self` is the default. `?for=crewmate` returns an empty list until S01 is built. `GET /api/emergency/procedures/:id` returns one.

## Not in the set (and why)

Chest pain, sudden severe headache, toxic air and kidney stone pain need a crewmate or the spacecraft's own procedure almost at once (R4). They are not solo procedures. Toxic air in particular must defer to the spacecraft procedure (CHECKS R8 note).

## Tests (`tests/unit/content.test.ts`)

- Every file parses against the `Procedure` schema; ids are unique; all five exist; all are `for: "self"`.
- `eye` contains "15 minutes" and does not contain "20 min".
- `bleeding` contains the exact tourniquet sentence and does not contain "2 in".
- `burn` contains "5 to 20 minutes" and "ice".
- No step is longer than 20 words. Every procedure has red flags, an escalation line, the disclaimer and a source.
- Every `sourceId` used anywhere in `content/` exists in `content/sources.json`.

## Slot for Should (S01)

Crewmate procedures are new files with `for: "crewmate"` (collapse, CPR in microgravity, seizure, low blood sugar; R8). Nothing in the five self procedures changes.
