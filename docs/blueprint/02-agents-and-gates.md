# Agents and gates

## Role agents

| Role | Who | Does | Limits |
|---|---|---|---|
| Orchestrator | Claude (Opus 5.5; Fable 5.2 for design passes) | Plans, writes `src/core` and `src/schemas`, writes briefs, verifies, merges, commits | Never pushes without Hamza's OK |
| Lane A: data | Antigravity worker, Gemini 4 Hydrogen | `tools/simulate/`, `data/fixtures/`, `data/README.md` | Own worktree; brief `docs/briefs/A-data-simulator.md` |
| Lane B: content | Antigravity worker, Gemini 4 Hydrogen | `content/` | Own worktree; brief `docs/briefs/B-content.md` |
| API builder | `core-builder` subagent | `src/api/`, `src/store/`, `src/server.ts`, `tools/console/` | Own worktree if run beside another writer |
| Second-model review | Antigravity read-only worker, Gemini 4 Argon | Reviews lane A and B output against the brief and CHECKS.md | Writes nothing |
| Verifier | `qa-gatekeeper` | Runs the gate and verify steps, tries to break the feature | Writes only under `tests/` and `QUALITY_REPORT.md` |
| Spec review | `reviewer` | Checks changed files against the feature design | Read-only |

Antigravity workers run through the `agy` skill: `"$HOME\.claude\skills\agy\scripts\agyjob.ps1"`. Room for 1–2 at once on this machine.

## File ownership

See the table in `AGENTS.md`. Two rules on top:
- A worker that needs a change outside its folder stops and reports it. It doesn't make the change.
- `src/schemas/` is frozen for lanes A and B once F01 passes. A schema change goes through Claude.

## Build order

| Step | Features | Who | Needs |
|---|---|---|---|
| 1 | F00 skeleton, gate, CI | Claude | — |
| 2 | F01 schemas, examples, contract | Claude | F00 |
| 3 (parallel) | F02 data · F07 content · F03–F06 core | Lane A · Lane B · Claude | F01 |
| 4 | F08 API | `core-builder` | step 3 |
| 5 | F09 hero flow, F12 README | Claude | F08 |
| 6 | F10 NASA data, F11 test page | Claude / `core-builder` | F08 |
| 7 | Should features, one design pass each | — | F09 |

## Gate commands

`python scripts/gate.py` runs, in order, and stops at the first failure:

1. `npx tsc --noEmit`
2. `npx eslint .` (includes the rule that `src/core` imports nothing from Node)
3. `npx vitest run` (unit, contract and golden tests; clock pinned; no network)

CI (`.github/workflows/ci.yml`, created in F00) runs the same gate on every push, plus `gitleaks` and `npm audit --audit-level=high`.
Local commits go through the gitleaks hook in `.githooks/` (`git config core.hooksPath .githooks`).

## What a test must prove

- **Boundary tests** for every threshold: one value each side (354/355 ms, 99/100 ms, z −1.49/−1.5, 180/181 mmHg).
- **Known-answer tests** for formulas: a hand-computed session with its expected score.
- **Contract tests:** every example in `contract/examples/` and every live response parses against its zod schema.
- **Ground-truth tests:** the simulator records its injected events; the rules must flag them.
- **Text tests** for verified wording: the corrected strings appear exactly; the superseded ones don't.
- No mocks of our own code, no hardcoded expected output copied from the implementation, no skipped tests.

## Handoff format (every worker and subagent)

```
Feature: F0x
Files changed: <paths>
Gate: PASS | FAIL (+ last 10 lines)
Verify steps run: <commands and results>
Sources used: <CHECKS.md rows>
Open questions / anything outside my folder: <list or "none">
```

Claude checks the diff and reruns the gate before merging. A worker's report is a claim, not proof.

## Kickoff prompt (every build session)

> Read AGENTS.md, docs/blueprint/, features.json, and progress.md. Run the init script and `python scripts/gate.py`. Then start the highest-priority failing feature, following the session routine.
