import { z } from "zod";
import { BpMeasurement } from "./bp";
import { Card } from "./card";
import { CheckinResponse } from "./checkin";
import { IsoDateTime } from "./common";
import { EnvironmentRef } from "./environment";

export const CrewMember = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
});

/** data/fixtures/mission.json */
export const MissionFile = z.strictObject({
  name: z.string().min(1),
  profile: z.literal("mars-transit"),
  /** Calendar date of mission day 1, YYYY-MM-DD. */
  launchDate: z.iso.date(),
  commsDelay: z.strictObject({
    oneWayMinMinutes: z.number().positive(),
    oneWayMaxMinutes: z.number().positive(),
  }),
  crew: z.array(CrewMember).min(1),
  /** Other profiles are stored as data only; nothing switches to them. */
  otherProfiles: z
    .array(z.strictObject({ profile: z.string().min(1), oneWayDelaySeconds: z.number().nonnegative() }))
    .optional(),
});
export type MissionFile = z.infer<typeof MissionFile>;

/** Response of GET /api/mission. */
export const Mission = z.object({
  name: z.string().min(1),
  profile: z.literal("mars-transit"),
  launchDate: z.iso.date(),
  missionDay: z.number().int().positive(),
  commsDelay: z.object({
    oneWayMinMinutes: z.number().positive(),
    oneWayMaxMinutes: z.number().positive(),
  }),
  crew: z.array(CrewMember).min(1),
  /** E06: the active environment (GET /api/environment has the full profile). */
  environment: EnvironmentRef,
});
export type Mission = z.infer<typeof Mission>;

/** Response of GET /api/today. card is the most severe of today's cards, or null if nothing was done today. */
export const Today = z.object({
  missionDay: z.number().int().positive(),
  checkin: CheckinResponse.nullable(),
  bp: BpMeasurement.nullable(),
  card: Card.nullable(),
  cards: z.array(Card),
  /** Reserved for the check-up reminder; null until that feature is built. */
  nextDue: IsoDateTime.nullable(),
});
export type Today = z.infer<typeof Today>;
