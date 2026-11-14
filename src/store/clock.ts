export const DEFAULT_MISSION_NOW = "2026-11-15T08:00:00+00:00";

const MS_PER_DAY = 86_400_000;

function parseUtcDateStartMs(ymd: string): number {
  const [yStr, mStr, dStr] = ymd.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  return Date.UTC(y, m - 1, d);
}

/**
 * Returns the active mission clock ISO string: an explicit pinned test clock,
 * `process.env.MISSION_NOW`, or the fixed mission-day-120 default.
 */
export function getNowIso(pinnedNow?: string): string {
  const envNow = process.env.MISSION_NOW?.trim();
  if (pinnedNow) return pinnedNow;
  if (envNow) return envNow;
  return DEFAULT_MISSION_NOW;
}

/**
 * Computes 1-based mission day from `launchDate` (YYYY-MM-DD) and an ISO
 * date-time string, clamped to at least day 1.
 */
export function missionDayFromIso(launchDate: string, isoDateTime: string): number {
  const launchMs = parseUtcDateStartMs(launchDate);
  const targetDatePart = isoDateTime.slice(0, 10);
  const targetMs = parseUtcDateStartMs(targetDatePart);
  const day = Math.floor((targetMs - launchMs) / MS_PER_DAY) + 1;
  return Math.max(1, day);
}
