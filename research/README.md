# Research tracker

Hamza runs the research in the Antigravity app: one agent per brief, all opened on this project folder. Each agent reads `briefs/00-RULES.md` and writes **only its own output file**, so agents never clash. When an output lands, Claude checks it against its sources and updates the status here.

**Status:** `queued` → `running` → `needs-check` → `verified` (or `rejected`, with the reason)

| ID | Question | Feeds (MVP) | Brief | Output | Status |
|---|---|---|---|---|---|
| R1 | NASA data sources: challenge Resources tab, HRP risks, OSDR datasets, NASA-STD-3001 limits | All Must; review point #5 | [brief](briefs/R1-nasa-data.md) | `R1-nasa-data.md` | needs-check |
| R2 | Reaction test: PVT / Cognition, metrics, normal ranges, personal baseline | Reaction check-in, normal zone chart, action card | [brief](briefs/R2-reaction-test.md) | `R2-reaction-test.md` | running |
| R3 | Blood pressure: self-measurement steps, categories, red flags, microgravity effects | Guided measurement, action card | [brief](briefs/R3-blood-pressure.md) | `R3-blood-pressure.md` | needs-check |
| R4 | First-person emergencies Sara can handle alone, offline | Emergency mode | [brief](briefs/R4-emergencies.md) | `R4-emergencies.md` | needs-check |
| R5 | Station / Moon / Mars: delays, escalation, differences | Review point #3 (decide after) | [brief](briefs/R5-environments.md) | `R5-environments.md` | running |
| R6 | Simulation design: signals, drift by day 120, events, calibration data | Sample crew data for all Must | [brief](briefs/R6-simulation.md) | `R6-simulation.md` | running |
| R7 | Offline-capable AI models; Speechmatics voice | Should / Later | not written | | later |

**Model:** Gemini 4 Hydrogen (high) for research. Gemini 4 Argon as a second opinion on key numbers (thresholds, ranges) before they go into code.
