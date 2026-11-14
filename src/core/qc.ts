import type { CheckinInput, Trial } from "../schemas";
import {
  PVT_ISI_MAX_MS,
  PVT_ISI_MIN_MS,
  PVT_NO_RESPONSE_TIMEOUT_MS,
  QC_ISI_TOLERANCE_MS,
  QC_MAX_DURATION_MS,
  QC_MIN_DURATION_MS,
  QC_MIN_MEDIAN_RT_MS,
  QC_MIN_STIMULI,
} from "./constants";
import { scorePvt } from "./pvt";

export type QcFlag =
  | "too_few_stimuli"
  | "duration_out_of_range"
  | "isi_out_of_range"
  | "implausibly_fast";

function extractTrials(input: Pick<CheckinInput, "trials"> | readonly Trial[]): readonly Trial[] {
  return Array.isArray(input) ? input : (input as Pick<CheckinInput, "trials">).trials;
}

/**
 * Computes total session duration as the sum of every trial's ISI plus
 * stimulus response delay (0 for early taps; timeout ms for null RT).
 */
export function computeSessionDurationMs(trials: readonly Trial[]): number {
  let total = 0;
  for (const trial of trials) {
    total += trial.isiMs;
    if (!trial.early) {
      total += trial.rtMs ?? PVT_NO_RESPONSE_TIMEOUT_MS;
    }
  }
  return total;
}

/**
 * Checks a PVT-B session against quality-control bounds per M1.
 * Flagged sessions remain recorded but are excluded from personal baselines.
 */
export function checkSession(input: Pick<CheckinInput, "trials"> | readonly Trial[]): QcFlag[] {
  const trials = extractTrials(input);
  const metrics = scorePvt(trials);
  const flags: QcFlag[] = [];

  if (metrics.stimuli < QC_MIN_STIMULI) {
    flags.push("too_few_stimuli");
  }

  const totalDurationMs = computeSessionDurationMs(trials);
  if (totalDurationMs < QC_MIN_DURATION_MS || totalDurationMs > QC_MAX_DURATION_MS) {
    flags.push("duration_out_of_range");
  }

  const isiLow = PVT_ISI_MIN_MS - QC_ISI_TOLERANCE_MS;
  const isiHigh = PVT_ISI_MAX_MS + QC_ISI_TOLERANCE_MS;
  if (trials.some((t) => t.isiMs < isiLow || t.isiMs > isiHigh)) {
    flags.push("isi_out_of_range");
  }

  if (metrics.medianRtMs !== null && metrics.medianRtMs < QC_MIN_MEDIAN_RT_MS) {
    flags.push("implausibly_fast");
  }

  return flags;
}
