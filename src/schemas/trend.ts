import { z } from "zod";
import { IsoDateTime, Zone } from "./common";

/** The series the Must chart can ask for. */
export const TrendCode = z.enum(["reaction-speed", "bp-systolic", "bp-diastolic", "sleep-hours"]);
export type TrendCode = z.infer<typeof TrendCode>;

export const TrendQuery = z.strictObject({
  code: TrendCode,
  days: z.coerce.number().int().min(7).max(120).default(30),
});
export type TrendQuery = z.infer<typeof TrendQuery>;

export const TrendPoint = z.object({
  missionDay: z.number().int(),
  effectiveDateTime: IsoDateTime,
  value: z.number(),
  z: z.number().nullable(),
  zone: Zone,
  baselineMean: z.number().nullable(),
  baselineSd: z.number().nullable(),
});
export type TrendPoint = z.infer<typeof TrendPoint>;

export const TrendBand = z.object({
  ready: z.boolean(),
  mean: z.number().nullable(),
  sd: z.number().nullable(),
  watchAt: z.number().nullable(),
  actAt: z.number().nullable(),
});
export type TrendBand = z.infer<typeof TrendBand>;

/** Response of GET /api/trends. */
export const Trend = z.object({
  code: z.string().min(1),
  unit: z.string().min(1),
  subjectId: z.string().min(1),
  /** simulated and live are Sara's own series; nasa-osd-569 is the real Inspiration4 file. */
  source: z.enum(["simulated", "live", "mixed", "nasa-osd-569"]),
  points: z.array(TrendPoint),
  band: TrendBand,
  referenceRange: z.object({ low: z.number(), high: z.number() }).optional(),
});
export type Trend = z.infer<typeof Trend>;
