# Brief R9: radiation dose data for the tracker

First read `research/briefs/00-RULES.md` and follow it.
**Your output file:** `research/R9-radiation-data.md`. Write nothing else.

## Goal

The app will show an estimated radiation dose for Sara on day 120 of a Mars transit, and for other environments (ISS, Moon, Mars surface), against NASA's career limit. We want to compute it from **real NASA measurements**, preferably the Radiation Assessment Detector (RAD) on the Curiosity rover (Mars Science Laboratory), which measured dose during the cruise to Mars and on the surface.

Already verified in `research/CHECKS.md` (do not redo, but cite if relevant): career limit < 600 mSv (NASA-STD-3001 V1 [4030]); Zeitlin et al. 2013 cruise GCR dose equivalent 1.84 ± 0.33 mSv/day.

## Questions

1. **RAD cruise data files.** Where exactly is the MSL RAD cruise-phase data published (NASA Planetary Data System, PDS Planetary Plasma Interactions node, or elsewhere)?
   - Give the dataset or bundle ID, the exact file URL(s), file format, size, licence or terms, and the columns that give dose rate (and its units, e.g. µGy/day, and whether tissue-equivalent).
   - Is dose *equivalent* (Sv) given, or only absorbed dose (Gy) plus quality factor? If only Gy, which published quality factor did the RAD team use?
2. **RAD surface data.** Same for Mars surface dose (Hassler et al. 2014, Science): published daily dose equivalent on the surface, and the data files if public.
3. **Solar particle events.** Does the cruise data include SPE days? How much did they add to the cruise total?
4. **Other environments.** Published daily dose (or per-mission dose with duration) for: ISS crew; lunar surface (for example Chang'e 4 LND, Zhang et al. 2020, or NASA sources); lunar orbit or Artemis I measurements (for example Artemis I MARE/Helga & Zohar, or Orion crew-area dosimetry). Prefer NASA sources.
5. **Exact limit wording.** The NASA-STD-3001 V1 [4030] requirement text for the career effective dose limit, with section number.
6. **Recommendation.** Which file or files should the app ship (unmodified, in `data/nasa/rad/`), and how to turn them into a daily rate per environment. If no clean public file exists, say so plainly; the fallback is the published average.

Keep downloads out of the repo: give URLs and sizes only.
