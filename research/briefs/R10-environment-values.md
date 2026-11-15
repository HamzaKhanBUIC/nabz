# Brief R10: check the environment values before they go into code

First read `research/briefs/00-RULES.md` and follow it.
**Your output file:** `research/R10-environment-values.md`. Write nothing else.

## Goal

The app gets an environment switch: **ISS**, **Moon**, **Mars transit** (default), **Mars surface**, and maybe **Remote Earth**. Each one changes only guidance text: delay to Earth, blackout note, time to definitive medical care, who leads care, gravity and day length. Health thresholds never change.

`research/R5-environments.md` already collected candidate values with sources. Your job is to **re-open each source and confirm or correct** the values below, then research the Remote Earth profile. Only CHECKS-confirmed values may be used in code.

Already confirmed in `research/CHECKS.md` (do not redo): Mars one-way delay 3–22 min and ~2-week conjunction blackout every ~26 months; Moon one-way delay ~1.3 s.

## Questions

1. **Re-check these R5 values** (each: confirmed / corrected / not found, with the exact place in the source):
   - ISS: "less than a one-second delay" (R5 #1); medical evacuation window 1.5–36 h and ≤ 24 h to definitive care (R5 #15); flight surgeons on 24/7 console (R5 #13).
   - Moon: operational one-way delay 4–12 s (R5 #4); far side / south pole visibility gaps (R5 #5); return 72–144 h (R5 #15); gravity 1/6 g (~0.166 g) (R5 #16).
   - Mars: no evacuation capability (R5 #15); surface ~12 h/day without line of sight to Earth (R5 #9); gravity 0.38 g (R5 #16); sol 24 h 39 m / 24.6 h (R5 #18a).
   - Care lead: NASA-STD-3001 Levels of Care, especially Level V "autonomous" care for Mars (R5 #12), and the EIMO definition (R5 #10).
2. **Remote Earth profile.** Pick one well-documented isolated setting on Earth, preferably one NASA uses as a spaceflight analog (for example an Antarctic winter-over station such as Concordia, or NASA's own analogs). Find sourced values for: time to evacuation or definitive care in winter, communication availability, and who provides care on site. If you cannot source it well, say so; the profile will be dropped.
3. **Escalation wording.** For each environment, one short line (≤ 12 words) saying who to contact first when an action card says "act", grounded in the sources above. Label these as proposals.
