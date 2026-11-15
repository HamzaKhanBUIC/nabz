/**
 * Verified health thresholds, protocol defaults, and design choices.
 * Health thresholds cite `research/CHECKS.md`; ungrounded operational
 * defaults are marked `design choice` and listed in `docs/blueprint/03-data-model.md`.
 */

/** Protocol identifier matching `src/schemas/checkin.ts`. */
export const PROTOCOL_ID = "pvt-b-3min" as const;

/** research/CHECKS.md (Basner et al. 2011 PVT-B): 3-minute session duration. */
export const PVT_DURATION_MS = 180_000;

/** research/CHECKS.md (Basner et al. 2011 PVT-B): 1-4 s ISI, feedback included. */
export const PVT_ISI_MIN_MS = 1_000;

/** research/CHECKS.md (Basner et al. 2011 PVT-B): 1-4 s ISI, feedback included. */
export const PVT_ISI_MAX_MS = 4_000;

/** research/CHECKS.md (Basner et al. 2011 PVT-B): 1 s visual feedback included in ISI. */
export const PVT_FEEDBACK_MS = 1_000;

/** research/CHECKS.md (Basner et al. 2011 PVT-B): lapse threshold >= 355 ms. */
export const PVT_LAPSE_MS = 355;

/** research/CHECKS.md (Basner et al. 2011 PVT-B): false start < 100 ms. */
export const PVT_FALSE_START_MS = 100;

/** design choice (docs/blueprint/03-data-model.md): 30 s no-response timeout. Used by the 10-min PVT; not re-checked for PVT-B. */
export const PVT_NO_RESPONSE_TIMEOUT_MS = 30_000;

/** design choice (docs/blueprint/03-data-model.md, M1): minimum valid stimuli per session. */
export const QC_MIN_STIMULI = 20;

/** design choice (docs/blueprint/03-data-model.md, M1): minimum valid session duration. */
export const QC_MIN_DURATION_MS = 150_000;

/** design choice (docs/blueprint/03-data-model.md, M1): maximum valid session duration. */
export const QC_MAX_DURATION_MS = 210_000;

/** design choice (docs/blueprint/03-data-model.md, M1): tolerance around ISI bounds. */
export const QC_ISI_TOLERANCE_MS = 50;

/** design choice (docs/blueprint/03-data-model.md, M1): median RT floor for valid taps. */
export const QC_MIN_MEDIAN_RT_MS = 120;

/** design choice (docs/blueprint/03-data-model.md, M2): rolling baseline window length. */
export const BASELINE_WINDOW_SESSIONS = 14;

/** design choice (docs/blueprint/03-data-model.md, M2): minimum sessions to calibrate baseline. */
export const BASELINE_MIN_SESSIONS = 5;

/** design choice (docs/blueprint/03-data-model.md, M2): watch z-score cutoff for lower_is_worse. */
export const Z_WATCH = -1.0;

/** research/CHECKS.md R2 addendum (Cognition on ISS, PMC11614644): a score at or below -1.5 SD from the person's own baseline counts as low. */
export const Z_ACT = -1.5;

/** design choice (docs/blueprint/03-data-model.md, M4): two-sided |z| >= 1.5 gives BP watch. */
export const BP_Z_WATCH = 1.5;

/** design choice (docs/blueprint/03-data-model.md, M3): consecutive act days for persistence. */
export const PERSISTENT_ACT_DAYS = 3;

/** research/CHECKS.md R2 addendum (Jones et al. 2022, PMC8919197): PVT-B speed is slower after sleep of <= 6 hours. */
export const SHORT_SLEEP_HOURS = 6;

/** research/CHECKS.md (AHA/ACC BP classification): severe systolic > 180 mmHg. */
export const BP_SEVERE_SYS_OVER = 180;

/** research/CHECKS.md (AHA/ACC BP classification): severe diastolic > 120 mmHg. */
export const BP_SEVERE_DIA_OVER = 120;

/** research/CHECKS.md (AHA/ACC BP classification): Stage 2 systolic >= 140 mmHg. */
export const BP_STAGE2_SYS_MIN = 140;

/** research/CHECKS.md (AHA/ACC BP classification): Stage 2 diastolic >= 90 mmHg. */
export const BP_STAGE2_DIA_MIN = 90;

/** research/CHECKS.md (AHA/ACC BP classification): Stage 1 systolic lower bound 130 mmHg. */
export const BP_STAGE1_SYS_MIN = 130;

/** research/CHECKS.md (AHA/ACC BP classification): Stage 1 systolic upper bound 139 mmHg. */
export const BP_STAGE1_SYS_MAX = 139;

/** research/CHECKS.md (AHA/ACC BP classification): Stage 1 diastolic lower bound 80 mmHg. */
export const BP_STAGE1_DIA_MIN = 80;

/** research/CHECKS.md (AHA/ACC BP classification): Stage 1 diastolic upper bound 89 mmHg. */
export const BP_STAGE1_DIA_MAX = 89;

/** research/CHECKS.md (AHA/ACC BP classification): Elevated systolic lower bound 120 mmHg. */
export const BP_ELEVATED_SYS_MIN = 120;

/** research/CHECKS.md (AHA/ACC BP classification): Elevated systolic upper bound 129 mmHg. */
export const BP_ELEVATED_SYS_MAX = 129;

/** research/CHECKS.md (AHA/ACC BP classification): Normal systolic < 120 mmHg. */
export const BP_NORMAL_SYS_UNDER = 120;

/** research/CHECKS.md (AHA/ACC BP classification): Normal diastolic < 80 mmHg. */
export const BP_NORMAL_DIA_UNDER = 80;

/** research/CHECKS.md (hypotension threshold): low systolic < 90 mmHg. */
export const BP_LOW_SYS_UNDER = 90;

