# Brief R5: station / Moon / Mars environment switch

First read `research/briefs/00-RULES.md` and follow it.
**Your output file:** `research/R5-environments.md`. Write nothing else.

## Goal

The challenge asks that the tool can adapt to different settings: a spacecraft, a space station, a base on the Moon. We have not decided whether to build this. Give us the facts so we can decide.

## Questions

1. **Delays.** One-way and round-trip communication delay for:
   - the ISS
   - the Moon (Artemis)
   - Mars: minimum, maximum, and the solar conjunction blackout length
   Also note any known gaps in communication coverage.
2. **Medical support model.** How does medical support change with distance? Cover NASA's "Earth-independent medical operations" (EIMO) and its autonomy levels. Who decides what at each distance?
3. **Escalation.** For each setting, what should a crew member do with a worrying result? Options: call the flight surgeon now, act then report, or decide alone and report later. Use NASA sources.
4. **Other differences.** What else differs between settings that a health check-in should know? For example: evacuation time, gravity level (Moon 1/6 g, Mars 1/3 g), radiation.
5. **Proposal.** The smallest version of a settings switch that is still correct.
