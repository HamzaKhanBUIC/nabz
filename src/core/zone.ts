import type { Baseline, Status, Zone, ZoneResult } from "../schemas";
import { BP_Z_WATCH, Z_ACT, Z_WATCH } from "./constants";

export type ZoneDirection = "lower_is_worse" | "two_sided" | "none";

export interface ClassifyZoneOptions {
  direction: ZoneDirection;
  ready: boolean;
  flagged?: boolean;
}

/**
 * Classifies a raw z-score into Sara's personal baseline zone.
 * Flagged sessions become `not_scored`; uncalibrated baselines become `building`.
 */
export function classifyZone(z: number | null, options: ClassifyZoneOptions): Zone {
  if (options.flagged) {
    return "not_scored";
  }
  if (options.direction === "none") {
    return "not_scored";
  }
  if (!options.ready || z === null) {
    return "building";
  }
  if (options.direction === "lower_is_worse") {
    if (z <= Z_ACT) return "act";
    if (z <= Z_WATCH) return "watch";
    return "in_zone";
  }
  // two_sided (BP systolic in M4): |z| >= 1.5 gives watch; never act
  if (Math.abs(z) >= BP_Z_WATCH) {
    return "watch";
  }
  return "in_zone";
}

/**
 * Maps a zone (and comparison direction) to the accessible Status object
 * containing level, text label, and iconKey.
 */
export function statusForZone(zone: Zone, direction: ZoneDirection = "lower_is_worse"): Status {
  switch (zone) {
    case "not_scored":
      return { level: "info", label: "Not scored", iconKey: "info" };
    case "building":
      return { level: "info", label: "Learning your normal", iconKey: "hourglass" };
    case "in_zone":
      return { level: "in_zone", label: "Within your normal", iconKey: "check" };
    case "watch":
      return direction === "two_sided"
        ? { level: "watch", label: "Different from your normal", iconKey: "eye" }
        : { level: "watch", label: "Slightly below your normal", iconKey: "eye" };
    case "act":
      return { level: "act", label: "Below your normal", iconKey: "alert" };
  }
}

export function buildZoneResult(params: {
  code: string;
  value: number;
  unit: string;
  z: number | null;
  zone: Zone;
  baseline: Baseline;
  status: Status;
}): ZoneResult {
  return {
    code: params.code,
    value: params.value,
    unit: params.unit,
    z: params.z,
    zone: params.zone,
    baseline: params.baseline,
    status: params.status,
  };
}
