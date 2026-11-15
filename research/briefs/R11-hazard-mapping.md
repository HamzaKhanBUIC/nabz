# Brief R11: link each action card to NASA's hazards and HRP risks

First read `research/briefs/00-RULES.md` and follow it.
**Your output file:** `research/R11-hazard-mapping.md`. Write nothing else.

## Goal

Every action card in the app will show which of NASA's **5 Hazards of Human Spaceflight** it relates to (Space Radiation, Isolation and Confinement, Distance from Earth, Gravity Fields, Hostile/Closed Environments) and which HRP risk(s). The mapping must come from NASA's own pages, not our guesses.

Already confirmed in `research/CHECKS.md`: HRP risk IDs 99 cognitive, 100 sleep, 179 cardiovascular, 95 medical conditions, 175 Earth-independent operations.

The cards are in `content/cards.json` (read it; do not edit it). They cover: slower reaction after short sleep, reaction below normal, persistent low reaction, blood pressure off normal / above ideal / sustained high / severe / low, retake after a flagged session.

## Questions

1. **Hazard summaries.** For each of the 5 hazards, NASA's own one-line description (summarise in your words, max 20 words, with the URL and section).
2. **Risk to hazard.** For each of risks 99, 100, 179, 95, 175: which hazards does NASA's Human Research Roadmap (or the HRP risk page) link it to? Give the page and section.
3. **Card to risk.** For each card in `content/cards.json`, propose the HRP risk(s) and hazard(s), citing the NASA page that justifies each link. Label this as a proposal.
4. **Radiation.** Which HRP risk IDs cover space radiation (for example carcinogenesis, CNS effects)? This is for the new radiation dose card.
