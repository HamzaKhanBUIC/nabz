import type { ReminderItem, ReminderSchedule, RemindersResponse } from "../schemas";
import {
  DEFAULT_BP_INTERVAL_DAYS,
  DEFAULT_BP_REMINDER_UTC,
  DEFAULT_CHECKIN_REMINDER_UTC,
} from "./constants";

const MS_PER_DAY = 86_400_000;

export const DEFAULT_REMINDER_SCHEDULE: ReminderSchedule = {
  enabled: true,
  checkinTimeUtc: DEFAULT_CHECKIN_REMINDER_UTC,
  bpIntervalDays: DEFAULT_BP_INTERVAL_DAYS,
  bpTimeUtc: DEFAULT_BP_REMINDER_UTC,
};

export interface ReminderHistoryContext {
  launchDate: string;
  missionDay: number;
  nowIso: string;
  hasTodayCheckin: boolean;
  lastBpMissionDay: number | null;
}

function missionDateYmd(launchDate: string, missionDay: number): string {
  const [yStr, mStr, dStr] = launchDate.split("-");
  const utcMs =
    Date.UTC(Number(yStr), Number(mStr) - 1, Number(dStr)) + (missionDay - 1) * MS_PER_DAY;
  return new Date(utcMs).toISOString().slice(0, 10);
}

function utcIsoForMissionDay(launchDate: string, missionDay: number, hhmmUtc: string): string {
  return `${missionDateYmd(launchDate, missionDay)}T${hhmmUtc}:00+00:00`;
}

/**
 * Computes check-in and blood pressure reminder due items and the earliest `nextDue`
 * timestamp. Pure deterministic function; caller supplies clock and summary counts.
 */
export function computeReminders(
  context: ReminderHistoryContext,
  schedule: ReminderSchedule = DEFAULT_REMINDER_SCHEDULE,
): RemindersResponse {
  const nowMs = Date.parse(context.nowIso);

  const checkinDueDay = context.hasTodayCheckin ? context.missionDay + 1 : context.missionDay;
  const checkinDueAt = utcIsoForMissionDay(
    context.launchDate,
    checkinDueDay,
    schedule.checkinTimeUtc,
  );
  const checkinReason = context.hasTodayCheckin
    ? `Today's check-in is complete. Next check-in scheduled for mission day ${checkinDueDay}.`
    : `Daily 3-minute PVT-B check-in due for mission day ${context.missionDay}.`;

  const checkinItem: ReminderItem = {
    kind: "checkin",
    label: "Daily reaction check-in (3 min)",
    dueAt: checkinDueAt,
    overdue: schedule.enabled && nowMs > Date.parse(checkinDueAt),
    reason: checkinReason,
  };

  let bpDueDay: number;
  let bpReason: string;
  if (context.lastBpMissionDay === null) {
    bpDueDay = context.missionDay;
    bpReason = "No blood pressure measurement recorded yet.";
  } else {
    bpDueDay = context.lastBpMissionDay + schedule.bpIntervalDays;
    bpReason =
      bpDueDay <= context.missionDay
        ? `Blood pressure due every ${schedule.bpIntervalDays} days (last recorded on mission day ${context.lastBpMissionDay}).`
        : `Last checked on mission day ${context.lastBpMissionDay}. Next check on mission day ${bpDueDay}.`;
  }

  const bpDueAt = utcIsoForMissionDay(context.launchDate, bpDueDay, schedule.bpTimeUtc);
  const bpItem: ReminderItem = {
    kind: "bp",
    label: `Guided blood pressure check (every ${schedule.bpIntervalDays} d)`,
    dueAt: bpDueAt,
    overdue: schedule.enabled && nowMs > Date.parse(bpDueAt),
    reason: bpReason,
  };

  const items: ReminderItem[] = [checkinItem, bpItem].sort(
    (a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt),
  );

  const nextDue = schedule.enabled && items.length > 0 ? items[0]!.dueAt : null;

  return {
    version: 1,
    schedule,
    nextDue,
    items,
  };
}

/** Convenience helper returning the earliest next-due timestamp (or null if disabled). */
export function nextDue(
  context: ReminderHistoryContext,
  schedule: ReminderSchedule = DEFAULT_REMINDER_SCHEDULE,
): string | null {
  return computeReminders(context, schedule).nextDue;
}
