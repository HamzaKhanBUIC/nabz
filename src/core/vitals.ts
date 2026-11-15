import type { SourceRef, VitalAssessment } from "../schemas";
import {
  HR_REST_NORMAL_MAX,
  HR_REST_NORMAL_MIN,
  SPO2_CONTACT_AT_OR_BELOW,
  SPO2_NORMAL_MIN,
  SPO2_URGENT_AT_OR_BELOW,
} from "./constants";

/**
 * E07: resting heart rate and SpO2 taken with blood pressure.
 * Absolute, sourced cut-offs only (research/CHECKS.md R12). These checks never change the
 * blood pressure card; they are shown next to it.
 */

const HR_SOURCE_IDS = ["medlineplus-pulse", "nhlbi-heart-beats"];
const SPO2_SOURCE_IDS = ["medlineplus-pulse-oximetry", "fda-pulse-oximeter-basics"];

function pickSources(ids: readonly string[], sources: readonly SourceRef[]): SourceRef[] {
  const picked = ids.map((id) => sources.find((s) => s.id === id));
  if (picked.some((s) => s === undefined)) {
    throw new Error(`Missing E07 source in content/sources.json: ${ids.join(", ")}`);
  }
  return picked as SourceRef[];
}

export function assessHeartRate(bpm: number, sources: readonly SourceRef[]): VitalAssessment {
  const base = { code: "heart-rate" as const, value: bpm, unit: "bpm" as const, sources: pickSources(HR_SOURCE_IDS, sources) };
  if (bpm < HR_REST_NORMAL_MIN) {
    return {
      ...base,
      status: { level: "watch", label: "Below the usual resting range", iconKey: "eye" },
      message:
        "Under 60 beats per minute. This can be normal for well-trained athletes (40 to 60). If your resting rate stays low, or you feel dizzy or faint, tell the crew medical officer.",
    };
  }
  if (bpm > HR_REST_NORMAL_MAX) {
    return {
      ...base,
      status: { level: "watch", label: "Above the usual resting range", iconKey: "eye" },
      message:
        "Over 100 beats per minute. Rest for at least 10 minutes and count again for a full minute. If your resting rate stays high, tell the crew medical officer.",
    };
  }
  return {
    ...base,
    status: { level: "in_zone", label: "Usual resting range", iconKey: "check" },
    message: "Between 60 and 100 beats per minute, the normal adult resting range.",
  };
}

export function assessSpo2(percent: number, sources: readonly SourceRef[]): VitalAssessment {
  const base = { code: "spo2" as const, value: percent, unit: "%" as const, sources: pickSources(SPO2_SOURCE_IDS, sources) };
  if (percent <= SPO2_URGENT_AT_OR_BELOW) {
    return {
      ...base,
      status: { level: "urgent", label: "Get help now", iconKey: "siren" },
      message:
        "88% or lower. Alert a crewmate and the crew medical officer now. Watch for bluish lips or nails, shortness of breath, chest pain or a racing pulse.",
    };
  }
  if (percent <= SPO2_CONTACT_AT_OR_BELOW) {
    return {
      ...base,
      status: { level: "act", label: "Contact the medical officer", iconKey: "alert" },
      message:
        "92% or lower. Warm your hand, keep still and measure again. If it stays at 92% or lower, contact the crew medical officer.",
    };
  }
  if (percent < SPO2_NORMAL_MIN) {
    return {
      ...base,
      status: { level: "watch", label: "Slightly below normal", iconKey: "eye" },
      message:
        "Below the usual 95% to 100%. Readings can be off by 2% to 4%: warm your hand, rest it below heart level, keep still and measure again.",
    };
  }
  return {
    ...base,
    status: { level: "in_zone", label: "Normal", iconKey: "check" },
    message: "Between 95% and 100%, the normal range for most healthy people.",
  };
}

/** Heart rate comes from the averaged cuff pulse; SpO2 is entered once. Either may be missing. */
export function assessVitals(
  pulse: number | undefined,
  spo2: number | undefined,
  sources: readonly SourceRef[],
): VitalAssessment[] {
  const out: VitalAssessment[] = [];
  if (pulse !== undefined) out.push(assessHeartRate(pulse, sources));
  if (spo2 !== undefined) out.push(assessSpo2(spo2, sources));
  return out;
}
