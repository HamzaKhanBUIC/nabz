/**
 * Health math: baselines ("Normal Zone"), trends and status classification.
 *
 * All functions operate exclusively on real, recorded values passed in by
 * callers — nothing here fabricates history.
 */

/** Metric definitions used across charts, cards and reports. */
export const METRICS = {
  reaction: {
    key: "reaction",
    label: "Reaction time",
    shortLabel: "Reaction",
    unit: "ms",
    source: "checkIns",
    field: "reactionTimeMs",
    /** Lower values are better for reaction time. */
    lowerIsBetter: true,
    description: "Response speed during the reaction check-in.",
    axisDomainPad: 30,
  },
  sleep: {
    key: "sleep",
    label: "Sleep hours",
    shortLabel: "Sleep",
    unit: "h",
    source: "checkIns",
    field: "sleepHours",
    lowerIsBetter: false,
    description: "Self-reported sleep duration per check-in.",
    axisDomainPad: 1,
  },
  mood: {
    key: "mood",
    label: "Mood",
    shortLabel: "Mood",
    unit: "/5",
    source: "checkIns",
    field: "mood",
    lowerIsBetter: false,
    description: "Self-rated mood from 1 (low) to 5 (great).",
    axisDomainPad: 0.5,
    integer: true,
  },
  bloodPressure: {
    key: "bloodPressure",
    label: "Blood pressure (systolic)",
    shortLabel: "Blood pressure",
    unit: "mmHg",
    source: "measurements",
    field: "systolic",
    lowerIsBetter: true,
    description: "Systolic reading from a recorded measurement.",
    axisDomainPad: 8,
  },
};

export const METRIC_KEYS = Object.keys(METRICS);

export function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Computes a personal baseline from recorded values.
 * Returns null until at least MIN_BASELINE_SAMPLES samples exist, so we never
 * present a made-up "normal range".
 *
 * The normal zone is the mean ± 1 standard deviation (clamped so it stays
 * meaningful for small samples).
 */
export const MIN_BASELINE_SAMPLES = 3;

export function computeBaseline(values) {
  const clean = (values || []).filter((v) => typeof v === "number" && Number.isFinite(v));
  if (clean.length < MIN_BASELINE_SAMPLES) return null;
  const avg = mean(clean);
  const sd = standardDeviation(clean);
  return {
    count: clean.length,
    mean: avg,
    sd,
    lower: avg - sd,
    upper: avg + sd,
    min: Math.min(...clean),
    max: Math.max(...clean),
  };
}

/**
 * Classifies a value against a baseline.
 * @returns {"in-range" | "above" | "below" | "unknown"}
 */
export function classifyValue(value, baseline) {
  if (typeof value !== "number" || !baseline) return "unknown";
  if (value < baseline.lower) return "below";
  if (value > baseline.upper) return "above";
  return "in-range";
}

/** Human label + tone for a classification. */
export function classificationLabel(classification) {
  switch (classification) {
    case "in-range":
      return { label: "Inside normal range", tone: "ok" };
    case "above":
      return { label: "Above usual range", tone: "warn" };
    case "below":
      return { label: "Below usual range", tone: "warn" };
    default:
      return { label: "Building baseline", tone: "neutral" };
  }
}

/**
 * Metric-specific status wording (e.g. "Slower than usual" for reaction time).
 */
export function metricStatus(metricKey, value, baseline) {
  const metric = METRICS[metricKey];
  const classification = classifyValue(value, baseline);
  if (classification === "unknown" || !metric) {
    return { label: "Building baseline", tone: "neutral", classification };
  }
  if (classification === "in-range") {
    return { label: "Inside normal range", tone: "ok", classification };
  }
  const isAbove = classification === "above";
  const higherIsWorse = metric.lowerIsBetter === true;
  const worseDirection = higherIsWorse ? isAbove : !isAbove;

  switch (metricKey) {
    case "reaction":
      return {
        label: isAbove ? "Slower than usual" : "Faster than usual",
        tone: worseDirection ? "warn" : "ok",
        classification,
      };
    case "sleep":
      return {
        label: isAbove ? "More sleep than usual" : "Less sleep than usual",
        tone: worseDirection ? "warn" : "ok",
        classification,
      };
    case "mood":
      return {
        label: isAbove ? "Mood above baseline" : "Mood below baseline",
        tone: worseDirection ? "warn" : "ok",
        classification,
      };
    case "bloodPressure":
      return {
        label: isAbove ? "Higher than usual" : "Lower than usual",
        tone: worseDirection ? "warn" : "ok",
        classification,
      };
    default:
      return { label: "Outside normal range", tone: "warn", classification };
  }
}

/**
 * Trend direction from an ordered (oldest → newest) list of numbers.
 * Compares the most recent half against the earlier half.
 * @returns {"rising" | "falling" | "stable" | "unknown"}
 */
export function trendDirection(values) {
  const clean = (values || []).filter((v) => typeof v === "number");
  if (clean.length < 4) return "unknown";
  const split = Math.floor(clean.length / 2);
  const earlier = mean(clean.slice(0, split));
  const later = mean(clean.slice(split));
  if (earlier === null || later === null) return "unknown";
  const delta = later - earlier;
  const threshold = Math.max(Math.abs(earlier) * 0.05, 0.5);
  if (delta > threshold) return "rising";
  if (delta < -threshold) return "falling";
  return "stable";
}

/** Label for a trend given the metric's desirability direction. */
export function trendLabel(metricKey, trend) {
  const metric = METRICS[metricKey];
  if (trend === "unknown") return { label: "Not enough data", tone: "neutral" };
  if (trend === "stable") return { label: "Stable", tone: "ok" };
  const higherIsWorse = metric?.lowerIsBetter === true;
  const worse = higherIsWorse ? trend === "rising" : trend === "falling";
  const rising = trend === "rising";
  return {
    label: rising ? "Trending up" : "Trending down",
    tone: worse ? "warn" : "ok",
  };
}

/** Timestamp + value series for one metric, oldest first, from real records. */export function seriesForMetric(metricKey, records) {
  const metric = METRICS[metricKey];
  if (!metric) return [];
  return (records || [])
    .filter((r) => typeof r[metric.field] === "number" && r[metric.field] !== null)
    .map((r) => ({
      timestamp: r.timestamp,
      date: new Date(r.timestamp),
      value: r[metric.field],
      source: r.source || "recorded",
      id: r.id,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Filters a series to the last N days.
 * Requires an explicit clock (`now`) so no current-time read ever happens
 * during render/prerender. A falsy `now` skips filtering (pre-mount state).
 */
export function seriesWithinDays(series, days, now) {
  if (!now) return series;
  const cutoff = now.getTime() - days * 86_400_000;
  return series.filter((p) => p.date.getTime() >= cutoff);
}
