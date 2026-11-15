/**
 * Clearly separated demo dataset.
 *
 * This is NOT recorded user data. Every record produced here carries
 * `source: "demo"` so the UI can label it, and it is only ever added when the
 * user explicitly asks for it (e.g. from an empty state).
 *
 * The values are a fixed, hand-authored sequence (deterministic — never
 * generated at random each load) so demos stay predictable. It exists solely
 * to preview charts before real measurements exist.
 */

const DAYS = 14;

/** Fixed per-day factors — deterministic, no Math.random anywhere. */
const DAY_FACTORS = [
  { reaction: 1.0, sleep: 0.98, mood: 0.9, bp: 1.02 },
  { reaction: 0.97, sleep: 1.02, mood: 1.0, bp: 1.0 },
  { reaction: 1.03, sleep: 0.94, mood: 0.8, bp: 1.04 },
  { reaction: 0.99, sleep: 1.0, mood: 1.0, bp: 0.99 },
  { reaction: 1.05, sleep: 0.92, mood: 0.8, bp: 1.05 },
  { reaction: 0.98, sleep: 1.04, mood: 1.0, bp: 1.0 },
  { reaction: 0.96, sleep: 1.06, mood: 1.2, bp: 0.98 },
  { reaction: 1.01, sleep: 0.97, mood: 0.9, bp: 1.01 },
  { reaction: 1.06, sleep: 0.9, mood: 0.6, bp: 1.06 },
  { reaction: 1.02, sleep: 0.95, mood: 0.8, bp: 1.03 },
  { reaction: 0.98, sleep: 1.03, mood: 1.0, bp: 0.99 },
  { reaction: 0.97, sleep: 1.05, mood: 1.1, bp: 0.98 },
  { reaction: 1.0, sleep: 1.0, mood: 1.0, bp: 1.0 },
  { reaction: 0.99, sleep: 1.01, mood: 1.0, bp: 1.0 },
];

const BASE_REACTION = 248;
const BASE_SLEEP = 7.2;
const BASE_MOOD = 4;
const BASE_SYSTOLIC = 118;
const BASE_DIASTOLIC = 76;
const BASE_PULSE = 62;

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** @returns {{checkIns: Array, moodLogs: Array, measurements: Array}} */
export function buildDemoDataset() {
  const checkIns = [];
  const moodLogs = [];
  const measurements = [];

  const now = Date.now();

  for (let i = 0; i < DAYS; i += 1) {
    const factor = DAY_FACTORS[i];
    const dayStart = new Date(now - (DAYS - 1 - i) * 86_400_000);
    // Morning check-in at 07:30 local time on that day.
    const checkInDate = new Date(dayStart);
    checkInDate.setHours(7, 30, 0, 0);

    const mood = Math.min(5, Math.max(1, Math.round(BASE_MOOD * factor.mood)));
    const reactionTimeMs = Math.round(BASE_REACTION * factor.reaction);
    const sleepHours = round(Math.min(9.5, Math.max(5, BASE_SLEEP * factor.sleep)), 1);

    checkIns.push({
      id: `demo_chk_${i}`,
      timestamp: checkInDate.toISOString(),
      source: "demo",
      reactionTimeMs,
      sleepHours,
      mood,
    });

    moodLogs.push({
      id: `demo_mood_${i}`,
      timestamp: new Date(checkInDate.getTime() + 60_000).toISOString(),
      source: "demo",
      mood,
    });

    // Blood pressure every other day, 08:15.
    if (i % 2 === 0) {
      const bpDate = new Date(checkInDate);
      bpDate.setHours(8, 15, 0, 0);
      measurements.push({
        id: `demo_bp_${i}`,
        timestamp: bpDate.toISOString(),
        source: "demo",
        systolic: Math.round(BASE_SYSTOLIC * factor.bp),
        diastolic: Math.round(BASE_DIASTOLIC * factor.bp),
        pulse: Math.round(BASE_PULSE + (factor.bp - 1) * 40),
        posture: "Seated, resting 5 min",
      });
    }
  }

  return { checkIns, moodLogs, measurements };
}

/** Mock AI Health Coach replies — clearly identified as placeholder output. */
export const DEMO_COACH_RESPONSES = {
  default:
    "Placeholder response — the AI Health Coach backend is not connected yet. Once the LLM service is integrated, this reply will be generated from your real check-in and measurement history.",
  serious:
    "Placeholder response — I can't assess severity yet. When the health model is connected I will compare this against your personal Normal Zone and flag anything that needs Earth's medical team.",
  worse:
    "Placeholder response — with the real backend I will explain what to monitor, when to re-measure, and when to escalate this symptom.",
  earth:
    "Placeholder response — the real coach will draft a recommendation on what to share with Earth, using your consent settings from the Send to Earth page.",
};
