import { z } from "zod";
import { SourceRef, Status } from "./common";

/** E03: NASA's five hazards of human spaceflight (research/CHECKS.md, R11). */
export const HazardId = z.enum([
  "space-radiation",
  "isolation-confinement",
  "distance-from-earth",
  "gravity-fields",
  "hostile-closed-environments",
]);
export type HazardId = z.infer<typeof HazardId>;

/** The short form every card carries. */
export const HazardRef = z.strictObject({ id: HazardId, name: z.string().min(1) });
export type HazardRef = z.infer<typeof HazardRef>;

/** content/hazards.json entry and GET /api/hazards item. */
export const Hazard = z.strictObject({
  id: HazardId,
  name: z.string().min(1),
  /** One sentence quoted from NASA's hazard page. */
  summary: z.string().min(1),
  url: z.url(),
  /** HRP risk IDs (Human Research Roadmap). Our grouping: a design choice, see CHECKS R11. */
  hrpRiskIds: z.array(z.number().int().positive()).min(1),
  /** What CrewPulse watches for this hazard, in plain words. */
  watches: z.string().min(1),
});
export type Hazard = z.infer<typeof Hazard>;

export const HazardFile = z.strictObject({
  version: z.number().int().positive(),
  hazards: z.array(Hazard).length(5),
});

export const HazardList = z.object({ hazards: z.array(Hazard).length(5) });

/** E06: mission environments. Guidance changes with the environment; thresholds never do (ADR 0003). */
export const EnvironmentId = z.enum(["iss", "moon", "mars-transit", "mars-surface", "remote-earth"]);
export type EnvironmentId = z.infer<typeof EnvironmentId>;

/** Keys into RADIATION_RATE_MSV_PER_DAY in src/core/constants.ts. */
export const RadiationRateKey = z.enum(["iss", "lunar-surface", "mars-transit", "mars-surface"]);
export type RadiationRateKey = z.infer<typeof RadiationRateKey>;

export const Environment = z.strictObject({
  id: EnvironmentId,
  name: z.string().min(1),
  oneWayDelay: z.strictObject({
    text: z.string().min(1),
    /** null when the source gives no figure (e.g. satellite links at a remote station). */
    minSeconds: z.number().nonnegative().nullable(),
    maxSeconds: z.number().nonnegative().nullable(),
  }),
  blackoutNote: z.string().min(1).nullable(),
  timeToCare: z.string().min(1),
  careLead: z.string().min(1),
  gravity: z.string().min(1),
  dayLengthHours: z.number().positive(),
  /** null: no verified dose rate for this environment. */
  radiationRateKey: RadiationRateKey.nullable(),
  /** Who to contact, shown on act and urgent cards and the emergency screen. */
  escalation: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
});
export type Environment = z.infer<typeof Environment>;

export const EnvironmentFile = z.strictObject({
  version: z.number().int().positive(),
  environments: z.array(Environment).length(5),
});

export const EnvironmentRef = z.strictObject({ id: EnvironmentId, name: z.string().min(1) });
export type EnvironmentRef = z.infer<typeof EnvironmentRef>;

/** Response of GET and PUT /api/environment. */
export const EnvironmentState = z.object({
  active: Environment,
  options: z.array(EnvironmentRef).length(5),
});
export type EnvironmentState = z.infer<typeof EnvironmentState>;

/** Body of PUT /api/environment (Commander only). */
export const EnvironmentInput = z.strictObject({ id: EnvironmentId });

/** E04: GET /api/radiation. An estimate from published averages, never a personal dosimeter reading. */
export const RadiationEstimate = z.object({
  environment: EnvironmentRef,
  missionDay: z.number().int().positive(),
  basis: z.literal("published-average"),
  dailyRateMsv: z.number().positive().nullable(),
  doseToDateMsv: z.number().nonnegative().nullable(),
  careerLimitMsv: z.literal(600),
  percentOfCareerLimit: z.number().nonnegative().nullable(),
  /** Whole days left at this rate before the career limit; 0 once reached. */
  daysUntilLimit: z.number().int().nonnegative().nullable(),
  note: z.string().min(1),
  sources: z.array(SourceRef).min(1),
  status: Status,
});
export type RadiationEstimate = z.infer<typeof RadiationEstimate>;
