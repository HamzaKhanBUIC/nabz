import { z } from "zod";
import { BpCategory } from "./bp";
import { IsoDateTime, Level, Status } from "./common";

/** E05. Each person decides whether the crew Medical Officer may see their daily summary. Off by default. */
export const ConsentInput = z.strictObject({ shareWithMedicalOfficer: z.boolean() });
export type ConsentInput = z.infer<typeof ConsentInput>;

/** One read of this person's summary by the Medical Officer. */
export const AccessLogEntry = z.object({
  viewerId: z.string().min(1),
  viewerName: z.string().min(1),
  at: IsoDateTime,
});
export type AccessLogEntry = z.infer<typeof AccessLogEntry>;

/** Response of GET and PUT /api/consent: the setting plus who has looked. */
export const ConsentResponse = z.object({
  shareWithMedicalOfficer: z.boolean(),
  accessLog: z.array(AccessLogEntry),
});
export type ConsentResponse = z.infer<typeof ConsentResponse>;

/**
 * What the Medical Officer may see about one crewmate who shared. An allow-list:
 * no raw trials, readings, notes or coach questions ever appear here.
 */
export const CrewHealthSummary = z.strictObject({
  missionDay: z.number().int().positive(),
  lastCheckinDay: z.number().int().positive().nullable(),
  reaction: Status.nullable(),
  bpCategory: BpCategory.nullable(),
  primaryCard: z.strictObject({ id: z.string().min(1), title: z.string().min(1), severity: Level }).nullable(),
  nextDue: IsoDateTime.nullable(),
});
export type CrewHealthSummary = z.infer<typeof CrewHealthSummary>;

export const CrewOverviewEntry = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  shared: z.boolean(),
  /** null when shared is false. */
  summary: CrewHealthSummary.nullable(),
});
export type CrewOverviewEntry = z.infer<typeof CrewOverviewEntry>;

/** Response of GET /api/crew/overview (Medical Officer only). Lists every crewmate except the viewer. */
export const CrewOverview = z.object({
  missionDay: z.number().int().positive(),
  crew: z.array(CrewOverviewEntry),
});
export type CrewOverview = z.infer<typeof CrewOverview>;