/** research/CHECKS.md (hypotension threshold): low diastolic < 60 mmHg. */
export const BP_LOW_DIA_UNDER = 60;

/** research/CHECKS.md (severe BP guidance): 5-minute seated retest (300 s). */
export const BP_RETEST_SECONDS = 300;

/** research/CHECKS.md (severe BP guidance): 5 minutes for display placeholder. */
export const BP_RETEST_MINUTES = 5;

/** design choice (docs/blueprint/03-data-model.md, M4): distinct days >= 140/90 for sustained high. */
export const BP_SUSTAINED_DAYS = 3;

/** research/CHECKS.md (Mars-Earth distance delay): minimum 3 minutes one-way. */
export const MARS_DELAY_MIN_MINUTES = 3;

/** research/CHECKS.md (Mars-Earth distance delay): maximum 22 minutes one-way. */
export const MARS_DELAY_MAX_MINUTES = 22;

/** Mandatory card footer from docs/blueprint/03-data-model.md and src/schemas/common.ts. */
export const CARD_DISCLAIMER = "Decision support, not a diagnosis." as const;

/** research/CHECKS.md (AHA severe hypertension red-flag symptoms). */
export const SEVERE_BP_SYMPTOM_IDS = [
  "chest-pain",
  "shortness-of-breath",
  "back-pain",
  "numbness-or-weakness",
  "vision-change",
  "trouble-speaking",
] as const;

/** research/CHECKS.md (NHLBI symptomatic hypotension symptoms). */
export const LOW_BP_SYMPTOM_IDS = [
  "confusion",
  "dizziness-or-lightheadedness",
  "fainting",
  "cold-sweaty-skin",
  "rapid-breathing",
  "weak-rapid-pulse",
] as const;

/** research/CHECKS.md R8 (DGLRM/ESAM & AHA 2025): 100-120 compressions/min; midpoint for metronome. */
export const CPR_METRONOME_BPM = 110;

/** design choice (docs/blueprint/03-data-model.md, S05): daily morning PVT check-in reminder hour/minute UTC. */
export const DEFAULT_CHECKIN_REMINDER_UTC = "08:00" as const;

/** design choice (docs/blueprint/03-data-model.md, S05): periodic blood pressure reminder hour/minute UTC. */
export const DEFAULT_BP_REMINDER_UTC = "08:30" as const;

/** design choice (docs/blueprint/03-data-model.md, S05): periodic blood pressure interval in mission days. */
export const DEFAULT_BP_INTERVAL_DAYS = 3;

/** Fixed abstention reply for out-of-scope coach queries (docs/features/S-should-slots.md). */
export const COACH_NO_SOURCE_REPLY =
  "I only answer from verified mission medical cards and don't have a verified source on that." as const;

/** Fixed urgent banner label when red-flag symptoms appear in a coach query (docs/features/S-should-slots.md). */
export const COACH_URGENT_BANNER_LABEL =
  "Alert a crewmate or medical officer now — do not wait for Earth." as const;

/** Deterministic red-flag symptom terms scanned before any coach phrasing (research/CHECKS.md R3/R4/R8). */
export const COACH_RED_FLAG_TERMS = [
  "chest pain",
  "can't breathe",
  "cannot breathe",
  "trouble breathing",
  "shortness of breath",
  "faint",
  "fainting",
  "passed out",
  "collapsed",
  "unconscious",
  "unresponsive",
  "seizure",
  "convulsion",
  "numbness",
  "weakness",
  "vision change",
  "vision loss",
  "trouble speaking",
  "slurred speech",
  "back pain",
  "spurting blood",
  "severe bleeding",
  "anaphylaxis",
  "swelling throat",
] as const;

/** research/CHECKS.md R1/R5 row 5: NASA-STD-3001 V1 [4030], career effective dose < 600 mSv. */
export const CAREER_LIMIT_MSV = 600;

/**
 * research/CHECKS.md R9 row 1: George et al. 2024 (Nature 634:48-52) Table 2, average dose
 * equivalent rate in mSv/day for the December 2022 time frame. One source, one solar period,
 * so environments compare fairly.
 */
export const RADIATION_RATE_MSV_PER_DAY = {
  iss: 0.68,
  "lunar-surface": 0.81,
  "mars-transit": 1.58,
  "mars-surface": 0.65,
} as const;

/** research/CHECKS.md R1/R5 row 12: Zeitlin et al. 2013, Curiosity's measured cruise GCR dose, 1.84 mSv/day (2011-12). */
export const CURIOSITY_CRUISE_MSV_PER_DAY = 1.84;

/** design choice (docs/blueprint/03-data-model.md): card levels that show the environment's escalation line. */
export const ESCALATION_LEVELS = ["act", "urgent"] as const;

/** research/CHECKS.md R12 (MedlinePlus Pulse; NHLBI): normal adult resting heart rate starts at 60 bpm. */
export const HR_REST_NORMAL_MIN = 60;

/** research/CHECKS.md R12 (MedlinePlus Pulse; NHLBI): normal adult resting heart rate ends at 100 bpm. */
export const HR_REST_NORMAL_MAX = 100;

/** research/CHECKS.md R12 (MedlinePlus Pulse oximetry): normal oxygen saturation is 95% to 100%. */
export const SPO2_NORMAL_MIN = 95;

/** research/CHECKS.md R12 (MedlinePlus Pulse oximetry): contact a provider at 92% or lower. */
export const SPO2_CONTACT_AT_OR_BELOW = 92;

/** research/CHECKS.md R12 (MedlinePlus Pulse oximetry): seek immediate medical attention at 88% or lower. */
export const SPO2_URGENT_AT_OR_BELOW = 88;
