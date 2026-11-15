import { iconNameForKey, statusToBadgeTone, zoneToLabel } from "@/lib/api";

export const METRICS = {
  "reaction-speed": {
    code: "reaction-speed",
    key: "reaction-speed",
    label: "Reaction speed",
    shortLabel: "Reaction",
    unit: "resp/s",
    precision: 2,
    directionLabel: "Higher is faster",
    color: "#5FA8FF",
    description: "PVT-B mean reciprocal speed (1000 / reaction time).",
  },
  "sleep-hours": {
    code: "sleep-hours",
    key: "sleep-hours",
    label: "Sleep duration",
    shortLabel: "Sleep",
    unit: "h",
    precision: 1,
    directionLabel: "Self-reported pre-check-in",
    color: "#A78BFA",
    description: "Total sleep duration logged with daily check-in.",
  },
  "bp-systolic": {
    code: "bp-systolic",
    key: "bp-systolic",
    label: "Blood pressure (systolic)",
    shortLabel: "Systolic BP",
    unit: "mmHg",
    precision: 0,
    directionLabel: "Upper arterial pressure",
    color: "#34D399",
    description: "Average resting systolic pressure per session.",
  },
  "bp-diastolic": {
    code: "bp-diastolic",
    key: "bp-diastolic",
    label: "Blood pressure (diastolic)",
    shortLabel: "Diastolic BP",
    unit: "mmHg",
    precision: 0,
    directionLabel: "Lower arterial pressure",
    color: "#FBBF24",
    description: "Average resting diastolic pressure per session.",
  },
};

export const METRIC_KEYS = Object.keys(METRICS);

export function formatMetricValue(code, value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const metric = METRICS[code];
  const digits = metric ? metric.precision : 1;
  return Number(value).toFixed(digits);
}

/**
 * Maps a server-scored TrendPoint and TrendBand to display pill props.
 * Zero client baseline math: uses only `point.zone` and `band.ready`.
 */
export function pointStatus(point, band) {
  if (!point) {
    return {
      level: "info",
      badgeTone: "neutral",
      label: "No data",
      iconKey: "info",
      iconName: "info",
    };
  }
  const zone = !band?.ready && point.zone === "building" ? "building" : point.zone;
  const label = zoneToLabel(zone);
  const level =
    zone === "in_zone"
      ? "in_zone"
      : zone === "watch"
        ? "watch"
        : zone === "act"
          ? "act"
          : "info";
  const iconKey =
    zone === "in_zone"
      ? "check"
      : zone === "watch"
        ? "eye"
        : zone === "act"
          ? "alert"
          : zone === "building"
            ? "hourglass"
            : "info";

  return {
    level,
    badgeTone: statusToBadgeTone(level),
    label,
    iconKey,
    iconName: iconNameForKey(iconKey),
  };
}
