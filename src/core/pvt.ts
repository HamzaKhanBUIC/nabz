import type { Protocol, PvtMetrics, Trial } from "../schemas";
import {
  PROTOCOL_ID,
  PVT_DURATION_MS,
  PVT_FALSE_START_MS,
  PVT_FEEDBACK_MS,
  PVT_ISI_MAX_MS,
  PVT_ISI_MIN_MS,
  PVT_LAPSE_MS,
  PVT_NO_RESPONSE_TIMEOUT_MS,
} from "./constants";

const DEFAULT_PROTOCOL: Protocol = {
  protocolId: PROTOCOL_ID,
  durationMs: PVT_DURATION_MS,
  isiMinMs: PVT_ISI_MIN_MS,
  isiMaxMs: PVT_ISI_MAX_MS,
  feedbackMs: PVT_FEEDBACK_MS,
  lapseMs: PVT_LAPSE_MS,
  falseStartMs: PVT_FALSE_START_MS,
  noResponseTimeoutMs: PVT_NO_RESPONSE_TIMEOUT_MS,
};

/** Returns the standard 3-minute PVT-B protocol configuration for clients. */
export function getProtocol(): Protocol {
  return { ...DEFAULT_PROTOCOL };
}

/**
 * Returns true when a trial counts as a false start: either marked `early`
 * before stimulus onset or tapped faster than `PVT_FALSE_START_MS` (< 100 ms).
 */
export function isFalseStartTrial(trial: Trial): boolean {
  return trial.early || (trial.rtMs !== null && trial.rtMs < PVT_FALSE_START_MS);
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function medianSorted(sorted: readonly number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Scores a raw array of PVT-B trials into summary reaction metrics per M1.
 * No-response timeouts (`rtMs === null` on non-early stimuli) count as lapses
 * and contribute `1000 / PVT_NO_RESPONSE_TIMEOUT_MS` to `meanSpeed`.
 */
export function scorePvt(trials: readonly Trial[]): PvtMetrics {
  let falseStarts = 0;
  let stimuli = 0;
  let lapses = 0;
  let speedSum = 0;
  const validRts: number[] = [];

  for (const trial of trials) {
    if (isFalseStartTrial(trial)) {
      falseStarts += 1;
      continue;
    }

    stimuli += 1;
    if (trial.rtMs === null) {
      lapses += 1;
      speedSum += 1000 / PVT_NO_RESPONSE_TIMEOUT_MS;
    } else {
      validRts.push(trial.rtMs);
      if (trial.rtMs >= PVT_LAPSE_MS) {
        lapses += 1;
      }
      speedSum += 1000 / trial.rtMs;
    }
  }

  validRts.sort((a, b) => a - b);

  const meanSpeed = stimuli === 0 ? 0 : roundTo(speedSum / stimuli, 4);
  const medianRtMs = medianSorted(validRts);
  const denominator = stimuli + falseStarts;
  const performanceScore =
    denominator === 0 ? 0 : roundTo(100 * (1 - (lapses + falseStarts) / denominator), 2);

  return {
    stimuli,
    validResponses: validRts.length,
    lapses,
    falseStarts,
    meanSpeed,
    medianRtMs,
    performanceScore,
  };
}
