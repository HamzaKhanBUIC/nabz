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

**Note for design:** the ISS Reaction Self Test uses a 2–5 s gap between targets, while the original PVT-B uses 1–4 s. **Decided (Nov 14): 1–4 s.**

**Addendum (Nov 14, checked for the architecture):**

| Claim | Verdict | Source checked |
|---|---|---|
| A score at or below −1.5 SD from the person's own pre-flight baseline counts as low; 20.2% of flight and post-flight PVT speed scores were low | confirmed | Cognition on ISS, [PMC11614644](https://pmc.ncbi.nlm.nih.gov/articles/PMC11614644/) |
| PVT-B response speed is significantly slower after sleep of ≤ 6 h (34.9% of nights; F = 40.76, p < 0.0001) | confirmed | Jones et al. 2022, [PMC8919197](https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197/). This paper counts a false start at RT < 130 ms; we keep Basner's < 100 ms. |
| No-response timeout of 30 s | not checked for PVT-B (R2 #6 gives it for the 10-min test). Treated as a design choice. | — |

## R3: blood pressure

Status: **verified, one correction**

| Claim | Verdict | Source checked |
|---|---|---|
| Categories: normal < 120 and < 80; elevated 120–129 and < 80; stage 1 130–139 or 80–89; stage 2 ≥ 140 or ≥ 90. The 2025 guideline keeps the 2017 categories. | confirmed | 2025 AHA/ACC guideline summaries ([JournalFeed](https://journalfeed.org/article-a-day/2025/new-2025-aha-acc-hypertension-guidelines/), [EurekAlert](https://www.eurekalert.org/news-releases/1094543)) |
| > 180/120 = "severe hypertension" (was "hypertensive urgency") | confirmed | same |
| At > 180/120, "wait at least 1 minute and retest" | **corrected**: AHA patient guidance says wait **about 5 minutes**, then retest. With symptoms (chest pain, shortness of breath, back pain, numbness or weakness, vision change, trouble speaking), act at once; don't wait. | [AHA: When to call 911](https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/hypertensive-crisis-when-you-should-call-911-for-high-blood-pressure) (via search result; the page blocks direct fetch) |
| Home steps: 30 min without food, drink, caffeine, smoking, alcohol or exercise; empty bladder; sit with back supported for at least 5 min; feet flat, legs uncrossed; cuff on bare upper arm at chest height; stay silent; at least 2 readings 1–2 min apart | confirmed (Nov 14) | [CDC: Measure your blood pressure](https://www.cdc.gov/high-blood-pressure/measure/index.html). heart.org still blocks fetch. "Anchor yourself" is our microgravity adaptation of "feet flat, back supported", not a sourced step. |
| Low blood pressure is "lower than 90/60 mm Hg"; symptoms include confusion, dizziness or lightheadedness, fainting; shock signs are cold and sweaty skin, rapid breathing, a blue skin tone, a weak and rapid pulse | confirmed (Nov 14) | [NHLBI: Low blood pressure](https://www.nhlbi.nih.gov/health/low-blood-pressure) |
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

## R8: crewmate emergency (Should)

Status: **verified, one correction**

| Claim | Verdict | Source checked |
|---|---|---|
| Space CPR order: start with Evetts-Russomano (ER), switch to reverse bear hug if ER doesn't work; handstand once the patient is strapped to the medical restraint (CMRS) | confirmed (Recs 2–3) | Hinkelbein et al. 2020, DGLRM/ESAM spaceflight CPR guideline, [PMC7607644](https://pmc.ncbi.nlm.nih.gov/articles/PMC7607644/) |
| Defibrillate only when the patient is restrained on an electrically isolated surface | confirmed (Rec 10) | same |
| Start CPR even without a defibrillator | confirmed (Rec 14) | same |
| Airway devices only with ≥ 2 rescuers and the patient restrained; second-generation supraglottic airway if nobody can intubate | confirmed (Recs 6–8) | same |
| Rehnberg 2014: ER 37.4 mm at 105.6/min; handstand 49.3 mm at 91.9/min; reverse bear hug 23.9 mm at 101.3/min | confirmed | PubMed abstract, PMID 25022155 |
| Jay 2003 (on the CMRS): handstand 4.01 cm, side straddle 1.98 cm, waist straddle 3.07 cm | confirmed | PubMed abstract, PMID 14620476 |
| Evetts 2005 (parabolic flight): ER 44.0 mm at 68.3/min | confirmed | PubMed abstract, PMID 15892553 |
| Adult CPR: 100–120/min, ≥ 5 cm (ERC: not more than 6 cm), full recoil. 30:2 if trained and willing, otherwise compressions only. | consistent with 2025 summaries; primary AHA 2025 text not opened (blocked) | AHA 2025 BLS (doi 10.1161/CIR.0000000000001369) via [Resus Council UK 2025](https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines) and training summaries |
| Seizure: don't restrain, nothing in the mouth; escalate if > 5 min or not back to normal in 5–10 min | confirmed | 2024 AHA/Red Cross first-aid guideline (full text) |
| Low blood sugar: oral glucose only if awake and able to swallow | confirmed | same |
| ER screen step "hook and cross ankles behind their shoulders" | **corrected** | Guideline: one leg over the patient's shoulder, the other around the torso, ankles locked in the centre of their back. Screen text: "Wrap your legs around their chest. Lock your ankles behind their back." |

**Design notes:**
- No microgravity method reliably reaches the 50–60 mm Earth target (guideline evidence: handstand 47.4 mm best). The app should coach "push hard and fast" with a 100–120/min metronome and not promise full depth.
- Not checked; only used as context, not screen text:
  - the ISS AED model (LIFEPAK 1000)
  - the "Warn, Gather, Work" toxic-air reference. The DOI cited in R4/R8, `10.82217/...`, looks malformed. The toxic-air steps must say "follow your spacecraft's emergency procedure".

## R7: AI coach and voice (Should / Later)

Status: **verified, one correction.** Nothing here goes into Must code; it feeds the Should design and the pitch.

| Claim | Verdict | Source checked |
|---|---|---|
| Speechmatics real-time: $0.15–0.40/hr, so $500 buys ~1,250–3,333 h | **corrected** | [Speechmatics pricing](https://www.speechmatics.com/pricing). Those are the best-case rates: model-training opt-in (−33%) plus the top annual tier (−25%). **List rates** are Linden 1 $0.30 (promo, was $0.40), Melia 1 $0.40, Standard $0.45, Oak 1 (medical) $0.46, Enhanced $0.80 per hour. At list, $500 buys about **625 h (Enhanced) to ~1,667 h (Linden 1)**, ~1,087 h of Oak 1. Either way, far more than a hackathon needs. |
| 1 credit = $1; Free plan has $100 credit and 2 concurrent real-time sessions | confirmed | same |
| Speechmatics TTS: $0.011 per 1,000 chars after 1M free chars | confirmed | same |
| On-prem / on-device Speechmatics is Enterprise only, not usable on self-serve credits | confirmed | [Speechmatics plans](https://docs.speechmatics.com/administration/plans): "These deployment options are available only on Enterprise." |
| Browser `SpeechRecognition` is not offline-safe (Chrome sends audio to a server) | confirmed | [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition): audio "is sent to a web service for recognition processing, so it won't work offline." `processLocally` exists but support is limited. |
| NASA CMO-DA ("Doc in a Box") OSCE: Llama 3.1 (8B/70B/405B), 3 scenarios, 3 evaluators; ankle 88%, ear 80%, flank 74%; better at diagnosis than treatment | confirmed | NTRS [20250002755](https://ntrs.nasa.gov/citations/20250002755), abstract + slides (PDF text searched). It is a conference talk (AsMA, June 2025) with 3 cases, so call it a preliminary result in the pitch. |
| Qwen3-4B licence Apache 2.0 | confirmed | Hugging Face API, `Qwen/Qwen3-4B` card data |
| RAG over verified documents: hallucinations 0% (GPT-4) / 6% (GPT-3.5) vs ~40% with no retrieval; RAG bots declined when the source had no answer | confirmed | Nishisako et al., JMIR Cancer 2025, PMID 40934488 (abstract via PubMed). **Trade-off R7 left out:** RAG bots answered only 36–81% of questions. Expect the coach to say "I don't have a verified source on that" often. |

**Notes:**
- R7 cites this study as PMC10365615. That PMC ID is a different paper (GPT on the Japanese licensing exam). Cite PMIDs from R7, not its PMC IDs.
- Not checked: model file sizes and VRAM figures, Vosk / whisper.cpp / Kokoro / Piper sizes and licences, the voice-guided-CPR studies (#19), and Speechmatics latency and language counts. Re-check whichever one we actually pick before it goes into the design.
- R7 says Mars is 3–22 min one way, which matches R5. The "40 minutes" in the problem statement is the round trip.

## R9: radiation data (for E04)

Status: **verified for the values the tracker needs; one source swap recommended**

| Claim | Verdict | Source checked |
|---|---|---|
| Daily dose equivalent, one source and one solar period (Dec 2022): ISS 0.68, lunar surface 0.81, low lunar orbit 1.55, Mars surface 0.65, Mars transit 1.58 mSv/day; Artemis I Orion GCR 0.96–1.24 mSv/day | confirmed (Table 2 caption: "Average dose equivalent rate … for the December 2022 time frame for various locations") | George et al. 2024, *Nature* 634:48–52, [PMC11446838](https://pmc.ncbi.nlm.nih.gov/articles/PMC11446838/) |
| Chang'e-4 lunar surface: 1369 μSv/day, ⟨Q⟩ = 4.3 ± 0.7, 13.2 μGy/h in silicon (2019, solar minimum) | confirmed | Zhang et al. 2020, *Sci Adv*, [PMC7518862](https://pmc.ncbi.nlm.nih.gov/articles/PMC7518862/) |
| Mars surface 0.64 mSv/day (Hassler 2014) | **unconfirmed**: abstract has no number, full text paywalled. Use George 2024's 0.65 instead. | [Europe PMC record](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:24324275%20AND%20SRC:MED&resultType=core&format=json) |
| MSL/RAD cruise files on PDS: 218 daily `.TXT` files, `RAD_RDR_2011_340_…C010` to `RAD_RDR_2012_196_…C231`, 17–55 MB each | confirmed (directory listing) | [PDS PPI CRUISE/](https://pds-ppi.igpp.ucla.edu/data/MSL-M-RAD-3-RDR-V1.0/DATA/CRUISE/) |
| Those files give absorbed dose (µGy/h) only, no Sv column | not re-opened (R9 cites the SIS); consistent with RAD papers converting with ⟨Q⟩ | — |
| Cruise SEPs: 5 events, 24.7 mSv total, 19.5 mSv on Mar 7–15 2012 | not checked; needed only if the tracker models solar storms | Guo et al. 2015 (R9 #9) |
| Career limit < 600 mSv [V1 4030]; cruise 1.84 ± 0.33 mSv/day | already confirmed (R1/R5 rows 5 and 12) | |

**Mars transit has two valid numbers.** Zeitlin 2013 measured **1.84** mSv/day during the 2011–12 cruise. George 2024 gives **1.58** for the Dec 2022 solar period, the same period as its other rows. Mixing the two would compare environments across different solar periods. **Recommended:** take every environment's rate from George 2024 Table 2 and show 1.84 as "measured by Curiosity in 2011–12" on the Mars transit card.

**No compact real-data file.** The raw cruise data is about 5.5 GB of absorbed-dose tables, too big to ship. E04 can't run "from raw RAD files" offline as first planned without a heavy preprocessing step. That decision belongs to Hamza (see `docs/features/E-extras.md`).

**Gap:** no rate for Remote Earth (Concordia). R9 didn't cover Earth-surface or high-altitude polar dose.

## R10: environment values (for E06)

Status: **verified, one correction**

| Claim | Verdict | Source checked |
|---|---|---|
| Evacuation: LEO 1.5–36 h with real-time comms and strong resupply; cislunar 72–144 h, near-real-time comms, limited resupply; Mars none, no real-time comms, no resupply | confirmed (slide 11 text extracted from the PDF) | Thompson 2021, [Exploration CMO of the Future](https://ntrs.nasa.gov/api/citations/20210020201/downloads/Exploration%20CMO%20of%20the%20Future_Thompson.pptx.pdf) |
| Mars rovers lack line-of-sight to Earth for about 12 h per day | confirmed (the page says "rovers") | [NASA Mars Relay Network](https://science.nasa.gov/mars/mars-relay-network/) |
| Concordia: "during the nine months of isolation, we cannot be evacuated, even for emergencies" | confirmed | [ESA Concordia blog, 2018](https://blogs.esa.int/concordia/2018/01/18/concordia-hospital-peak-remote-medicine/); [ESA: Outside in Antarctica](https://www.esa.int/media/outside-in-antarctica) ("almost nine months of complete isolation per year") |
| Concordia: "Satellite phones and internet are the only means of communication" | confirmed | [ESA: Concordia communication](https://www.esa.int/media/concordia-communication) |
| Concordia care led by the station doctor **plus** the ESA-sponsored doctor as "24/7 SAR lead" | **corrected**: the ESA-sponsored doctor calls herself "merely an observer for all things medical". Care comes from the station's doctors, who consult teams at home. Screen text: "Alert the station doctor now." | same ESA blog |
| Flight Surgeons "24/7" | not found in R5's sources (R10 flagged it). Don't put "24/7" on screen. | — |
| Moon 4–12 s operational delay, 1/6 g; Mars 0.38 g, sol 24 h 39 min | not re-opened; standard NASA fact-sheet values, display only | R10 #4, #7, #10, #11 |

The escalation lines in R10 are proposals. Each environment's action wording is decided in the E06 design pass. Thresholds never change by environment (ADR 0003).

## R11: hazards and HRP risks (for E03)

Status: **verified; the card mapping is a design choice, not a NASA mapping**

| Claim | Verdict | Source checked |
|---|---|---|
| NASA's five hazards: Space Radiation, Isolation and Confinement, Distance from Earth, Gravity Fields, Hostile/Closed Environments | confirmed | [NASA HRP: 5 Hazards](https://www.nasa.gov/hrp/hazards/) |
| Risk 96 "Risk of Radiation Carcinogenesis", status Active | confirmed | [HRR i=96](https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=96) |
| Risk 97 (acute radiation syndromes from SPEs) merged into the Medical Conditions risk, "IRP Revision L, July 2020" | confirmed; risks 98 → 179 and 102 → 99 follow the same notice pattern but weren't opened | [HRR i=97](https://humanresearchroadmap.nasa.gov/Risks/risk.aspx?i=97) |
| Sleep risk (100) DAG has all five hazards as exposure nodes | confirmed by reading the raw DAG code (the web summariser misread it) | [sleep-risk-dag-code](https://www.nasa.gov/wp-content/uploads/2025/09/sleep-risk-dag-code-sa-07566.txt) |
| Risk IDs 95, 99, 100, 175, 179 | already confirmed (R1/R5 row 3) | |

**Design note:** NASA publishes no card-to-risk mapping, so R11's mapping is our proposal and must be labelled `// design choice`. Most risks touch all five hazards, so tagging a card with every hazard says nothing. E03 should show each card's **primary** hazard only.

## Summary

| R | Status | Corrections |
|---|---|---|
| R1 NASA data | verified | none. OSD-569 / OSD-575 CSVs are open and can be used as real NASA data. |
| R2 reaction test | verified | none. Addendum: −1.5 SD and ≤ 6 h sleep confirmed. |
| R3 blood pressure | verified | re-test after **~5 min** at > 180/120 (not 1 min). Addendum: home steps (CDC) and low BP < 90/60 (NHLBI) confirmed. |
| R4 emergencies | verified | eye flush **15 min**; tourniquet "2 in" is width, not placement |
| R5 environments | verified (delays) | none |
| R6 simulation | verified | PVT-B gap 1–4 s, not 0–4 s |
| R7 AI coach + voice | verified | Speechmatics $0.15–0.40/hr is the best-case discounted rate; list is $0.30–0.80/hr (still 625+ h for $500) |
| R8 crewmate emergency | verified | ER leg position wording; toxic-air steps defer to spacecraft procedure |
| R9 radiation data | verified for the tracker | use George 2024 Table 2 for all environments (Mars transit 1.58 Dec 2022; 1.84 is the 2011–12 measurement); Hassler 0.64 unconfirmed; no shippable raw RAD file; no Remote Earth rate |
| R10 environments | verified | Concordia care is led by the station doctor; the ESA doctor is an observer; no "24/7" Flight Surgeon claim |
| R11 hazards and risks | verified | card mapping is a design choice; show the primary hazard only |
