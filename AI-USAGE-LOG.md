# AI usage log

The Space Apps submission must describe how SI (AI) was used. Log every AI job here as it happens, so the submission write-up is ready at the end.

| When (PKT) | Tool / model | Task | Output | Checked by |
|---|---|---|---|---|
| Nov 14 | Claude Code (Opus 5.5) | Planning: folder setup, MVP decisions, research list | HANDOFF.md, research/README.md | Hamza |
| Nov 14 | Claude Code (Opus 5.5) | Research briefs R1–R6, setup plan | research/briefs/, docs/setup-plan.md | Hamza |
| Nov 14 | Antigravity app (6 agents, run by Hamza) | Research R1–R6 | research/R*.md | Claude: verified, 4 corrections (research/CHECKS.md) |
| Nov 14 | Antigravity CLI worker (asked for Gemini 4 Argon, ran on fallback Gemini 3.8 Flash), read-only | Fact-check of 16 NASA / simulation claims from R1, R5, R6 | research/CHECKS.md | Claude re-checked 2 key claims against OSDR API and PMC |
| Nov 14 | Claude Code (Opus 5.5) | Checked R2–R4 against primary sources (2024 AHA/Red Cross first-aid guideline, Basner 2011, AHA BP guidance) | research/CHECKS.md | Claude |
| Nov 14 | Claude Code (Opus 5.5) | R8 brief (crewmate emergency, Should) | research/briefs/R8-crewmate-emergency.md | Hamza |
| Nov 14 | Antigravity app (run by Hamza) | Research R8: crewmate emergency | research/R8-crewmate-emergency.md | Claude: verified against Hinkelbein 2020 guideline + 3 PubMed abstracts, 1 correction |
| Nov 14 | Claude Code (Opus 5.5) | R7 brief (AI coach + voice) | research/briefs/R7-ai-and-voice.md | Hamza |
| Nov 14 | Claude Code (Opus 5.5) | Git setup, secret-scan hook (tested: blocked a fake token) | .gitignore, .githooks/ | Claude |
| Nov 14 | Antigravity app (run by Hamza) | Research R7: AI coach + voice | research/R7-ai-and-voice.md | Claude: verified 8 key claims (Speechmatics pricing/plans, MDN, NASA NTRS slides, HF licence, PubMed), 1 correction |
| Nov 14 | Claude Code (Fable 5.2), /agentic-architect skill | Backend architecture: blueprint, data model, per-feature designs, API contract draft, features.json, worker briefs | docs/blueprint/, docs/features/, docs/api-contract.md, docs/briefs/, features.json, AGENTS.md | Hamza (5 trade-off picks) |
| Nov 14 | 2 Claude research subagents (read-only) | Reference repos: jsPsych, json-rules-engine, Synthea, ts-rest, zod-to-openapi, FHIR naming | Summarised in docs/blueprint/00-architecture.md | Claude: ts-rest archive status and package versions re-checked with npm |
| Nov 14 | Claude Code (Fable 5.2) | Checked 4 more numbers against sources (−1.5 SD, ≤ 6 h sleep, low BP, home BP steps); downloaded OSD-569 CSV | research/CHECKS.md addenda, data/nasa/ | Claude |
| Nov 14 | Claude Code (Fable 5.2) | Build F00 (skeleton, gate, CI) and F01 (schemas, example JSON, contract tests) | src/, contract/, tests/contract/, .github/workflows/ci.yml | Gate: typecheck, lint, 35 tests pass |
| Nov 14 | Antigravity (Orchestrator Argon) | F02: seeded 120-day crew data simulator, fixtures, honesty table, and unit tests | tools/simulate/, data/fixtures/, data/README.md, tests/unit/simulate.test.ts | Gate PASS (tsc, eslint, simulate.test.ts 4/4, --check byte-identical) |
| Nov 14 | Antigravity (Orchestrator Argon) | F07: verified emergency procedures, BP guide, card templates, sources, and content tests | content/, tests/unit/content.test.ts | Gate PASS (tsc, eslint, content.test.ts 4/4) |
| Nov 14 | Antigravity (Orchestrator Argon) | F03: PVT-B protocol, trial scoring, and session QC rules | src/core/{constants,pvt,qc}.ts, tests/unit/pvt.test.ts | Gate PASS (tsc, eslint, pvt.test.ts 5/5) |
| Nov 14 | Antigravity (Orchestrator Argon) | F04: personal baseline fold, zone classification, and trend builder | src/core/{zone,baseline}.ts, tests/unit/baseline.test.ts | Gate PASS (tsc, eslint, baseline.test.ts 6/6) |
| Nov 14 | Antigravity (Orchestrator Argon) | F05: priority rule table and action card rendering engine | src/core/{constants,cards}.ts, tests/unit/cards.test.ts | Gate PASS (tsc, eslint, cards.test.ts 4/4) |
| Nov 14 | Antigravity (Orchestrator Argon) | F06: guided blood pressure averaging, categorization, sustained high, and next actions | src/core/{bp,index}.ts, tests/unit/bp.test.ts | Gate PASS (tsc, eslint, bp.test.ts 6/6) |
| Nov 14 | Antigravity (Orchestrator Argon) | F08: JSON store, Must API endpoints, and 501 reserved stubs | src/store/*, src/api/app.ts, tests/contract/api.test.ts | Gate PASS (tsc, eslint, api.test.ts 5/5) |
| Nov 14 | Antigravity (Orchestrator Argon) | F09: offline hero-flow golden test (day 120 check-in, trend, severe BP, emergency) | tests/golden/hero-flow.test.ts | Gate PASS (tsc, eslint, hero-flow.test.ts 2/2, < 60s) |
