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

/** research/CHECKS.md (PVT-B / 03-data-model.md): 30 s no-response timeout. */
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

/** research/CHECKS.md (personal baseline reaction drop): action cutoff z <= -1.5. */
export const Z_ACT = -1.5;

/** design choice (docs/blueprint/03-data-model.md, M4): two-sided |z| >= 1.5 gives BP watch. */
export const BP_Z_WATCH = 1.5;

/** design choice (docs/blueprint/03-data-model.md, M3): consecutive act days for persistence. */
export const PERSISTENT_ACT_DAYS = 3;

/** research/CHECKS.md (Barger et al. 2014 / short sleep threshold): <= 6 hours. */
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
