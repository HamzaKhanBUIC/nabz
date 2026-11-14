# Rules for every research agent (read this first)

## The project in 5 lines

- NASA Space Apps 2026, challenge "Create Health Monitoring Software for Astronauts on Space Missions".
- User: Sara, mission commander, day 120 of the trip to Mars. Earth can take up to 40 minutes to reply.
- The app: a fast, private daily check-in that compares her to her own normal and guides her through measurements, health routines and emergencies, offline.
- Must features: "tap when green" reaction check-in, personal normal zone chart, action card (what changed / why it matters / what to do), guided blood pressure measurement, first-person emergency mode.
- It supports decisions; it is not a diagnosis. Demo data is simulated, but based on NASA sources.

More context: `HANDOFF.md` in the project root.

## Rules

1. **Write only your own output file** (named in your brief). Do not create, edit or delete any other file.
2. **Every number needs a source**: title, URL, and where in the source (page, table, section). No source → put it under "Not verified".
3. **Prefer primary sources**: nasa.gov, NASA Technical Reports Server (ntrs.nasa.gov), NASA OSDR (osdr.nasa.gov), NASA HRP pages, NASA-STD-3001, peer-reviewed papers (PubMed / journals), and official medical guidelines (AHA, ESC, WHO, Red Cross).
4. **Never invent** IDs, dataset numbers, values or quotes. "I couldn't find it" is a good answer.
5. Keep quotes short (under 15 words). Summarise in your own words.
6. Proposals for the app go in their own section and are labelled as proposals. Do not present them as decisions.

## Output format (use exactly this)

```
# R<n>: <topic>

## Short answer
3–6 bullets answering the brief's questions.

## Findings
| # | Claim or value | Source (title + URL) | Where in source | Confidence (high/med/low) |
|---|---|---|---|---|

## What this means for the app (proposal)
Bullets.

## Not verified / open questions
Bullets: anything you could not confirm, and why.
```
