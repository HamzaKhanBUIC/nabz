# Research checks

Claude checked the numbers that will go into code or onto Sara's screens against primary sources. This file wins over the R files wherever they disagree.

**Verdicts:**
- **confirmed**: the source says this.
- **corrected**: the R file was wrong; use the value here.
- **unconfirmed**: the source couldn't be opened; treat it with care.

## R2: reaction test

Status: **verified**

| Claim | Verdict | Source checked |
|---|---|---|
| PVT-B: 3 min; random gap between targets 1–4 s, including 1 s of feedback | confirmed | Basner et al. 2011, [PMC3197786](https://pmc.ncbi.nlm.nih.gov/articles/PMC3197786/) |
| Lapse = reaction time ≥ 355 ms on PVT-B (≥ 500 ms on the 10-min test) | confirmed (the paper notes 355 ms was found post hoc) | same |
| False start = response with no target, or RT < 100 ms | confirmed | same |
| Performance score = 100% × [1 − (lapses + false starts) / (valid stimuli + false starts)] | confirmed | same |
| Mean 1/RT is the most sleep-loss-sensitive metric, better than mean or median RT | consistent with the cited paper; not re-opened | Basner & Dinges 2011, [PMC3079937](https://pmc.ncbi.nlm.nih.gov/articles/PMC3079937/) |

**Note for design:** the ISS Reaction Self Test uses a 2–5 s gap between targets, while the original PVT-B uses 1–4 s. Pick one and keep it fixed.

## R3: blood pressure

Status: **verified, one correction**

| Claim | Verdict | Source checked |
|---|---|---|
| Categories: normal < 120 and < 80; elevated 120–129 and < 80; stage 1 130–139 or 80–89; stage 2 ≥ 140 or ≥ 90. The 2025 guideline keeps the 2017 categories. | confirmed | 2025 AHA/ACC guideline summaries ([JournalFeed](https://journalfeed.org/article-a-day/2025/new-2025-aha-acc-hypertension-guidelines/), [EurekAlert](https://www.eurekalert.org/news-releases/1094543)) |
| > 180/120 = "severe hypertension" (was "hypertensive urgency") | confirmed | same |
| At > 180/120, "wait at least 1 minute and retest" | **corrected**: AHA patient guidance says wait **about 5 minutes**, then retest. With symptoms (chest pain, shortness of breath, back pain, numbness or weakness, vision change, trouble speaking), act at once; don't wait. | [AHA: When to call 911](https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/hypertensive-crisis-when-you-should-call-911-for-high-blood-pressure) (via search result; the page blocks direct fetch) |
| Home steps: 30 min without caffeine, smoking or exercise; empty bladder; 5 min seated rest; 2 readings 1 min apart | unconfirmed (heart.org blocks fetch). These are the widely published AHA steps; ESC says 1–2 min apart. | — |
| ISS months 3–6: 24-h SBP −8 ± 2, DBP −9 ± 2 mmHg, HR unchanged (Norsk 2015) | see the R6 section (Argon cross-check) | |

## R4: emergencies

Status: **verified, two corrections**

All checked against the 2024 AHA / American Red Cross Guidelines for First Aid (Circulation 2024;150:e519–e579, doi [10.1161/CIR.0000000000001281](https://doi.org/10.1161/CIR.0000000000001281)), full text.

| Claim | Verdict | What the guideline says |
|---|---|---|
| Burns: cool with clean cool running water for 5–20 min | confirmed | "Thermal burns should be cooled immediately, preferably with clean running water." It may be reasonable to cool for 5 to 20 minutes. |
| Chemical in the eye: flush for ≥ 20 min | **corrected → 15 minutes** | Irrigate with a copious amount of tap water for 15 minutes, unless local guidelines say otherwise. Don't let the chemical reach the other eye. |
| Tourniquet "2 in above the wound" | **corrected** | The guideline's "2 in" is the minimum **width** of an improvised tourniquet. On placement it says to apply and tighten until bleeding stops, and that a commercial tourniquet is better. Screen text: "Apply tourniquet above the wound, not on a joint. Tighten until bleeding stops." |
| Near-fainting: lie down; cross legs and tense leg, belly and buttock muscles | confirmed | Physical counterpressure manoeuvres (Table 9), done lying down or, if necessary, standing |
| Chest pain: chew aspirin 162–325 mg if alert and not allergic | confirmed (chest pain is not in the MVP set) | |
| Anaphylaxis: epinephrine; 7–18% of people need a second dose | confirmed | |

## R1, R5, R6

Cross-checked by an Antigravity read-only worker. It was asked to use Gemini 4 Argon but ran on its fallback, Gemini 3.8 Flash. It opened every source itself. Result: 15 of 16 claims confirmed, 1 partly confirmed. Claude then re-checked the two claims the design leans on most (marked ✔︎ below).

| # | Claim | Verdict | Note |
|---|---|---|---|
| 1 | OSD-569: Inspiration4 whole blood, open access, timepoints L-92 … R+194 | **confirmed ✔︎** (worker said partly) | Claude listed the files through the OSDR API: all 11 are open, including `LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv`. The worker's caveat is that raw individual sequencing reads are controlled; we don't need those. |
| 2 | OSD-575: Inspiration4 serum, metabolic panel + cytokines, open (CC0) | confirmed | |
| 3 | HRP risk IDs: 99 cognitive, 100 sleep, 179 cardiovascular, 95 medical conditions, 175 Earth-independent ops | confirmed | |
| 4 | OCHMO-STD-100.1A: hypertension ≥ 140/90 sustained; tachycardia > 130; awake bradycardia < 30 | confirmed | |
| 5 | NASA-STD-3001 V1: 8.5 h sleep period [6001]; career radiation < 600 mSv [4030] | confirmed | |
| 6 | NASA-STD-3001 V2 [6004]: 1-h average ppCO2 ≤ 3 mmHg | confirmed | |
| 7 | Norsk 2015: ISS days 85–192, 24-h SBP 129→121, DBP 85→76, HR unchanged | **confirmed ✔︎** | 8 male astronauts; HR about 63–64 bpm both times |
| 8 | Fu 2019: 24-h SBP 120→106 in flight, DBP unchanged | confirmed | |
| 9 | Barger 2014: ISS sleep 6.09 ± 0.67 h | confirmed | |
| 10 | Quer 2020: resting HR 65.5 ± 7.7 bpm | confirmed | |
| 11 | Zwart 2014: body mass −2.8% (SLAMMD) to −4.4% (BMMD) in first 30 days, then plateau | confirmed | |
| 12 | Zeitlin 2013: cruise GCR 1.84 ± 0.33 mSv/day; round trip ≈ 0.66 Sv | confirmed | |
| 13 | Mishra 2020: illness raises resting HR by a median of 7 bpm, about 4 days before symptoms | confirmed | |
| 14 | Law 2014: each +1 mmHg CO2 doubles headache odds; keep 7-day average < 2.5 mmHg | confirmed | |
| 15 | Mars one-way delay 3–22 min; conjunction blackout about 2 weeks every ~26 months | confirmed | |
| 16 | Moon one-way delay ~1.3 s | confirmed | |

**Corrections inside R6:** R6 finding #1 says PVT-B uses a "0–4 s" gap between targets. The paper says **1–4 s** (see R2 above).

**Not checked, and not needed for code:**
- R5's escalation and EIMO material is context for the action-card wording, not numbers in code.
- R6's calibration dataset list (PhysioNet, OpenNeuro) gets checked if we actually use one.

## Summary

| R | Status | Corrections |
|---|---|---|
| R1 NASA data | verified | none. OSD-569 / OSD-575 CSVs are open and can be used as real NASA data. |
| R2 reaction test | verified | none |
| R3 blood pressure | verified | re-test after **~5 min** at > 180/120 (not 1 min) |
| R4 emergencies | verified | eye flush **15 min**; tourniquet "2 in" is width, not placement |
| R5 environments | verified (delays) | none |
| R6 simulation | verified | PVT-B gap 1–4 s, not 0–4 s |
| R8 crewmate emergency | queued | brief written, not run yet |
