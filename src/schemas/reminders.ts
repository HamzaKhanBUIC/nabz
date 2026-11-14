import { z } from "zod";
import { IsoDateTime } from "./common";

export const TimeUtcString = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM 24-hour UTC time");

export const ReminderSchedule = z.strictObject({
  enabled: z.boolean(),
  checkinTimeUtc: TimeUtcString,
  bpIntervalDays: z.number().int().min(1).max(30),
  bpTimeUtc: TimeUtcString,
});
export type ReminderSchedule = z.infer<typeof ReminderSchedule>;

export const ReminderKind = z.enum(["checkin", "bp"]);
export type ReminderKind = z.infer<typeof ReminderKind>;

export const ReminderItem = z.object({
  kind: ReminderKind,
  label: z.string().min(1),
  dueAt: IsoDateTime,
  overdue: z.boolean(),
  reason: z.string().min(1),
});
export type ReminderItem = z.infer<typeof ReminderItem>;

export const RemindersResponse = z.object({
  version: z.literal(1),
  schedule: ReminderSchedule,
  nextDue: IsoDateTime.nullable(),
  items: z.array(ReminderItem),
});
export type RemindersResponse = z.infer<typeof RemindersResponse>;
