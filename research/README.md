# Research tracker

Hamza runs the research in the Antigravity app: one agent per brief, all opened on this project folder. Each agent reads `briefs/00-RULES.md` and writes **only its own output file**, so agents never clash. When an output lands, Claude checks it against its sources and updates the status here.

**Status:** `queued` → `running` → `needs-check` → `verified` (or `rejected`, with the reason)

| ID | Question | Feeds (MVP) | Brief | Output | Status |
|---|---|---|---|---|---|
| R1 | NASA data sources: challenge Resources tab, HRP risks, OSDR datasets, NASA-STD-3001 limits | All Must; review point #5 | [brief](briefs/R1-nasa-data.md) | `R1-nasa-data.md` | verified |
| R2 | Reaction test: PVT / Cognition, metrics, normal ranges, personal baseline | Reaction check-in, normal zone chart, action card | [brief](briefs/R2-reaction-test.md) | `R2-reaction-test.md` | verified |
| R3 | Blood pressure: self-measurement steps, categories, red flags, microgravity effects | Guided measurement, action card | [brief](briefs/R3-blood-pressure.md) | `R3-blood-pressure.md` | verified |
| R4 | First-person emergencies Sara can handle alone, offline | Emergency mode | [brief](briefs/R4-emergencies.md) | `R4-emergencies.md` | verified |
| R5 | Station / Moon / Mars: delays, escalation, differences | Review point #3 (decide after) | [brief](briefs/R5-environments.md) | `R5-environments.md` | verified |
| R6 | Simulation design: signals, drift by day 120, events, calibration data | Sample crew data for all Must | [brief](briefs/R6-simulation.md) | `R6-simulation.md` | verified |
| R7 | AI coach (offline models, grounding, NASA AI assistants) and voice (Speechmatics, offline speech) | Should / Later | [brief](briefs/R7-ai-and-voice.md) | `R7-ai-and-voice.md` | queued |
| R8 | Crewmate collapses in front of Sara: check response and breathing, CPR in microgravity, recovery position, which steps one person can do | Should: emergency "For a crewmate" | [brief](briefs/R8-crewmate-emergency.md) | `R8-crewmate-emergency.md` | verified |

**Checks and corrections:** [CHECKS.md](CHECKS.md). Where an R file and CHECKS.md disagree, CHECKS.md wins.

**Model:** Gemini 4 Hydrogen (high) for research. Gemini 4 Argon as a second opinion on key numbers (thresholds, ranges) before they go into code.
