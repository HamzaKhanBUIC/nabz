/**
 * Derived-data selectors.
 *
 * Components read charts, summaries and baselines through these functions so
 * all data logic stays out of the UI layer. Everything here operates on real
 * records passed in from the store — nothing is fabricated.
 */

import {
  METRICS,
  computeBaseline,
  seriesForMetric,
  seriesWithinDays,
} from "@/lib/utils/health";

const byNewest = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);

/** All mood values (from full check-ins + quick taps), oldest → newest. */
export function getMoodSeries(checkIns, moodLogs) {
  const fromCheckIns = (checkIns || [])
    .filter((c) => typeof c.mood === "number")
    .map((c) => ({
      id: c.id,
      timestamp: c.timestamp,
      date: new Date(c.timestamp),
      value: c.mood,
      source: c.source || "recorded",
    }));
  const fromLogs = (moodLogs || [])
    .filter((m) => typeof m.mood === "number")
    .map((m) => ({
      id: m.id,
      timestamp: m.timestamp,
      date: new Date(m.timestamp),
      value: m.mood,
      source: m.source || "recorded",
    }));
  return [...fromCheckIns, ...fromLogs].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

/** Combined records for a metric, sorted newest first. */
export function getMetricSeries(metricKey, storeData) {
  const metric = METRICS[metricKey];
  if (!metric) return [];

  if (metricKey === "mood") {
    return getMoodSeries(storeData.checkIns, storeData.moodLogs);
  }
  const records =
    metric.source === "measurements"
      ? storeData.measurements
      : storeData.checkIns;
  return seriesForMetric(metricKey, records);
}

/** Baseline ("Normal Zone") for a metric from recorded values only. */
export function getBaseline(metricKey, storeData) {
  const series = getMetricSeries(metricKey, storeData);
  return computeBaseline(series.map((p) => p.value));
}

/** Latest recorded value for a metric (newest first). */
export function getLatestValue(metricKey, storeData) {
  const series = getMetricSeries(metricKey, storeData);
  if (!series.length) return null;
  return series[series.length - 1];
}

/**
 * Value series filtered to a day range, oldest → newest.
 * `now` must be supplied by the caller (no implicit current-time read).
 * When `now` is falsy (before mount), the full series is returned.
 */
export function getRange(metricKey, storeData, days, now) {
  return seriesWithinDays(getMetricSeries(metricKey, storeData), days, now);
}

/** Last N days of check-ins, newest first. Requires an explicit `now`. */
export function getRecentCheckIns(checkIns, days = 28, now) {
  if (!now) return [...(checkIns || [])].sort(byNewest);
  const cutoff = now.getTime() - days * 86_400_000;
  return [...(checkIns || [])]
    .filter((c) => new Date(c.timestamp).getTime() >= cutoff)
    .sort(byNewest);
}

/** Latest record across all data types — powers "Latest action" cards. */
export function getLatestActivity(storeData) {
  const candidates = [
    ...storeData.checkIns.map((r) => ({
      type: "check-in",
      label: "Check-in recorded",
      detail: `${r.reactionTimeMs ?? "—"} ms · ${r.sleepHours ?? "—"} h sleep`,
      timestamp: r.timestamp,
      source: r.source,
      href: "/check-in",
    })),
    ...storeData.measurements.map((r) => ({
      type: "measurement",
      label: "Blood pressure recorded",
      detail: `${r.systolic}/${r.diastolic} mmHg`,
      timestamp: r.timestamp,
      source: r.source,
      href: "/measure",
    })),
    ...storeData.moodLogs.map((r) => ({
      type: "mood",
      label: "Mood logged",
      detail: `Mood ${r.mood} of 5`,
      timestamp: r.timestamp,
      source: r.source,
      href: "/",
    })),
    ...storeData.reports.map((r) => ({
      type: "report",
      label: "Report prepared for Earth",
      detail: "Health summary",
      timestamp: r.timestamp,
      source: r.source,
      href: "/send-to-earth",
    })),
  ];

  candidates.sort(byNewest);
  return candidates[0] || null;
}

/**
 * Overall health status headline for the dashboard:
 * derives from the freshest metric readings vs their baselines.
 */
export function getOverallStatus(storeData) {
  const metricKeys = ["reaction", "sleep", "mood", "bloodPressure"];
  const readings = metricKeys
    .map((key) => {
      const latest = getLatestValue(key, storeData);
      const baseline = getBaseline(key, storeData);
      return latest && baseline ? { key, latest, baseline } : null;
    })
    .filter(Boolean);

  if (!readings.length) {
    return {
      tone: "neutral",
      title: "No readings yet",
      detail: "Complete your first check-in to establish your Normal Zone.",
      readings: [],
    };
  }

  // Any reading above its range gets priority attention.
  const attention = readings.filter(({ key, latest, baseline }) => {
    if (latest.value > baseline.upper) return true;
    if (latest.value < baseline.lower) return true;
    return false;
  });

  if (attention.length > 0) {
    return {
      tone: "warn",
      title: "Worth watching",
      detail: `${attention.length} metric${attention.length > 1 ? "s are" : " is"} outside your normal range.`,
      readings,
    };
  }

  return {
    tone: "ok",
    title: "Inside normal range",
    detail: "All recent readings are within your personal Normal Zone.",
    readings,
  };
}

/** Demo records exist anywhere in the store? */
export function hasAnyDemoData(storeData) {
  return (
    storeData.checkIns.some((r) => r.source === "demo") ||
    storeData.moodLogs.some((r) => r.source === "demo") ||
    storeData.measurements.some((r) => r.source === "demo")
  );
}

/** Has the user recorded anything real yet? */
export function hasAnyRecordedData(storeData) {
  return (
    storeData.checkIns.some((r) => r.source !== "demo") ||
    storeData.moodLogs.some((r) => r.source !== "demo") ||
    storeData.measurements.some((r) => r.source !== "demo")
  );
}
