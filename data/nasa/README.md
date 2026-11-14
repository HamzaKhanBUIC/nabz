# Real NASA data

Files here are copied from NASA unmodified. Don't edit them.

| File | Source | Licence | Fetched |
|---|---|---|---|
| `LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv` | NASA Open Science Data Repository, study [OSD-569](https://osdr.nasa.gov/bio/repo/data/studies/OSD-569) (SpaceX Inspiration4, whole blood) | Open access | 2026-11-14 |

## What it contains

- 4 crew members (`C001`–`C004`), 7 timepoints each: `L-92`, `L-44`, `L-3` (days before launch) and `R+1`, `R+45`, `R+82`, `R+194` (days after return).
- 20 blood-count measurements per sample (hematocrit, hemoglobin, white cells, platelets and others). Each has a value and that lab's reference range (`*_range_min`, `*_range_max`).
- 28 rows including the header, 61 columns. The `Sample Name` looks like `C001_whole-blood_L-3_cbc`.

## What it does not contain

No reaction times, blood pressure, sleep or heart rate, and nothing measured daily or in flight (the flight lasted 3 days). The app's daily signals are simulated; see `data/README.md`.

## How we use it

The same baseline engine that scores Sara's simulated check-ins runs on these real values (feature F10): each crew member's pre-launch samples form a personal baseline, and the post-return samples are compared with it and with the lab's reference range.
