import type { Baseline, Status, Trend, TrendBand, TrendPoint, Zone } from "../schemas";
import {
  BASELINE_MIN_SESSIONS,
  BASELINE_WINDOW_SESSIONS,
  BP_Z_WATCH,
  Z_ACT,
  Z_WATCH,
} from "./constants";
import { classifyZone, statusForZone, type ZoneDirection } from "./zone";

export interface BaselineEntryInput {
  missionDay: number;
  effectiveDateTime: string;
  value: number;
  qcFlags?: readonly string[];
}

export interface FoldOptions {
  direction?: ZoneDirection;
  windowSessions?: number;
  minSessions?: number;
}

export interface ScoredEntry<T extends BaselineEntryInput = BaselineEntryInput> {
  entry: T;
  baseline: Baseline;
  z: number | null;
  zone: Zone;
  status: Status;
}

export interface BuildTrendOptions {
  direction?: ZoneDirection;
  unit?: string;
  subjectId?: string;
  source?: Trend["source"];
  referenceRange?: { low: number; high: number };
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

interface BaselineStats {
  baseline: Baseline;
  rawMean: number | null;
  rawSd: number | null;
}

function computeBaselineStats(
  values: readonly number[],
  windowSessions: number,
  minSessions: number,
): BaselineStats {
  const slice = values.slice(-windowSessions);
  const n = slice.length;

  if (n < 2) {
    return {
      baseline: { n, mean: null, sd: null, ready: false, windowSessions },
      rawMean: null,
      rawSd: null,
    };
  }

  let sum = 0;
  for (const v of slice) {
    sum += v;
  }
  const rawMean = sum / n;

  let sqDiffSum = 0;
  for (const v of slice) {
    sqDiffSum += (v - rawMean) ** 2;
  }
  const rawSd = Math.sqrt(sqDiffSum / (n - 1));
  const ready = n >= minSessions && rawSd > 0;

  if (!ready) {
    return {
      baseline: { n, mean: null, sd: null, ready: false, windowSessions },
      rawMean: null,
      rawSd: null,
    };
  }

  return {
    baseline: {
      n,
      mean: roundTo(rawMean, 4),
      sd: roundTo(rawSd, 4),
      ready: true,
      windowSessions,
    },
    rawMean,
    rawSd,
  };
}

/**
 * Folds chronological entries from oldest to newest, scoring each entry against
 * the rolling window of up to `windowSessions` earlier valid entries. For
 * two-sided series (blood pressure), off-normal `watch` outliers stay out of
 * later windows so a severe reading does not shift the normal band.
 */
export function foldHistory<T extends BaselineEntryInput>(
  entries: readonly T[],
  options: FoldOptions = {},
): Array<ScoredEntry<T>> {
  const direction: ZoneDirection = options.direction ?? "lower_is_worse";
  const windowSessions = options.windowSessions ?? BASELINE_WINDOW_SESSIONS;
  const minSessions = options.minSessions ?? BASELINE_MIN_SESSIONS;

  const sorted = [...entries].sort(
    (a, b) =>
      a.missionDay - b.missionDay || a.effectiveDateTime.localeCompare(b.effectiveDateTime),
  );

  const validValues: number[] = [];
  const results: Array<ScoredEntry<T>> = [];

  for (const entry of sorted) {
    const flagged = (entry.qcFlags?.length ?? 0) > 0;
    const stats = computeBaselineStats(validValues, windowSessions, minSessions);
    const { baseline, rawMean, rawSd } = stats;

    let rawZ: number | null = null;
    if (!flagged && baseline.ready && rawMean !== null && rawSd !== null) {
      rawZ = (entry.value - rawMean) / rawSd;
    }

    const zone = classifyZone(rawZ, {
      direction,
      ready: baseline.ready,
      flagged,
    });
    const z = direction === "none" || rawZ === null ? null : roundTo(rawZ, 4);
    const status = statusForZone(zone, direction);

    results.push({ entry, baseline, z, zone, status });

    // For a one-sided series (reaction speed), dropping `act` days censors only the
    // lower tail and ratchets the rolling baseline upward. Keep all QC-valid days
    // there; for a two-sided series (blood pressure), off-normal (`watch`) spikes
    // stay out of later windows so a severe reading does not become the normal.
    const offNormal = direction === "two_sided" && zone === "watch";
    if (!flagged && !offNormal) {
      validValues.push(entry.value);
      if (validValues.length > windowSessions) {
        validValues.shift();
      }
    }
  }

  return results;
}

function inferDirectionForCode(code: string): ZoneDirection {
  if (code === "reaction-speed") return "lower_is_worse";
  if (code === "bp-systolic") return "two_sided";
  return "none";
}

function defaultUnitForCode(code: string): string {
  switch (code) {
    case "reaction-speed":
      return "1/s";
    case "bp-systolic":
    case "bp-diastolic":
      return "mmHg";
    case "sleep-hours":
      return "h";
    default:
      return "unit";
  }
}

/**
 * Builds a `Trend` payload from folded entries, keeping the last `days` mission
 * days (if provided) and setting `band` from the final entry's baseline.
 */
export function buildTrend(
  code: string,
  scoredEntries: readonly ScoredEntry[],
  days?: number,
  options: BuildTrendOptions = {},
): Trend {
  const direction = options.direction ?? inferDirectionForCode(code);
  const unit = options.unit ?? defaultUnitForCode(code);
  const subjectId = options.subjectId ?? "sara";
  const source = options.source ?? "simulated";

  let visible = scoredEntries;
  if (days !== undefined && scoredEntries.length > 0) {
    const maxDay = scoredEntries[scoredEntries.length - 1]!.entry.missionDay;
    const cutoffDay = maxDay - days + 1;
    visible = scoredEntries.filter((item) => item.entry.missionDay >= cutoffDay);
  }

  const points: TrendPoint[] = visible.map((item) => ({
    missionDay: item.entry.missionDay,
    effectiveDateTime: item.entry.effectiveDateTime,
    value: item.entry.value,
    z: item.z,
    zone: item.zone,
    baselineMean: item.baseline.mean,
    baselineSd: item.baseline.sd,
  }));

  const last = scoredEntries.length > 0 ? scoredEntries[scoredEntries.length - 1]! : null;
  let band: TrendBand = {
    ready: false,
    mean: null,
    sd: null,
    watchAt: null,
    actAt: null,
  };

  if (last && last.baseline.ready && last.baseline.mean !== null && last.baseline.sd !== null) {
    const { mean, sd } = last.baseline;
    band = {
      ready: true,
      mean,
      sd,
      watchAt:
        direction === "lower_is_worse"
          ? roundTo(mean + Z_WATCH * sd, 4)
          : direction === "two_sided"
            ? roundTo(mean + BP_Z_WATCH * sd, 4)
            : null,
      actAt: direction === "lower_is_worse" ? roundTo(mean + Z_ACT * sd, 4) : null,
    };
  }

  return {
    code,
    unit,
    subjectId,
    source,
    points,
    band,
    ...(options.referenceRange ? { referenceRange: options.referenceRange } : {}),
  };
}
