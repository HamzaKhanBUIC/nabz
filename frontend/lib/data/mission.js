/**
 * Central mission + crew configuration.
 *
 * Every value shown in the UI (mission day, mission name, communication
 * delay, reminders, ...) is read from this module so it stays configurable
 * and is never scattered across components.
 */

export const mission = {
  /** Shown verbatim in the top bar and Profile ("Day 120 · Mars transit"). */
  name: "Mars transit",
  phase: "Cruise",
  vehicle: "Odyssey Habitat",
  /** ISO date the mission clock started. Mission day is derived from this. */
  startDate: "2026-07-17T00:00:00.000Z",
  /** One-way Earth communication delay, in minutes (configurable). */
  earthDelayMinutes: 18,
  destination: "Mars",
};

/**
 * Legacy crew config used by the secondary screens. The Profile screens
 * (14 / 15) read from `lib/data/session` instead so edits persist.
 */
export const crewProfile = {
  firstName: "Sara",
  fullName: "Sara Khan",
  role: "Commander",
  callSign: "Vega",
  age: 41,
};

export const reminders = [
  {
    id: "hydration",
    title: "Hydration log",
    detail: "Record fluid intake for the second half of the day.",
    dueLabel: "Today, 18:00 ship time",
  },
  {
    id: "bp-window",
    title: "Blood pressure window",
    detail: "Weekly resting measurement is due before end of day.",
    dueLabel: "Due today",
    tone: "warn",
  },
];

export const coachDisclaimer =
  "AI Health Coach responses are informational only and never a medical diagnosis.";

/**
 * Returns the current mission day (1-based), derived from the start date.
 * @param {Date} [now]
 */
export function getMissionDay(now = new Date()) {
  const start = new Date(mission.startDate).getTime();
  const diff = Math.max(0, now.getTime() - start);
  const day = Math.floor(diff / 86_400_000) + 1;
  return day;
}

/**
 * Human friendly Earth communication delay label, e.g. "~18 min".
 */
export function getEarthDelayLabel() {
  const minutes = mission.earthDelayMinutes;
  return `~${minutes} min`;
}
