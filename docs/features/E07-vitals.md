# E07: heart rate and oxygen level with blood pressure

Asked for by the team on 2026-11-15. Sources: `research/CHECKS.md` R12.

## What it does
- The blood pressure flow already records an optional pulse per reading. The averaged pulse is now checked as a resting heart rate.
- One optional field, "Oxygen level, SpO2 (%)", is added to the readings step, with the FDA's reading tips next to it.
- `POST /api/measurements/bp` accepts `spo2` (whole number, 50 to 100) and returns `vitals`: one entry per measured value with `code`, `value`, `unit`, `status` (level, label, iconKey), `message` and `sources`.
- The result screen shows a "Pulse and oxygen" panel under the blood pressure card.

## Rules (src/core/vitals.ts, constants in src/core/constants.ts)
| Value | Level | Label | Source |
|---|---|---|---|
| Heart rate 60 to 100 bpm | in_zone | Usual resting range | MedlinePlus Pulse; NHLBI |
| Heart rate under 60 or over 100 | watch | Below / Above the usual resting range | same; no source gives an urgent number, so there is no urgent level |
| SpO2 95 to 100% | in_zone | Normal | MedlinePlus Pulse oximetry; FDA |
| SpO2 93 to 94% | watch | Slightly below normal | design choice: between the 95% normal and the 92% contact line |
| SpO2 89 to 92% | act | Contact the medical officer | MedlinePlus: contact at 92% or lower |
| SpO2 88% or lower | urgent | Get help now | MedlinePlus: immediate attention at 88% or lower |

## Limits
- These checks never change the blood pressure category or card. Rules decide; no AI.
- Cut-offs are for sea-level air. A lower-pressure exploration cabin may lower SpO2 (R12, unconfirmed), so trends against the person's own readings matter more than one number.
- Measurements saved before E07 have no `vitals` field; the schema keeps it optional.
