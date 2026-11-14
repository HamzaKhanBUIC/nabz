# Brief R1: NASA data sources

First read `research/briefs/00-RULES.md` and follow it.
**Your output file:** `research/R1-nasa-data.md`. Write nothing else.

## Goal

Find the NASA data and documents our app should be built on, and say what each gives us. Judges check whether NASA data is a core part of the project, not decoration.

## Questions

1. **Challenge resources.** List every resource on the challenge page's Resources tab: name, URL, what it contains.
   Page: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
   Tip: the page renders in the browser. A plain fetch may return an empty shell or a certificate error. Use a real browser, or read the `self.__next_f` data in the page HTML.
2. **NASA Human Research Program (HRP).** Which HRP hazards and named risks match our Must features?
   - Reaction check-in: cognitive and behavioural performance, sleep, fatigue.
   - Blood pressure: cardiovascular, fluid shift, orthostatic intolerance.
   - Emergency mode: medical conditions in flight.
   Give the official risk names and links.
3. **NASA OSDR (osdr.nasa.gov).** Which datasets hold human physiology from spaceflight (e.g. Inspiration4, the Twins Study, others)? For each give:
   - the OSD number
   - what was measured
   - file format
   - open or controlled access
   - whether it has per-day values over time
4. **NASA-STD-3001 (Volumes 1 and 2).** Which numeric limits or requirements apply to blood pressure, heart rate, sleep, cognitive testing or medical care on long missions? Give the requirement IDs.
5. **Recommendation.** Which 1–3 NASA sources should be the core of our data? How would each one shape the simulated crew data: ranges, drift over the mission, events?
