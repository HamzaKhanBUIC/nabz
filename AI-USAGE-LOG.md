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
