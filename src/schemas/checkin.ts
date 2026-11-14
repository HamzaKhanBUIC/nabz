import { z } from "zod";
import { Card } from "./card";
import { IsoDateTime, Status, Zone } from "./common";

export const PROTOCOL_ID = "pvt-b-3min";

/** Settings for the tap test. The frontend reads these; it hardcodes nothing. */
export const Protocol = z.object({
  protocolId: z.literal(PROTOCOL_ID),
  durationMs: z.number().int().positive(),
  isiMinMs: z.number().int().positive(),
  isiMaxMs: z.number().int().positive(),
  feedbackMs: z.number().int().nonnegative(),
  lapseMs: z.number().int().positive(),
  falseStartMs: z.number().int().positive(),
  noResponseTimeoutMs: z.number().int().positive(),
});
export type Protocol = z.infer<typeof Protocol>;

/**
 * One target (or one early tap).
 * early: true                  -> tapped before the target appeared; rtMs must be null
 * early: false, rtMs: null     -> no response before the timeout
 * early: false, rtMs: number   -> whole milliseconds from target onset to the tap
 */
export const Trial = z
  .strictObject({
    i: z.number().int().nonnegative(),
    isiMs: z.number().int().min(0).max(60_000),
    rtMs: z.number().int().min(1).max(60_000).nullable(),
    early: z.boolean(),
  })
  .refine((t) => !t.early || t.rtMs === null, { message: "An early tap has no reaction time: rtMs must be null." });
export type Trial = z.infer<typeof Trial>;

/** Request body of POST /api/checkins. Unknown fields are rejected; the server computes every score. */
export const CheckinInput = z.strictObject({
  protocolId: z.literal(PROTOCOL_ID),
  startedAt: IsoDateTime,
  trials: z.array(Trial).min(1).max(400),
  sleepHours: z.number().min(0).max(16).optional(),
});
export type CheckinInput = z.infer<typeof CheckinInput>;

export const PvtMetrics = z.object({
  stimuli: z.number().int().nonnegative(),
  validResponses: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  falseStarts: z.number().int().nonnegative(),
  /** Mean of 1000 / rtMs: responses per second. The metric the zone uses. */
  meanSpeed: z.number().nonnegative(),
  medianRtMs: z.number().nonnegative().nullable(),
  /** 0–100. */
  performanceScore: z.number().min(0).max(100),
});
export type PvtMetrics = z.infer<typeof PvtMetrics>;

export const Baseline = z.object({
  n: z.number().int().nonnegative(),
  mean: z.number().nullable(),
  sd: z.number().nullable(),
  ready: z.boolean(),
  windowSessions: z.number().int().positive(),
});
export type Baseline = z.infer<typeof Baseline>;

export const ZoneResult = z.object({
  code: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  z: z.number().nullable(),
  zone: Zone,
  baseline: Baseline,
  status: Status,
});
export type ZoneResult = z.infer<typeof ZoneResult>;

export const EntrySource = z.enum(["simulated", "live"]);

export const Checkin = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  missionDay: z.number().int().positive(),
  effectiveDateTime: IsoDateTime,
  protocolId: z.literal(PROTOCOL_ID),
  metrics: PvtMetrics,
  sleepHours: z.number().nullable(),
  qcFlags: z.array(z.string()),
  zone: ZoneResult,
  source: EntrySource,
});
export type Checkin = z.infer<typeof Checkin>;

/** Response of POST /api/checkins. */
export const CheckinResponse = Checkin.extend({ card: Card });
export type CheckinResponse = z.infer<typeof CheckinResponse>;
