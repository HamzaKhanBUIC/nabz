# Brief R6: simulation design for sample crew data

First read `research/briefs/00-RULES.md` and follow it.
**Your output file:** `research/R6-simulation.md`. Write nothing else. No code yet.

## Goal

Design realistic simulated daily data for a crew of 4 on a Mars transit, up to and past day 120. Every range and drift must come from a source, so the data can be labelled "simulated, based on NASA data".

## Questions

1. **Signals.** For each signal, give:
   - a typical baseline value for healthy astronaut-age adults
   - day-to-day spread (standard deviation)
   - time-of-day effects
   - how it drifts over a long spaceflight, especially by months 3–6

   Signals:
   - reaction test: mean RT, lapses
   - blood pressure: systolic and diastolic
   - resting heart rate
   - sleep duration and quality
   - self-rated mood, stress and fatigue
   - body mass
   - daily radiation dose in deep space
2. **Events to inject.** Sourced effect sizes and typical length for:
   - a week of short sleep
   - illness
   - a solar particle event
   - high workload or stress before a key task
   - a CO2 rise in the cabin
3. **Calibration data.** Public datasets that could check our ranges, e.g. PhysioNet, OSDR, sleep or PVT studies. Give links and what each contains.
4. **Method.** How do others simulate realistic personal time series? Cover baseline plus noise, slow drift, autocorrelation and event shapes. Name any open-source generators worth copying.
