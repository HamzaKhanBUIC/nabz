import { z } from "zod";
import { Disclaimer, SourceRef } from "./common";
import { ProcedureStep } from "./procedure";

export const RoutineCategory = z.enum(["hands", "tension", "blood-pressure"]);
export type RoutineCategory = z.infer<typeof RoutineCategory>;

const base = {
  id: z.string().min(1),
  version: z.number().int().positive(),
  category: RoutineCategory,
  title: z.string().min(1),
  summary: z.string().min(1),
  durationSeconds: z.number().int().positive(),
  steps: z.array(ProcedureStep).min(1),
  disclaimer: Disclaimer,
};

/** Verified routine JSON file in content/routines/<id>.json */
export const RoutineFile = z.strictObject({
  ...base,
  sourceIds: z.array(z.string().min(1)).min(1),
});
export type RoutineFile = z.infer<typeof RoutineFile>;

/** Routine object served by GET /api/routines. */
export const Routine = z.object({
  ...base,
  sources: z.array(SourceRef).min(1),
});
export type Routine = z.infer<typeof Routine>;

export const RoutineBundle = z.object({
  version: z.number().int().positive(),
  routines: z.array(Routine),
});
export type RoutineBundle = z.infer<typeof RoutineBundle>;
