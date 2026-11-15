import { iconNameForKey, statusToBadgeTone, zoneToLabel } from "@/lib/api";

export const METRICS = {
  "reaction-speed": {
    code: "reaction-speed",
    key: "reaction-speed",
    label: "Reaction speed",
    shortLabel: "Reaction",
    unit: "taps/s",
    precision: 2,
    directionLabel: "Higher is faster",
    color: "#5FA8FF",
    description: "How fast you tap in the 3-minute check-in. Higher is faster.",
  },
  "sleep-hours": {
    code: "sleep-hours",
    key: "sleep-hours",
    label: "Sleep duration",
    shortLabel: "Sleep",
    unit: "h",
    precision: 1,
    directionLabel: "What you logged",
    color: "#A78BFA",
    description: "Hours of sleep you logged with your check-in.",
  },
  "bp-systolic": {
    code: "bp-systolic",
    key: "bp-systolic",
    label: "Blood pressure (systolic)",
    shortLabel: "Systolic BP",
    unit: "mmHg",
    precision: 0,
    directionLabel: "Top number",
    color: "#34D399",
    description: "The top number of your blood pressure, at rest.",
  },
  "bp-diastolic": {
    code: "bp-diastolic",
    key: "bp-diastolic",
    label: "Blood pressure (diastolic)",
    shortLabel: "Diastolic BP",
    unit: "mmHg",
    precision: 0,
    directionLabel: "Bottom number",
    color: "#FBBF24",
    description: "The bottom number of your blood pressure, at rest.",
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

export const BP_CATEGORY_LABELS = {
  low: "Low",
  normal: "Normal",
  elevated: "Elevated",
  stage1: "Stage 1",
  stage2: "Stage 2",
  severe: "Severe",
};

export function formatBpCategory(category) {
  if (!category) return "No reading yet";
  return BP_CATEGORY_LABELS[category] || String(category);
}

export function severityStatus(level) {
  switch (level) {
    case "in_zone":
      return {
        level: "in_zone",
        badgeTone: statusToBadgeTone("in_zone"),
        label: "Normal",
        iconKey: "check",
        iconName: iconNameForKey("check"),
      };
    case "watch":
      return {
        level: "watch",
        badgeTone: statusToBadgeTone("watch"),
        label: "Watch",
        iconKey: "eye",
        iconName: iconNameForKey("eye"),
      };
    case "act":
      return {
        level: "act",
        badgeTone: statusToBadgeTone("act"),
        label: "Act",
        iconKey: "alert",
        iconName: iconNameForKey("alert"),
      };
    case "urgent":
      return {
        level: "urgent",
        badgeTone: statusToBadgeTone("urgent"),
        label: "Urgent",
        iconKey: "siren",
        iconName: iconNameForKey("siren"),
      };
    case "info":
    default:
      return {
        level: "info",
        badgeTone: statusToBadgeTone("info"),
        label: "Info",
        iconKey: "info",
        iconName: iconNameForKey("info"),
      };
  }
}
