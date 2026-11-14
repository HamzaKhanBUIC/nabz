import { z } from "zod";
import { BpReading } from "./bp";
import { Trial } from "./checkin";
import { IsoDateTime } from "./common";
import { CrewMember } from "./mission";

/** An event the simulator injected on purpose. Tests use these as ground truth. */
export const InjectedEvent = z.strictObject({
  id: z.string().min(1),
  startDay: z.number().int().positive(),
  endDay: z.number().int().positive(),
  description: z.string().min(1),
  basis: z.string().min(1),
});
export type InjectedEvent = z.infer<typeof InjectedEvent>;

/** One mission day for one person. A missed check-in or a day without a measurement is null. */
export const FixtureDay = z.strictObject({
  missionDay: z.number().int().positive(),
  /** Hours slept the night before this day. */
  sleepHours: z.number().min(0).max(16),
  restingHr: z.number().int().min(20).max(250),
  checkin: z
    .strictObject({
      startedAt: IsoDateTime,
      trials: z.array(Trial).min(1).max(400),
    })
    .nullable(),
  bp: z
    .strictObject({
      takenAt: IsoDateTime,
      readings: z.array(BpReading).min(1).max(3),
    })
    .nullable(),
});
export type FixtureDay = z.infer<typeof FixtureDay>;

/** data/fixtures/<subjectId>.json */
export const SubjectFixture = z.strictObject({
  meta: z.strictObject({
    kind: z.literal("simulated"),
    seed: z.number().int(),
    generatorVersion: z.string().min(1),
    events: z.array(InjectedEvent),
  }),
  subject: CrewMember,
  days: z.array(FixtureDay).min(1),
});
export type SubjectFixture = z.infer<typeof SubjectFixture>;
